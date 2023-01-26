const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const favoriteSchema = Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  farmstands: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmstand",
    },
  ],
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
