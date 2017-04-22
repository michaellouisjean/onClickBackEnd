// Le package `dotenv` permet de pouvoir definir des variables d'environnement dans le fichier `.env`
// Nous utilisons le fichier `.slugignore` afin d'ignorer le fichier `.env` dans l'environnement Heroku
require("dotenv").config();

// Le package `mongoose` est un ODM (Object-Document Mapping) permettant de manipuler les documents de la base de données comme si c'étaient des objets
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, function(err) {
  if (err) console.error("Could not connect to mongodb.");
});

// var WebSocketServer = require('ws').Server;
// var wss = new WebSocketServer({port: 3000});

var express = require("express");
var app = express();

// Le package `helmet` est une collection de protections contre certaines vulnérabilités HTTP
var helmet = require("helmet");
app.use(helmet());

// Les réponses (> 1024 bytes) du serveur seront compressées au format GZIP pour diminuer la quantité d'informations transmise
var compression = require("compression");
app.use(compression());

// Parse le `body` des requêtes HTTP reçues
var bodyParser = require("body-parser");
app.use(bodyParser.json());

// --- Socket
var server = require("http").createServer(app);
var io = require("socket.io")(server);

var Message = require("./models/Message");
var User = require("./models/User");



//----------- ECHANGE SERVEUR - CLIENT --------------
// Ajoute une conversation à la liste des conversations de chaque interlocuteur
function insertNewTalk(candidate_id, recruiter_id) {
  // On retrouve la conversation nouvellement créée dans la base de données Message
  Message.findOne({ id_candidate: candidate_id, id_recruiter: recruiter_id })
    .exec()
    .then(function(talk) {
      // Puis on ajoute cette conversation à la liste des conversations
      // de chaque interlocuteur

      console.log("insertNewTalk talk._id ", talk._id);

      // Côté candidat
      User.findOneAndUpdate(
        { _id: candidate_id },
        {
          $push: {
            messages: { id_speaker: recruiter_id, id_message: talk._id }
          }
        }
      ).exec();

      // Côté recruteur
      User.findOneAndUpdate(
        { _id: recruiter_id },
        {
          $push: {
            messages: { id_speaker: candidate_id, id_message: talk._id }
          }
        }
      ).exec();

      // Le serveur envoie la conversation au client
      io.emit("serverloadsMessages", talk);
    });
} // insertNewTalk

// Retrouve une conversation existante entre 2 interlocuteurs
// puis l'envoie au client par le callback
function setTalk(talk_id, cb) {
  Message.findById(talk_id).exec().then(cb);
} // setTalk

// le serveur reçoit tous les évènement du client
io.on("connection", function(client) {
  // Le client demande à récupérer une conversation entre 2 interlocuteurs
  client.on("clientGetMessages", function(speakers) {
    console.log("server recieved user", speakers.userId);
    console.log("server recieved speaker", speakers.speakerId);

    // Le serveur recherche dans la base de données si l'utilisateur loggé a
    // déjà une conversation avec son interlocuteur en fonctions des id reçus
    User.findById(speakers.userId) // recherche dans l'entrée de l'utilisateur
      .where({ messages: { $elemMatch: { id_speaker: speakers.speakerId } } }) // une conversation avec son interlocuteur
      .exec()
      .then(function(user) {
        console.log("talk found ");
        if (user) { // une conversation existe bel et bien entre les 2 interlocuteurs
          let talk_id = null;
          user.messages.forEach(function(element) { // On recherche la conversation dans sa liste de conversations
            if (speakers.speakerId == element.id_speaker) {
              talk_id = element.id_message; // On récupère l'id de la conversation
            }
          }); // forEach

          // On initie la conversation en cours puis le serveur envoie la liste
          // des messages au client en callback
          setTalk(talk_id, talk => {
            console.log("setTalk cb talk ", talk);
            io.emit("serverloadsMessages", talk);
          });
          return;
        }
        // Les 2 interlocuteurs n'ont jamais discuter ensemble
        else {
          // On détermine qui est le candidat et qui est le recruteur
          const candidate = speakers.userStatus === "candidate"
            ? speakers.userId
            : speakers.speakerId;
          const recruiter = speakers.userStatus === "recruiter"
            ? speakers.userId
            : speakers.speakerId;

          // On créer un nouvelle entrée dans la base de données Message
          // qui stocke tous les messages d'une conversation
          const talk = new Message({
            id_candidate: candidate,
            id_recruiter: recruiter,
            messages: []
          });
          talk.save().then(function() {
            // Puis on ajoute cette conversation à la liste des conversations
            // de chaque interlocuteur
            insertNewTalk(candidate, recruiter);
          });
        } // else
      });
  }); // clientGetMessages

  // Le client envoie un message
  client.on("clientSendsMessage", function(messageSent) {
    console.log("server recieved message ", messageSent);
    var talk_id = mongoose.mongo.ObjectId(messageSent.talk_id);

    // On stocke le message dans la conversation
    // puis le serveur envoie au client la liste des messages mise à jour
    Message.findByIdAndUpdate(talk_id, {
      $push: { messages: messageSent.message }
    })
      .exec()
      .then(function() {
        Message.findById(talk_id).exec().then(function(talk) {
          // le serveur envoie au client la liste des messages mise à jour
          io.emit("serverSendsMessage", talk.messages);
        });
      });
  }); //clientSendsMessage
});

server.listen(process.env.PORT, function() {
  console.log("serverMessage listen ", process.env.PORT);
});
