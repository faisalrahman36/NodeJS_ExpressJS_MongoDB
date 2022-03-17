
let mongoose = require("mongoose");

//transactions

//from, to, amount, currency orderDescription, transactionType, createDatetime

let transactionSchema = mongoose.Schema({
  transactionType: {
    type: String,
    default: 'test'
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  orderDescription: {
    type: String,
    default: 'test'
  },
  currency: {
    type: String,
    default: 'test'
  },
  createDateTime: {
    type: Date,
    default: Date.now
  }
});

let transactions = (module.exports = mongoose.model(
  "transactions",
  transactionSchema
));