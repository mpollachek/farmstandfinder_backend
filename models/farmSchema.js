const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Comment = require("../models/commentSchema");

// const commentSchema = new Schema({
//   rating: {
//       type: Number,
//       min: 1,
//       max: 5,
//       required: true
//   },
//   text: {
//       type: String,
//       required: true
//   },
//   author: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
// }, {
//   timestamps: true
// });

const farmSchema = new Schema(
  {
    farmstandName: {
      type: String,
      required: false,
    },
    location: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        default: "Point", // 'location.type' must be 'Point'
        required: false,
      },
      coordinates: {
        type: [Number],
      },
    },
    address: {
      road: String,
      town: String,
      state: String,
      country: String,
    },
    description: String,
    products: {
      type: [String],
    },
    seasons: {
      type: [String],
      enum: ["harvest", "yearRound", "yearRoundQuery"],
      required: true,
      default: ["yearRound", "yearRoundQuery"],
    },
    images: {
      type: [String],
    },
    featured: Boolean,
    // comments: [commentSchema]
    farmstandType: {
      type: [String],
      required: true,
      enum: ["produce", "meat", "dairy", "eggs", "farmersMarket", "gardenCenter", "playArea", "therapy"]
    },
    useHours: Boolean,
    hours: {
      open: {
        sun: {
          isOpen: Boolean,
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        mon: {
          isOpen: Boolean,
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        tue: {
          isOpen: Boolean,
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        wed: {
          isOpen: Boolean,
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        thur: {
          isOpen: Boolean,
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        fri: {
          isOpen: Boolean,
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        sat: {
          isOpen: Boolean,
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
      },
      close: {
        sun: {
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        mon: {
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        tue: {
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        wed: {
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        thur: {
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        fri: {
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
        sat: {
          hour: { type: String, enum: ['1','2','3','4','5','6','7','8','9','10','11','12', 'hour']},
          min: { type: String, enum: ['00','15','30','45', 'minutes']},
          ampm: { type: String, enum: ["am", "pm"]}
        },
      },
      required: false
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "comments",
      },
    ],
    ownercomments: [
      {
        type: Schema.Types.ObjectId,
        ref: "ownercomments",
      },
    ],
    owner: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Farm = mongoose.model("Farmstand", farmSchema);

module.exports = Farm;
