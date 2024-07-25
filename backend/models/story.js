const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    default: "no story",
  },

  subheading: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("Story", StorySchema);
