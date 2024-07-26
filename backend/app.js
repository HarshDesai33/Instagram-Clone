require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const PORT = 5000;
const mongoose = require("mongoose");
const { mongoUrl } = require("./db");
const userModel = require("./models/user");
const cors = require("cors");
const expressSession = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongo");

// Create an instance of the server
const server = http.createServer(app);

// Set up Socket.io
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("id", socket.id);
});

// Configure session middleware with MongoStore
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "secret key",
    cookie: { maxAge: 60000 },
    store: new MongoStore({
      mongoUrl: mongoUrl,
      ttl: 14 * 24 * 60 * 60, // =14 days
      autoRemove: "native",
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

app.use(cors());

// Connect to the MongoDB database
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log("error occurred while connecting database ::::::: ", err);
  });

// Middleware to parse incoming requests
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Include your routes
app.use(require("./routes/auth"));
app.use(require("./routes/createPost"));
app.use(require("./routes/userProfile"));

// Start the server
server.listen(PORT, () => {
  console.log("app is running on port " + PORT);
});
