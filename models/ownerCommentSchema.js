const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ownerCommentSchema = new Schema(
  {
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

const OwnerComment = mongoose.model("ownercomments", ownerCommentSchema);

module.exports = OwnerComment;