// user model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var jwt = require('jsonwebtoken');
var randomstring = require('randomstring');
var bcrypt = require('bcrypt-nodejs');

var User = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: String,
  emailAddress: String,
  memberId: Number,
  promoterId: Number,
  confirmationId: String,
  confirmed: Boolean,
  salt: String,
  hash: String,
  lastLogin: Date
});

//add listener for save event to hash password for storage
User.pre('save', function(next) {
  var user = this;
  var SALT_FACTOR = 5;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
    if (err) return next(err);
    user.salt = salt;
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

//compare candidate password against hash to verify password is correct
User.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err, false);
    cb(null, isMatch);
  });
};

//generate the JSON Web Token (JWT)
User.methods.generateJwt = function(secret){
  var expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  return jwt.sign({
    _id: this._id,
    email: this.emailAddress,
    username: this.username,
    exp: parseInt(expiry.getTime() / 1000),
  }, secret);
};

//generate random string for confirmation URL
User.methods.generateConfirmationId = function(){
  this.confirmationId = randomstring.generate({length: 512});
};

User.plugin(passportLocalMongoose);


module.exports = mongoose.model('User', User);
