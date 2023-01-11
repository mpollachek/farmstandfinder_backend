const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
      type: String,
      default: ''
  },
  useremail: {
      type: String,
      default: ''
  },
  owner: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmstand"
  }],
  favorite: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Farmstand"
  }],
  facebookId: String,
});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);