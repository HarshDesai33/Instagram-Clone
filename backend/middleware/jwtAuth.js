const mongoose = require("mongoose");
const userModel = mongoose.model("user");
const jwt = require("jsonwebtoken");
const { jwt_secret } = require("../db");

module.exports = function (req, res, next) {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const token = authHeader.replace("Bearer ", "");
  let decodedToken;

  try {
    decodedToken = jwt.verify(token, jwt_secret);
    const { _id } = decodedToken; // Extract _id from payload
    userModel
      .findById(_id)
      .then((userdata) => {
        if (!userdata) {
          return res.status(401).json({ error: "User not found" });
        }
        req.user = userdata; // set user data in request object
        next(); // proceed to the next middleware/route handler
      })
      .catch((err) => {
        console.error("Error finding user:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      });
  } catch (err) {
    console.error("Error verifying token:", err);
    return res.status(401).json({ error: "Not Authenticate" });
  }
};
