var express = require("express");
var router = express.Router();
var passport = require("passport");
var uid2 = require("uid2");
var multer  = require('multer');
var upload = multer({ dest: 'public/uploads/' });
var mongoose = require('mongoose');

var User = require("../models/User.js");

var nearDist = 500; // Périmètre de recherche des utilisateurs
// getRadians transforme une distance en mètres en radians pour la géolocalisation
function getRadians(meters) {
  var km = meters / 1000;
  return km / 111.2;
} // getRadians


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
        res.status(400).json({ error: err.message });
      } else {
        res.json({ _id: user._id, token: user.token, status: user.status });
      }
    }
  );
}); // routeur.post /signup

// Au login : authentification de l'utilisateur et récupération de ses données
router.post("/log_in", function(req, res, next) {
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
      email: user.email,
      description: user.description,
      photo: user.photo,
      city: user.city,
      /*phone: user.phone,*/
      loc: [user.loc[0], user.loc[1]],
      lastConnection: user.lastConnection,
      society: user.society,
      cv: user.cv,
      announces: user.announces,
      messages: user.messages,
      favorites: user.favorites
    });
  })(req, res, next);
}); // router.post /log_in

// Si l'utilisateur est un candidat
// Recherche des recruteurs / annonces autour de lui avec latitude / longitude
// grâce à la requête near
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
}); // router.get /recruiters

// Si l'utilisateur est un recruteur
// Recherche des candidats autour de lui avec latitude / longitude
// grâce à la requête near
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

// Ajoute ou retire des utilisateurs de la liste de favoris
router.post("/favorites", function (req,res,next) {
  const iduser = req.query._iduser;
  const idfavorite = req.query._idfavorite;
  console.log(typeof(idfavorite));
    User.findOne({_id: iduser})
    .where({favorites: {$elemMatch: {$eq: idfavorite}}})
    .exec()
    .then (function(favorite) {
      if (favorite) {
        console.log('favorite found');
        User.findOneAndUpdate({_id: iduser}, {$pull: {favorites: idfavorite}})
        .exec();
      } else {
        console.log('favorite not found');
        User.findOneAndUpdate({_id: iduser}, {$push: {favorites: idfavorite}})
        .exec();
      }
    });
}); // router.post /favorites

// Routes pour mise à jour des profils
/*router.post("/:id/update_candidate", upload.single('photo'), function(req, res) {
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
});*/

// Récupère les données d'un utilisateur
router.get("/:id", function(req, res, next) {
  User.findById(req.params.id)
    .exec()
    .then(function(user) {
      console.log('Route user/:id ',user);
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
}); // router.get /:id

// Récupère la liste des favoris d'un utilisateur avec leurs données (populate)
router.get("/:id/favorites", function(req,res,next) {
  User.findById(req.params.id)
    .populate("favorites", ['-token'])
    .exec()
    .then(function(user) {
      console.log('Route user/:id/favorites ',user);
      if (!user) {
        res.status(404);
        return next("User not found");
      }
      return res.json(user.favorites);
    })
    .catch(function(err) {
      res.status(400);
      return next(err.message);
    });
}); // router.get /:id/favorites

// Récupère la liste des messages d'un utilisateur avec les données de l'interlocuteur (populate)
router.get("/:id/messages", function(req,res,next) {
  User.findById(req.params.id)
    .populate("messages.id_speaker", ['-token'])
    .exec()
    .then(function(user) {
      console.log('Route user/:id/messages ',user);
      if (!user) {
        res.status(404);
        return next("User not found");
      }
      return res.json(user.messages);
    })
    .catch(function(err) {
      res.status(400);
      return next(err.message);
    });
}); // route.get /:id/messages

module.exports = router;
