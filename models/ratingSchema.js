const mongoose = require('mongoose');
const Schema = mongoose.Schema;

{/* Currently planning to not use this schema */}

const ratingSchema = new Schema({
  rating: {
    type: Number,
      min: 1,
      max: 5,
      required: true
  },
  farmstandId: {
      type: Schema.Types.ObjectId,
      ref: 'Farmstand',
      required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Rating = mongoose.model('ratings', ratingSchema);
module.exports = Rating;