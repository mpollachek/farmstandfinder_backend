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
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const farmSchema = new Schema({
  farmstandName: {
    type: String,
    required: false
  },
  location: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      default: 'Point', // 'location.type' must be 'Point'
      required: false
    },
    coordinates: {
      type: [Number]
    }
  },
  address: {
    road: String,
    town: String,
    state: String,
    country: String
  },
  description: String,
  products: {
    type: [String]
  },
  seasons: {
    type: [String],
    enum: ['harvest', 'yearRound', 'yearRoundQuery'],
    required: true,
    default: ['yearRound', 'yearRoundQuery']
  },
  images: {
    type: [String],
  },
  featured: Boolean,
  comments: [commentSchema],
}, {
  timestamps: true
},
);

const Farm = mongoose.model('Farmstand', farmSchema);

module.exports = Farm;