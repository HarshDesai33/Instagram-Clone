const express = require("express");
const router = express.Router();
const jwtAuth = require("../middleware/jwtAuth");
const { jwt_secret } = require("../db");

const passport = require("../middleware/passport-local");
// const passport = require("passport");
const mongoose = require("mongoose");
const postModel = require("../models/posts");
const userModel = require("../models/user");
const upload = require("./multer");
const utils = require("../utils/utils");

// route for creating new post
router.post("/createpost", jwtAuth, (req, res) => {
  const { caption, uploadPic } = req.body;

  if (!caption) {
    return res.status(422).json({ error: "Please fill all the fields" });
  }

  const post = new postModel({
    caption,
    picture: uploadPic,
    user: req.user,
  });

  post
    .save()
    .then((savedPost) => {
      // Update user with new post
      return userModel.findOneAndUpdate(
        { username: req.user.username },
        { $push: { posts: savedPost._id } },
        { new: true } // return updated data
      );
    })
    .then((user) => {
      res
        .status(200)
        .json({ message: "Post created successfully", post: user });
    })
    .catch((error) => {
      console.error("Error creating post:", error);
      res
        .status(500)
        .json({ error: "An error occurred while creating the post" });
    });
});

// route for all posts in feedd
router.get("/allposts", jwtAuth, async function (req, res) {
  const post = await postModel
    .find()
    .populate("user", "name username picture")
    .populate("comments.user", "_id name username")
    .then((posts) => {
      const user = req.user;
      // console.log(user);
      setTimeout(() => {
        res.json({ posts, user });
      }, 1000);
    })
    .catch((err) => console.log(err));
});

// route for my user posts in profile
router.get("/myposts", jwtAuth, async function (req, res) {
  const post = await postModel
    .find({ user: req.user._id })
    .populate("user", "_id username posts followers following bio picture")
    .populate("comments.user", "_id username name")
    .then((post) => {
      const user = req.user;
      // console.log(user);
      res.json({ post, user });
    })
    .catch((err) => {
      console.log(err);
    });
});

// post like route
router.put("/like/:id", jwtAuth, async function (req, res) {
  try {
    const post = await postModel
      .findByIdAndUpdate(
        req.body.postId,
        {
          $push: { like: req.user._id },
        },
        { new: true }
      )
      .populate("user", "_id username name email picture")
      .populate("comments.user", "name username");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // console.log("Post liked:", post);
    res.json(post);
  } catch (error) {
    console.error("Error while liking post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// post unlike route
router.put("/unlike/:id", jwtAuth, async function (req, res) {
  try {
    const post = await postModel
      .findByIdAndUpdate(
        req.body.postId,
        {
          $pull: { like: req.user._id },
        },
        { new: true }
      )
      .populate("user", "_id username name email picture")
      .populate("comments.user", "name username");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // console.log("Post unliked:", post);
    res.json(post);
  } catch (error) {
    console.error("Error while unliking post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// route for comment
router.put("/comment/:id", jwtAuth, async function (req, res) {
  try {
    const comment = { comment: req.body.comment, user: req.user._id };
    if (!comment) {
      return res.json({ message: "Please fill something" });
    } else {
      const post = await postModel
        .findByIdAndUpdate(
          req.body.postId,
          {
            $push: { comments: comment },
          },
          { new: true }
        )
        .populate("comments.user", "_id name username")
        .populate("user", "_id name username");

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      console.log("Post comment:", post);
      res.json(post);
    }
  } catch (error) {
    console.error("Error while unliking post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// for showing posts of following user
router.get("/followingPost", jwtAuth, async function (req, res) {
  userModel
    .findById(req.user._id)
    .populate("following", "_id")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const followingIds = user.following.map(
        (followingUser) => followingUser._id
      );

      postModel
        .find({ user: { $in: followingIds } })
        .populate("user", "_id name")
        .then((posts) => {
          res.json(posts);
          // console.log(posts);
        })
        .catch((err) => {
          console.error(err);
          res
            .status(500)
            .json({ error: "An error occurred while fetching posts" });
        });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ error: "An error occurred while fetching user data" });
    });
});

// for searching user
router.post("/search/:query", jwtAuth, function (req, res) {
  const searchTerm = "^" + req.params.query;
  const regex = new RegExp(searchTerm, "i");

  userModel
    .find({
      $or: [{ username: { $regex: regex } }, { name: { $regex: regex } }],
    })
    .select("_id name username picture")
    .then((users) => {
      res.json({ users });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Server Error");
    });
});

// api for save post
router.put("/savePost/:postId", jwtAuth, async function (req, res) {
  const user = await userModel
    .findByIdAndUpdate(
      req.user._id,
      { $push: { saved: req.params.postId } },
      { new: true }
    )
    .select("-password -token")
    .then((data) => {
      res.json(data);
      console.log("post saved ::: ", data);
    })
    .catch((err) => {
      console.log(err);
    });
});

// api for unSave post
router.put("/unSavePost/:postId", jwtAuth, async function (req, res) {
  const user = await userModel
    .findByIdAndUpdate(
      req.user._id,
      { $pull: { saved: req.params.postId } },
      { new: true }
    )
    .select("-password -token")
    .then((data) => {
      res.json(data);
      console.log("post unSaved ::: ", data);
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
