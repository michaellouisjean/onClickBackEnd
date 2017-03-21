var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
  shortId: Number, // un shortId nous est utile au moment de l'importation du jeu de données `npm run data` car les relations y sont identifiées à l'aide d'identifiants courts
  email: String,
  password: String,
  token: String, // Le token permettra d'authentifier l'utilisateur à l'aide du package `passport-http-bearer`
  status: String,

  // Nous choisisons de créer un objet `account` dans lequel nous stockerons les informations non sensibles
  candidate: {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    description: String,
    photo: String,
    city: String,
    loc: {lng: Number, lat: Number},
    lastConnection: Date,
    cv:{
      // type: mongoose.Schema.Types.ObjectId,
      // ref: "Room"
      title: String,
      experience: String,
      competences: [{name: String, level: String}],
      languages: [{name: String, level: String}],
      degree: String,
      qualities: [String],
    }
  }, // candidate
  recruiter: {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    society: String,
    description: String,
    photo: String,
    city: String,
    loc: {lng: Number, lat: Number},
    lastConnection: Date,
    announces: [{
      title: String,
      description: String,
      competences: [{name: String, level: String}],
      languages: [{name: String, level: String}],
      salary: Number,
    }]
  } // recruiter
});

UserSchema.plugin(passportLocalMongoose, {
  usernameField: "email", // L'authentification utilisera `email` plutôt `username`
  session: false // L'API ne nécessite pas de sessions
});

// Cette méthode sera utilisée par la strategie `passport-local` pour trouver un utilisateur en fonction de son `email` et `password`
UserSchema.statics.authenticateLocal = function() {
  var _self = this;
  return function(req, email, password, cb) {
    _self.findByUsername(email, true, function(err, user) {
      if (err) return cb(err);
      if (user) {
        return user.authenticate(password, cb);
      } else {
        return cb(null, false);
      }
    });
  };
};

// Cette méthode sera utilisée par la strategie `passport-http-bearer` pour trouver un utilisateur en fonction de son `token`
UserSchema.statics.authenticateBearer = function() {
  var _self = this;
  return function(token, cb) {
    if (!token) {
      cb(null, false);
    } else {
      _self.findOne({ token: token }, function(err, user) {
        if (err) return cb(err);
        if (!user) return cb(null, false);
        return cb(null, user);
      });
    }
  };
};

module.exports = mongoose.model("User", UserSchema, "users");