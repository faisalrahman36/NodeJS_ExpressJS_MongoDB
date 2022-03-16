const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  userId: {
    type: String,
    ref: "user",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
});

const tokenObj = mongoose.model("token", tokenSchema);

module.exports = tokenObj;
