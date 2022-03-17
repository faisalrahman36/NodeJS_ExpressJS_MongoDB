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
const transactionObj=require("../models/transactions");
const scheduledTransactionObj=require("../models/scheduledTransactions");

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

//transaction
  router.post("/transaction/:id", (req, res) => {
    
    console.log('id',req.params.id);
    console.log('amount',parseFloat(req.body.amount));
    console.log('res body',req.body);

    //from user debit
    User.findById({ _id: req.params.id }, (err, account) => {
        if (err) {
          console.log(err);
        }
    
        console.log(account.email);
        let match;
        if(req.body.email== account.email)
          {
          match=true;
          }
        
          if (req.body.amount>=account.balance){
           match=false;
           console.log("not enough balance");
           res.status(500).send("not enough balance");
          }

    
          if (match) {
            let query = { _id: req.params.id };
            User.findByIdAndUpdate(
              query,
              {
                balance:  parseFloat(account.balance)-parseFloat(req.body.amount)
              },
              err => {
                if (err) {
                  console.log(err);
                }
                console.log("Debit successful!");
              }
            );

            console.log("balance-amount",(parseFloat(account.balance)-parseFloat(req.body.amount)),parseFloat(account.balanceLowerLimit));
            
           if ((parseFloat(account.balance)-parseFloat(req.body.amount))<= parseFloat(account.balanceLowerLimit)){
               //low balance reminder
               const message = 'low balance alert';
               sendEmail(account.email, "low balance", message)

           }       
          
            let queryTo = { "walletAddress": req.body.toWalletAddress };
            User.findOneAndUpdate(
              queryTo,
              {
                $inc:{balance:  parseFloat(req.body.amount)}}
              ,
              err => {
                if (err) {
                  console.log(err);
                }
                console.log("Credit successful!");
              }
            );
    

            let transaction = new transactionObj({
              transactionType: req.body.transactionType,
              to: req.body.toWalletAddress,
              from: req.body.walletAddress,
              amount: req.body.amount,
              orderDescription: req.body.orderDescription,
              currency: req.body.currency
            });
            transaction.save(err => {
              if (err) {
                console.log(err);
              }
              console.log("Transaction saved!");
            });
    
            res.send(
              200,
              'Transfer successful!'
            );
          } else {
            res.send(
              500,
              " Please try again."
            );
          }
        
      });
    });
    // scheduled transactions

    router.post("/scheduledTransaction/:id", (req, res) => {
    
        console.log('id',req.params.id);
        console.log('amount',parseFloat(req.body.amount));
        console.log('res body',req.body);

    
        //from user debit
        User.findById({ _id: req.params.id }, (err, account) => {
            if (err) {
              console.log(err);
            }
        
            console.log(account.email);
            let match;
            if(req.body.email== account.email)
              {
              match=true;
              }
            
              if (req.body.amount>=account.balance){
               match=false;
               console.log("not enough balance");
               res.status(500).send("not enough balance");
              }
    
        
              if (match) {
                let query = { _id: req.params.id };
                User.findByIdAndUpdate(
                  query,
                  {
                    balance:  parseFloat(account.balance)-parseFloat(req.body.amount)
                  },
                  err => {
                    if (err) {
                      console.log(err);
                    }
                    console.log("Debit successful!");
                  }
                );
    
                console.log("balance-amount",(parseFloat(account.balance)-parseFloat(req.body.amount)),parseFloat(account.balanceLowerLimit));
                
               if ((parseFloat(account.balance)-parseFloat(req.body.amount))<= parseFloat(account.balanceLowerLimit)){
                   //low balance reminder
                   const message = 'low balance after scheduled transaction ';
                   sendEmail(account.email, "low balance", message)
    
               }       
              //balance won't be transfered but locked into the users own account
                let queryTo = { _id: req.params.id };
                User.findOneAndUpdate(
                  queryTo,
                  {
                    $inc:{balanceLocked:  parseFloat(req.body.amount)}}
                  ,
                  err => {
                    if (err) {
                      console.log(err);
                    }
                    console.log("Credit successful!");
                  }
                );
        
    
                let scheduledTransaction = new scheduledTransactionObj({
                  transactionType: req.body.transactionType,
                  to: req.body.toWalletAddress,
                  from: req.body.walletAddress,
                  amount: req.body.amount,
                  orderDescription: req.body.orderDescription,
                  currency: req.body.currency,
                  status:"scheduled",
                  scheduledDateTime: req.body.scheduledDateTime

                });
                scheduledTransaction.save(err => {
                  if (err) {
                    console.log(err);
                  }
                  console.log("Scheduled transaction saved!");
                });
        
                res.send(
                  200,
                  'Transfer successful!'
                );
              } else {
                res.send(
                  500,
                  " Please try again."
                );
              }
            
          });
        });


// show transactions
router.get('/showTransactions/:walletAddress',function(req, res) {
    console.log('show txn',req.body);
    //will return transactions involving the user's wallet address in either from or too
    transactionObj.find({$or:[{from: req.params.walletAddress},{to:req.params.walletAddress}]}, function(err, user) 
    {
       if (err)
       {
           res.send(err);
       }
       console.log(user);
       res.json(user);
   
    });
   });
      
// show scheduled transactions
router.get('/showScheduledTransactions/:walletAddress',function(req, res) {

    //will return transactions involving the user's wallet address in  from  
    scheduledTransactionObj.find({from:req.params.walletAddress}, function(err, user) 
    {
       if (err)
       {
           res.send(err);
       }
       console.log(user);
       res.json(user);
   
    });
   });
      

// show user info
router.get('/user/:id',function(req, res) {

  //will return transactions involving the user's wallet address in  from  
  User.find({_id:req.params.id}, function(err, user) 
  {
     if (err)
     {
         res.send(err);
     }
     console.log(user);
     res.json(user);
 
  });
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
            role: user.role,
            currency:user.currency
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
