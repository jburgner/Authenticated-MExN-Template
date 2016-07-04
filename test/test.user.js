var should = require('should');
var mongoose = require('mongoose');
var request = require('supertest');
var User = require("../models/user.js");
var db;
var confirmId;

describe('Routing', function(){

  //URL for local testing using server.js (run 'node server.js' to activate server)
  var url = 'http://localhost:3000';

  describe('User', function(){

    var user;

    before(function(done){
      //connect to the database using connection string from environment variable
      db = mongoose.connect(process.env.MEXN_API_CONN);
      done();
    });

    before(function(done){
      //remove test user if it already exists
      User.findOne({username: 'testnewuser'}, function(err, user){
        if(user == null){
          done();
        }else{
          user.remove({}, function(err){
            done();
          });
        }
      });
    });

    before(function(done){
        //add a new test user
        user = new User({
          username: 'testnewuser',
          emailAddress: 'test@example.com'
        });
        user.generateConfirmationId();
        confirmId = user.confirmationId;
        user.save(function(err){
          if(err){
            console.log(err);
          }
          done();
        });
    });

    //local tests
    describe('Local', function(){

      it('should find a new user by username', function(done){
        User.findOne({username: 'testnewuser'}, function(err, user){
          user.username.should.eql('testnewuser');
          done();
        });
      });

      it('should find a new user by confirmationId', function(done){
        User.findOne({confirmationId: confirmId}, function(err, user){
          user.confirmationId.should.eql(confirmId);
          done();
        });
      });

      it('should set salt and hash when password set', function(done){
        User.findOne({confirmationId: confirmId}, function(err, user){
          user.password = 'testy!';
          user.save(function(err, user){
            user.comparePassword('testy!', function(err, isMatch){
              if(err){
                console.log(err);
                err.should.eql(null);
                done();
              }else{
                isMatch.should.eql(true);
                done();
              }
            });
          });
        });
      });

    });

    //remote tests
    describe('Remote', function(){

      var jwtToken;

      var profile = {
        username: 'testnewuser',
        password: 'testy!'
      };

      before(function(done){
        //log in and get JWT token
        request(url)
          .post('/api/sessions')
          .send(profile)
          .expect(200)
          .end(function(err, res){
            if (err) {
              throw err;
            }
            jwtToken = JSON.parse(res.text).token;
            done();
          });
      });

    });

    after(function(done){
      //clean up: remove test user
      User.findOne({username: 'testnewuser'}, function(err, user){
        if(err){
          console.log(err);
        }
        if(user == null){
          done();
        }else{
          user.remove({}, function(err){
            if(err){
              console.log(err);
            }
            done();
          });
        }
      });
    });

    after(function(done){
      //close db connection
      mongoose.connection.close();
      done();
    });

  });

});
