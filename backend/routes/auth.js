const express = require("express");
const router = express.Router();
// const userModel = require("../models/user");
const mongoose = require("mongoose");
const userModel = mongoose.model("user");
const postModel = require("../models/posts");
// const passport = require("passport");
const localStrategy = require("passport-local");
// const LocalStrategy = require("passport-local").Strategy;
const passport = require("../middleware/passport-local");
const bcrypt = require("bcrypt");
const upload = require("./multer");
const jwt = require("jsonwebtoken");
const { jwt_secret } = require("../db");
const jwtAuth = require("../middleware/jwtAuth");

passport.use(new localStrategy(userModel.authenticate()));

router.get("/", function (req, res) {
  res.send("hey");
});

// register route
router.post("/register", async function (req, res) {
  try {
    const { username, password, name, email } = req.body;

    if (!username || !password || !name || !email) {
      return res.status(422).json({ error: "Please fill all the fields" });
    }

    // Check if the user already exists
    const existingUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res.status(422).json({ error: "User already exists" });
    }

    // Create a new user
    const newUser = new userModel({ username, password, name, email });
    await newUser.save();

    res.status(200).json({ message: "Registered Successfully!!" });
  } catch (err) {
    console.log("error occurred while register user ::: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// login route
router.post("/login", async function (req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(422).json({ error: "Please fill all the fields" });
  }

  try {
    const user = await userModel.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign({ _id: user._id }, jwt_secret);

    user.token = token;
    await user.save();

    const { _id, name, bio, picture, followers, following, posts, email } =
      user;

    res.json({
      message: "Login successful",
      token,
      user: {
        _id,
        name,
        username,
        bio,
        picture,
        followers,
        following,
        posts,
        email,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// logout route
router.get("/logout", function (req, res) {
  req.logout();
  res.json({ message: "Logout successful" });
});

// Protected route
router.get("/protected", function (req, res) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json({ message: "Protected data accessed successfully" });
});

// route for edit user data
router.get("/editdata", jwtAuth, async function (req, res) {
  const user = await userModel
    .findOne({ username: req.user.username })
    .then((data) => {
      res.json(data);
      // console.log("dataaaaaaaaaa", data);
    });
  // console.log(user);
});

// route for updating user data
router.post("/updatedata", jwtAuth, async function (req, res) {
  const { username, name, email, bio, uploadPic } = req.body;
  if (!username) {
    res.json({ error: "Please fill all the fields" });
  }
  // console.log("existingUser", existingUser);
  const user = await userModel
    .findOneAndUpdate(
      { username: req.user.username },
      { username, name, email, bio, picture: uploadPic },
      { new: true }
    )
    .then(async (data) => {
      res.json({ message: "Data updated successfully", data });
    })
    .catch((err) => {
      res.json({ error: "Something went wrong" });
      console.log("Error while editing data", err);
    });
});

router.get("/loggedUser", jwtAuth, async function (req, res) {
  const user = await userModel
    .findOne(req.user._id)
    .select("-password -token")
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
