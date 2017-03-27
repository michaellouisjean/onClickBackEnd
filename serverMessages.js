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
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var Message = require("./models/Message");
var User = require("./models/User");

// Store conversation in Users DB
function insertNewTalk (candidate_id, recruiter_id) {
  Message.findOne({id_candidate: candidate_id, id_recruiter: recruiter_id})
    .exec()
    .then (function (talk) {
      console.log('talk ', talk._id);
      User.findOneAndUpdate({_id: candidate_id},
        {$push: {
          messages: {id_speaker: recruiter_id, id_message: talk._id}
        }})
        .exec();

      User.findOneAndUpdate({_id: recruiter_id},
        {$push: {
          messages: {id_speaker: candidate_id, id_message: talk._id}
        }})
        .exec();
    });
} // insertNewTalk

function setTalk(talk_id, cb) {
  Message.findById(talk_id)
  .exec()
  .then(cb);
} // setTalk

io.on('connection', function (client) { // le serveur reçoit tous les évènement du client
  client.on('clientGetMessages', function (speakers) {
      console.log('server recieved user', speakers.userId);
      console.log('server recieved speaker', speakers.speakerId);
      User.findById(speakers.userId)
        .where({messages: { $elemMatch:{id_speaker: speakers.speakerId}}})
        .exec()
        .then (function (user) {
          console.log('talk found ');
          if (user) {
            let talk_id = null;
            user.messages.forEach(function(element) {
              if (speakers.speakerId == element.id_speaker) {
                talk_id = element.id_message;
              }
            }); // forEach

            setTalk(talk_id, (talk) => {
              console.log('setTalk cb talk ',talk);
              io.emit('serverloadsMessages', talk);
            });
            return;
          }
          else {
            const candidate = speakers.userStatus === 'candidate' ? speakers.userId : speakers.speakerId;
            const recruiter = speakers.userStatus === 'recruiter' ? speakers.userId : speakers.speakerId;

            // Create a new entry in Message DB
            const talk = new Message ({
              id_candidate: candidate,
              id_recruiter: recruiter,
              messages: []
            });
            talk.save()
            .then (function() {insertNewTalk (candidate, recruiter)});
          } // else
        });

      io.emit('serverloadsMessages');
  });

  client.on('clientSendsMessage', function (messageSent) {
    console.log('server recieved message ', messageSent);
    var talk_id = mongoose.mongo.ObjectId(messageSent.talk_id);
    Message.findByIdAndUpdate(talk_id,
      {$push: {messages: messageSent.message}})
    .exec()
    .then(function () {
      Message.findById(talk_id)
      .exec()
      .then (function (talk) {
        console.log('AfterPush ', talk.messages);
        io.emit('serverSendsMessage', talk.messages);
      });
    });
  });
});



server.listen(3000, function () {
  console.log('serverMessage listen 3000');
});
