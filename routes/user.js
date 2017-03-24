var express = require("express");
var router = express.Router();
var passport = require("passport");
var uid2 = require("uid2");
var multer  = require('multer');
var upload = multer({ dest: 'public/uploads/' });

var User = require("../models/User.js");
var nearDist = 200; // Périmètre de recherche des utilisateurs

router.post("/sign_up", function(req, res) {
  User.register(
    new User({
      email: req.body.email,
      // L'inscription créera le token permettant de s'authentifier auprès de la strategie `http-bearer`
      token: uid2(16), // uid2 permet de générer une clef aléatoirement. Ce token devra être regénérer lorsque l'utilisateur changera son mot de passe
      status: req.body.status,
    }),
    req.body.password, // Le mot de passe doit être obligatoirement le deuxième paramètre transmis à `register` afin d'être crypté
    function(err, user) {
      if (err) {
        console.error(err);
        // TODO test
        res.status(400).json({ error: err.message });
      } else {
        res.json({ _id: user._id, token: user.token, status: user.status });
      }
    }
  );
});

router.post("/log_in", function(req, res, next) {
  console.log('routes#user#log_in');
  passport.authenticate("local", { session: false }, function(err, user, info) {
    if (err) {
      res.status(400);
      return next(err.message);
    }
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({
      _id: user._id,
      token: user.token,
      status: user.status,
      firstname: user.firstname,
      lastname: user.lastname,
      description: user.description,
      photo: user.photo,
      city: user.city,
      /*phone: user.phone,*/
      loc: [user.loc[0], user.loc[1]],
      lastConnection: 0,
      society: user.society,
      cv: user.cv, // cv
      announces: user.announces
    });
  })(req, res, next);
});

function getRadians(meters) {
  var km = meters / 1000;
  return km / 111.2;
}

router.get('/recruiters', function (req,res,next) {
  if (!req.query.lng || !req.query.lat) {
    return next("Latitude and longitude are mandatory");
  }

  User.find({status: 'recruiter'})
    .where("loc")
    .near({
      center: [req.query.lng, req.query.lat],
      maxDistance: getRadians(nearDist),
    })
    .exec()
    .then (function(user) {
      if (!user) {
        res.status(404);
        return next("User not found");
      }
      return res.json(user);
    })
    .catch(function(err) {
      res.status(400);
      return next(err.message);
    });
}); // router.get /announces

router.get('/candidates', function (req,res,next) {
  if (!req.query.lng || !req.query.lat) {
    return next("Latitude and longitude are mandatory");
  }

  User.find({status: 'candidate'})
    .where("loc")
    .near({
      center: [req.query.lng, req.query.lat],
      maxDistance: getRadians(nearDist),
    })
    .exec()
    .then (function(user) {
      if (!user) {
        res.status(404);
        return next("User not found");
      }
      return res.json(user);
    })
    .catch(function(err) {
      res.status(400);
      return next(err.message);
    });
}); // router.get /candidates

router.post("/:id/update_candidate", upload.single('photo'), function(req, res) {
  var obj = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    description: req.body.description,
    photo: req.file.filename,
    city: req.body.city,
    cv: {
      title: req.body.title,
      experience: req.body.experience,
      // competences: [{name: String, level: String}], // VOIR COMMENT LES RECUPERER
      // languages: [{name: String, level: String}], // VOIR COMMENT LES RECUPERER
      degree: req.body.degree,
      // qualities: [String], // VOIR COMMENT LES RECUPERER
    },
  };

  User.save({_id: req.params.id}, {$set: obj}, function (err, user) {
    if (!err) {
      console.log('user updated ', user);
    }
    else {
      console.log(err);
    }
  });
});

router.post("/:id/update_recruiter", upload.single('photo'), function(req, res) {
  var obj = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    description: req.body.description,
    photo: req.file.filename,
    city: req.body.city,
    society: req.body.society,
    announces: [{
      title: String,
      description: String,
      competences: [{name: String, level: String}],
      languages: [{name: String, level: String}],
      salary: Number,
    }]
  };

  User.save({_id: req.params.id}, {$set: obj}, function (err, user) {
    if (!err) {
      console.log('user updated ', user);
    }
    else {
      console.log(err);
    }
  });
});

// router.post("/:id/update_announce", function(req, res) {
//   var obj = {
//     firstname: req.body.firstname,
//     lastname: req.body.lastname,
//     description: req.body.description,
//     // photo: String, // VOIR OU STOCKER LES PHOTOS
//     society: req.body.society,
//   };
//
//   User.update({_id: req.params.id}, {$set: obj}, function (err, user) {
//     if (!err) {
//       console.log('user updated ', user);
//     }
//     else {
//       console.log(err);
//     }
//   });
// });



router.get("/:id", function(req, res) {
  User.findById(req.params.id)
    // .populate("account.rooms")
    // .populate("account.favorites")
    .exec()
    .then(function(user) {
      if (!user) {
        res.status(404);
        return next("User not found");
      }
      return res.json(user);
    })
    .catch(function(err) {
      res.status(400);
      return next(err.message);
    });
});

module.exports = router;
