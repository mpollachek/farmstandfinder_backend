const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
    },
    farmstandId: {
      type: Schema.Types.ObjectId,
      ref: "Farmstand",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model("comments", commentSchema);

module.exports = Comment;
