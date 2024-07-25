const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const { jwt_secret } = require("../db");
const userModel = require("../models/user");

passport.use(
  new LocalStrategy(
    { usernameField: "username", passwordField: "password" },
    async function (username, password, done) {
      try {
        const user = await userModel.findOne({ username });
        if (!user || !(await user.validPassword(password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        const token = jwt.sign({ _id: user._id }, jwt_secret);
        return done(null, token);
      } catch (err) {
        return done(err);
      }
    }
  )
);

module.exports = passport;
