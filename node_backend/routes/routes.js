require('dotenv').config()
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dbConn = require("../config/database.js");
const validateRegisterInput = require("../validation/registerVal.js");
const validateLoginInput = require("../validation/loginVal.js");
const User = require("../models/users.js");
const mongo=require("mongodb");
const keys=require("../config/keys.js");
const sendEmail = require("../utils/sendEmail");
const tokenObj = require("../models/token");
// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
    // Form validation
    const { errors, isValid } = validateRegisterInput(req.body);
    // create newWalletAddres
    let newWalletAddress = new mongo.ObjectId()

    // Check validation
    
    if (!isValid) {
      return res.status(400).json(errors);
    }User.findOne({ email: req.body.email }).then(user => {
      if (user) {
        return res.status(400).json({ email: "Email already exists" });
      } else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          role:"user",
          walletAddress:newWalletAddress,
          currency: req.body.currency,
          Longitude:req.body.Longitude,
          Latitude:req.body.Latitude

        });// Hash password before saving in database
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          });
        });


        //send verification email

        const tokenS = new tokenObj({
        userId: newUser._id,
        token: newUser.walletAddress,
      });
      tokenS.save();
      console.log("walletAddress token"+newUser.walletAddress+'--'+tokenS.token);
        const message = process.env.BASE_URL+'/verify/'+newUser.id+'/'+tokenS.token;
        sendEmail(newUser.email, "Verify Email", message);
        res.send("An Email sent to your account please verify");
      }
    });
  });

//user verify

router.get("/verify/:id/:token",  (req, res) => {
    try {
      const user = User.findOne({ _id: req.params.id });
      if (!user) return res.status(400).send("Invalid link");
  
      const token =  tokenObj.findOne({
        userId: user._id,
        token: req.params.token,
      });
      if (!token) return res.status(400).send("Invalid link");
      let query = { _id: req.params.id };
        User.findByIdAndUpdate(query,{
            isVerified: true
          },
          err => {
            if (err) {
              console.log(err);
            }
            console.log("user updated successful!");
          }
        );
      //User.updateOne({ "_id": user._id},{ "isVerified": true });
      tokenObj.findByIdAndRemove(token._id);
  
      res.send("email verified sucessfully");
    } catch (error) {
      res.status(400).send("An error occured");
    }
  });

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
    // Form validation
    const { errors, isValid } = validateLoginInput(req.body);
    // Check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }const email = req.body.email;
    const password = req.body.password;
    // Find user by email
    User.findOne({ email }).then(user => {
      // Check if user exists
      if (!user) {
        return res.status(404).json({ emailnotfound: "Email not found" });
      }
      if(!user.isVerified){
        return res.status(400).json({ emailnotverified: "Email not verified" });
      
      }// Check password
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          // User matched
          // Create JWT Payload
          const payload = {
            id: user.id,
            name: user.name,
            walletAddress:user.walletAddress,
            email: user.email,
            role: user.role
          };// Sign token
          jwt.sign(
            payload,
            keys.secretOrKey,
            {
              expiresIn: 31556926 // 1 year in seconds
            },
            (err, token) => {
                const message = "You have logged in to your Wallet App";
                sendEmail(email, "Login alert", message);
                console.log("payload",payload);
              res.json({
                success: true,
                token: "Bearer " + token,
                id: user.id,
            name: user.name,
            walletAddress:user.walletAddress,
            email: user.email,
            role: user.role
            });
            }
          );
        } else {
          return res
            .status(400)
            .json({ passwordincorrect: "Password incorrect" });
        }
      });
    });
  
  });


  module.exports = router;
