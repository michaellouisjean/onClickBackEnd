require("dotenv").config();

var uid2 = require("uid2");
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, function(err) {
  if (err) console.error("Could not connect to mongodb.");
});

var User = require("../models/User.js");

var users = require("./users.json");

// users
for (var i = 0; i < users.length; i++) {
  var newUser = {};
  if (users[i].status === 'candidate') {
    newUser.shortId = users[i].shortIdid,
    newUser.email = users[i].firstname.toLowerCase() + "@onclick.io",
    newUser.token = uid2(16),
    newUser.status = users[i].status,
    newUser.candidate = {
      firstname: users[i].firstname,
      lastname: users[i].lastname,
      description: users[i].description,
      photo: users[i].photo,
      city: users[i].city,
      loc: {lng: users[i].loc.lng, lat: users[i].loc.lat},
      lastConnection: users[i].lastConnection,
      cv: users[i].cv
    };
  } else {
    newUser.shortId = users[i].shortId,
    newUser.email = users[i].firstname.toLowerCase() + "@onclick.io",
    newUser.token = uid2(16),
    newUser.status = users[i].status,
    newUser.recruiter = {
      firstname: users[i].firstname,
      lastname: users[i].lastname,
      society: users[i].society,
      description: users[i].description,
      photo: users[i].photo,
      city: users[i].city,
      loc: {lng: users[i].loc.lng, lat: users[i].loc.lat},
      lastConnection: users[i].lastConnection,
      announces: users[i].announces
    };
  }
  User.register(newUser,
    "password01",
    function(err, obj) {
      if (err) {
        console.error(err);
      } else {
        // console.log("saved user " + obj.account.username);
        console.log("saved user " + obj.email);
      }
    });
}

/*setTimeout(
  function() {
    // add users
    users.forEach(function(user) {
      User.findOne({ "account.username": user.username })
        .exec()
        .then(function(userFound) {
            userFound.save(function(err, obj) {
              if (err) {
                console.error("could not save user " + obj.account.username);
              } else {
                console.log("user updated " + obj.account.username);
              }
            });
        })
        .catch(function(err) {
          console.error(err);
        });
    });
  },
  10000
);

setTimeout(
  function() {
    mongoose.connection.close();
  },
  15000
);*/
