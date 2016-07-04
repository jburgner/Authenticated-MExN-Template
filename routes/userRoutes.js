var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var User = require('../models/user.js');

var auth = jwt({
  secret: process.env.MPO_DTA_API_SECRET
});

//change user's password
router.post('/changepassword', function(req, res){
  User.findByUsername(req.body.username, function(err, user){
    user.comparePassword(req.body.oldPassword, function(err, isMatch){
      if(err){
        return res.send(err);
      }
      if(isMatch){
        user.setPassword(req.body.newPassword);
        user.save(function(err){
          if(err){
            return res.status(500).send(err);
          }
          res.status(200).json({status: 'Password updated'});
        });
      }else{
        res.status(401).json({status: 'Old password incorrect.'});
      }
    });
  });
});

//confirm
router.get('/confirm/:confirmation_id', function(req, res){
  User.findOne({confirmationId: req.params.confirmation_id}, function(err, user){
    user.confirmed = true;
    user.save(function(err){
      if(err){
        return res.send(err);
      }
      res.status(200).json({status: 'User confirmed.'});
    });
  });
});

router.post('/confirm/:confirmation_id', function(req, res){
  User.findOne({confirmationId: req.params.confirmation_id}, function(err, user){
    if(err){
      return res.status(500).send(err);
    }
    if(!user){
      return res.status(403).json({status: 'Invalid confirmation id.'})
    }
    if(user.confirmed){
      user.password = req.body.newPassword;
      user.save(function(err){
        if(err){
          return res.status(500).send(err);
        }
        res.status(200).json({status: 'Password updated'});
      });
    }else{
      res.status(401).json({status: 'User not yet confirmed.'});
    }
  });
});

//create new user
router.post('/', auth, function(req, res){
    //Validation of user permissions to create a new user for given memberId goes here


    var user = new User();
    user.username = req.body.username;
    user.emailAddress = req.body.emailAddress;
    user.MemberId = req.body.memberId;
    user.generateConfirmationId();
    user.confirmed = false;

    console.log('Going to save now...');
    console.log(user.username);

    user.save(function(err){
      console.log('Save attempted...');
      if(err){
        return res.send(err);
      }
      res.status(200).json({status: 'User created successfully.'});
    });
  });


module.exports = router;
