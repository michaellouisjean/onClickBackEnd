var express = require("express");
var router = express.Router();
var passport = require("passport");
var uid2 = require("uid2");

var User = require("../models/User.js");

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

router.post("/update_profile", function(req, res) {
  var obj = {};
  

  User.update({_id: req.params.id}, {$set: obj}, function (err, user) {
    if (!err) {
      console.log('user updated ', user);
    }
    else {
      console.log(err);
    }
  });
});

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
      candidate: user.candidate,
      recruiter: user.recruiter
    });
  })(req, res, next);
});

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
      if (user.status==="candidate") {
        return res.json({
          _id: user._id,
          candidate: user.candidate
        });
      }
      if (user.status==="recruiter") {
        return res.json({
          _id: user._id,
          recruiter: user.recruiter
        });
      }
    })
    .catch(function(err) {
      res.status(400);
      return next(err.message);
    });
});


module.exports = router;
