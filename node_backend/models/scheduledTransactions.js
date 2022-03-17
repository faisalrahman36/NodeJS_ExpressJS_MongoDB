
let mongoose = require("mongoose");
//scheduledTransactions

//from, to, amount, currency, orderDescription, status, transactionType,scheduledDateTime, createDatetime

let scheduledTransactionSchema = mongoose.Schema({
  transactionType: {
    type: String,
    required: true
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
    default: 't'
  },
  currency: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  scheduledDateTime: {
    type: Date,
    required: true
  },
  createDateTime: {
    type: Date,
    default: Date.now
  }
});

let scheduledTransactions = (module.exports = mongoose.model(
  "scheduledTransactions",
  scheduledTransactionSchema
));