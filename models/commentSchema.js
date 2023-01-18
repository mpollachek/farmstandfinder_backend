const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
  },
  text: {
      type: String,
      required: true
  },
  farmstandId: {
    type: Schema.Types.ObjectId,
    ref: 'Farmstand',
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Comment = mongoose.model('comments', commentSchema);

module.exports = Comment;