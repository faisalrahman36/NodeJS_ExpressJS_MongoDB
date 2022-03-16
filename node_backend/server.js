const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const dbStr = require("./config/database");
const passport = require("passport");
const users = require("./routes/routes.js");

var cors = require('cors');

// use it before all route definitions
app.use(cors({origin: 'http://localhost:3000'}));
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());// DB Config
const db = dbStr.dbConn;// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err));

  // Passport middleware
app.use(passport.initialize());// Passport config
require("./config/passport.js")(passport);// Routes
app.use("/", users);

const port = process.env.PORT || 5000; // process.env.port is Heroku's port if you choose to deploy the app there
app.listen(port, () => console.log(`Server up and running on port ${port} !`));