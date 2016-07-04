// dependencies
var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var hash = require('bcrypt-nodejs');
var path = require('path');
var passport = require('passport');
var localStrategy = require('passport-local' ).Strategy;

//two environment variables must be set prior to running app:
//MEXN_API_CONN: the connection string to your MongoDB database.
//MEXN_API_SECRET: the JWT secret.
if(process.env.MEXN_API_CONN === undefined ||
    process.env.MEXN_API_SECRET === undefined){
      console.log('Missing environment variable(s).  Please set MEXN_API_CONN and MEXN_API_SECRET');
      process.exit(1);
}

// open mongoose connection
mongoose.connect(process.env.MEXN_API_CONN, function(err){
  if(err){
    console.log(err);
  }
});

// user schema/model
var User = require('./models/user.js');
/******************************************
//require other models here.  e.g.:
//var MyModel = require('./models/mymodel.js');
*******************************************/



// create instance of express
var app = express();

//get the JWT secret from the environment variable
app.set('secret', process.env.MEXN_API_SECRET);

// require routes
var userRoutes = require('./routes/userRoutes.js');
var sessionRoutes = require('./routes/sessionRoutes.js');
/******************************************
// require other routes as required.  e.g.:
// var myRoutes = require('./routes/myRoutes.js');
*******************************************/



// define middleware
app.use(express.static(path.join(__dirname, '../client')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


// configure passport
passport.use(new localStrategy(function(username, password, done){
    User.findOne({username: username}, function(err, user){
      if(err){ return done(err); }
      if(!user){ return done(null, false, {message: 'User not found.'}); }
      user.comparePassword(password, function(err, isMatch){
        if(err){ return done(err) };
        if(!isMatch){ return done(null, false, { message: 'Password is wrong.'}); }
        return done(null, user)
      });
    });
  }
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// routes
app.use('/api/users/', userRoutes);
app.use('/api/sessions/', sessionRoutes);
/******************************************
// use other routes as required.  e.g.:
// app.use('/api/myURL/', myRoutes);
// routes object should be instantiated above
*******************************************/




// error handlers
app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401);
    res.json({"message" : err.name + ": " + err.message});
  }
  next(err);
});

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res) {
  res.status(err.status || 500);
  res.end(JSON.stringify({
    message: err.message,
    error: {}
  }));
});

module.exports = app;
