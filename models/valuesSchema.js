const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const valuesSchema = new Schema(
  {
    valueName: {
      type: String,
      required: true,
    },
    values: {
      type: [String],
    },    
  }
);

const Values = mongoose.model("values", valuesSchema);

module.exports = Values;