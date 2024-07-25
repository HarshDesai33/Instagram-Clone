const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  caption: String,
  like: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  comments: [
    {
      comment: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
  shares: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  picture: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("post", postSchema);
