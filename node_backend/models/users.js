const mongoose = require("mongoose");
const Schema = mongoose.Schema;// Create Schema

/*
users 

email,password,name,walletAddress,balance,balanceLowerLimit,balanceLocked,currency,role, active,longitude,latitude,createDateTime

*/


const UserSchema = new Schema({
    name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  walletAddress:{
    type: String,
    required: true
  },
  balance:{
    type: Number,
    default: 0.
  },
  balanceLowerLimit:{
    type: Number,
    default: 0.
  },
  balanceLocked:{
    type: Number,
    default: 0.
  },
  currency: {
    type: String,
    default: true
  },
  role: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  isVerified:{
      type:Boolean,
      default: false
  },
  Longitude:{
    type: Number,
    default: 0
  },
  Latitude:{
    type: Number,
    default: 0
  },
  CreateDate: {
    type: Date,
    default: Date.now
  }
});module.exports = User = mongoose.model("users", UserSchema);