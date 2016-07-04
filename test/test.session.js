var should = require('should');
var mongoose = require('mongoose');
var request = require('supertest');
var User = require("../models/user.js");
var db;
var confirmId;

describe('Routing', function(){

  //URL for local testing using server.js (run 'node server.js' to activate server)
  var url = 'http://localhost:3000';

  describe('Session', function(){

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
          emailAddress: 'test@example.com',
          password: 'testy!'
        });
        user.save(function(err){
          if(err){
            console.log(err);
          }
          done();
        });
    });

    //remote tests
    describe('Remote', function(){

      var jwtToken;

      it('should log a user in', function(done){
        var profile = {
          username: 'testnewuser',
          password: 'testy!'
        };

        request(url)
          .post('/api/sessions')
          .send(profile)
          .expect(200)
          .end(function(err, res){
            if (err) {
              throw err;
            }
            //also get JWT for next tests
            jwtToken = JSON.parse(res.text).token;
            done();
          });
      });

      it('should validate a logged-in user', function(done){

        request(url)
          .get('/api/sessions')
          .set('Authorization', 'Bearer ' + jwtToken)
          .expect(200)
          .end(function(err, res){
            if (err) {
              throw err;
            }
            done();
          });
      });

      it('should not validate a modified jwt', function(done){
        request(url)
          .get('/api/sessions')
          //modify the token and expect an authentication error
          .set('Authorization', 'Bearer ' + jwtToken.substring(0, jwtToken.length - 10) + 'BBBBBBBBBB')
          .expect(401)
          .end(function(err, res){
            if (err) {
              throw err;
            }
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
