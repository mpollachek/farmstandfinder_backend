const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    default: "",
  },
  useremail: {
    type: String,
    default: "",
  },
  owner: [
    {
      type: Schema.Types.ObjectId,
      ref: "Farmstand",
    },
  ],
  ownercomments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Farmstand",
    },
  ],
  favorite: [
    {
      type: Schema.Types.ObjectId,
      ref: "Farmstand",
    },
  ],
  comments: [
    {
      type: Schema.Types.ObjectId,
      ref: "comments",
    },
  ],
  facebookId: String,
  googleId: String,
  facebookRefreshToken: String,
  googleRefreshToken: String,
  authType: String,
});

userSchema.plugin(passportLocalMongoose, {usernameQueryFields: ["useremail"]});

module.exports = mongoose.model("User", userSchema);
