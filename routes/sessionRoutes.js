var express = require('express');
var app = express();
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var User = require('../models/user.js');

var auth = jwt({
  secret: process.env.MPO_DTA_API_SECRET
});

//check if logged in (get session)
router.get('/', auth, function(req, res){
  res.status(200).json({status: 'User confirmed.'});
});

//login (post new session)
router.post('/', function(req, res, next){

  //authorize user
  passport.authenticate('local', function(err, user, info) {
    var token;

    // If Passport throws/catches an error
    if (err) {
      res.status(500).json(err);
      return;
    }

    // If a user is found
    if(user){
      token = user.generateJwt(process.env.MPO_DTA_API_SECRET);
      res.status(200);
      res.json({
        "token" : token
      });
    } else {
      // If user is not found
      res.status(401).json(info);
    }
  })(req, res, next);
});

module.exports = router;
