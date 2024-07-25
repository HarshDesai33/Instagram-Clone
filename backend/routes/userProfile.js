const express = require("express");
const app = express();
const http = require("http");
const router = express.Router();
const jwtAuth = require("../middleware/jwtAuth");
const { jwt_secret } = require("../db");
const cloudinary = require("cloudinary").v2;
const upload = require("./multer");

const mongoose = require("mongoose");
const postModel = require("../models/posts");
const userModel = require("../models/user");
const storyModel = require("../models/story");
const db = require("../db");

const server = http.createServer(app);

// routr for other user profile
router.get("/user/:id", jwtAuth, async function (req, res) {
  const user = await userModel
    .findOne({ _id: req.params.id })
    .select("-password -token")
    .then((user) => {
      postModel
        .find({ user: req.params.id })
        .populate("comments.user", "_id name username")
        .then((post) => {
          res.json({ user, post });
        });
    })
    .catch((err) => {
      console.log(err);
    });
});

// route for follow profile
router.put("/follow", jwtAuth, async function (req, res) {
  try {
    // Update the user which is being followed
    const followedUser = await userModel.findByIdAndUpdate(
      req.body.followId,
      { $push: { followers: req.user._id } },
      { new: true }
    );

    if (!followedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the current user
    const currentUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { $push: { following: req.body.followId } },
      { new: true }
    );

    if (!currentUser) {
      return res.status(404).json({ error: "Current user not found" });
    }

    res.json({ followedUser, currentUser });
  } catch (error) {
    console.error("Error while following user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// route for unfollow user
router.put("/unfollow", jwtAuth, async function (req, res) {
  try {
    // Update the user being unfollowed
    const followedUser = await userModel.findByIdAndUpdate(
      req.body.followId,
      { $pull: { followers: req.user._id } },
      { new: true }
    );

    if (!followedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the current user
    const currentUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { $pull: { following: req.body.followId } },
      { new: true }
    );

    if (!currentUser) {
      return res.status(404).json({ error: "Current user not found" });
    }

    res.json({ followedUser, currentUser });
  } catch (error) {
    console.error("Error while unfollowing user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// router.get("/postinfo/:postid", jwtAuth, async function (req, res) {
//   const post = await postModel
//     .find({ _id: req.params.postid })
//     .populate("user", "_id name username")
//     .populate("comments.user", "name username")
//     .then((post) => {
//       res.json(post);
//       console.log(post);
//     })
//     .catch((err) => {
//       console.log("Error while fetching postinfo ::: ", err);
//     });
// });

// api for delete post
router.delete("/deletepost/:postid", jwtAuth, async function (req, res) {
  const post = await postModel
    .findOne({ _id: req.params.postid })
    .populate("user", "_id name")
    .then((post) => {
      console.log(post.user._id.toString(), req.user._id.toString());
      if (post.user._id.toString() == req.user._id.toString()) {
        return postModel
          .deleteOne({ _id: req.params.postid })
          .then(() => {
            return userModel.updateOne(
              { _id: req.user._id },
              { $pull: { posts: req.params.postid } }
            );
          })
          .then((result) => {
            res.json({ message: "Post Deleted successfully.", result });
          })
          .catch((err) => {
            res.json({ error: "Post not Deleted!", err });
          });
      }
    });
});

// router.get("/showComments", jwtAuth, async function (req, res) {
//   const post = await postModel
//     .find()
//     .populate("comments.user", "name username")
//     .then((data) => {
//       const commentsData = data.map((data) => data.comments);
//       res.json(commentsData);
//     });
// });

cloudinary.config({
  cloud_name: "harshdesai",
  api_key: 575772841777249,
  api_secret: "GNh_92QeVWRg4YbMCLb7pHN2-PE",
});

module.exports = router;
