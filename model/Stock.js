const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true
   },
   email: {
      type: String,
      required: true
   },
   ticker: {
      type: String,
      required: true
   },
   shares: {
      type: Number,
      required: true
   },
   price: {
      type: Number,
      required: true
   }
});

const Stock = mongoose.model("Stock", stockSchema);
module.exports = Stock;