// IMPORTS
// faker permet de générer des données utilisateurs
// var faker = require('faker');
var faker = require('faker/locale/fr');

// FONCTIONS
function getCandidate () {
  var candidate = Object.assign(defaultUser);

  candidate.status='candidat';
  candidate.candidate.firstname = faker.name.firstName();
  // console.log(candidate.candidate.firstname);
  candidate.candidate.lastname = faker.name.lastName();
  candidate.candidate.description = faker.lorem.paragraph();
  // candidate.candidate.description = faker.company.catchPhrase();
  candidate.candidate.photo = faker.internet.avatar();
  candidate.candidate.city = 'Paris';
  candidate.candidate.phone = faker.phone.phoneNumberFormat();
  candidate.candidate.loc.lng = 0;
  candidate.candidate.loc.lat = 0;
  candidate.candidate.lastConnection = faker.date.recent();
  candidate.candidate.cv.title = faker.name.jobType();
  // console.log('FUUUUUUUUUUUUUUUCK ',candidate.candidate.cv.title);
  return candidate;
}// getCandidate ()

// PROGRAMME
var users=[];
var newUsers=20;
var defaultUser=  {
  // "shortId": Number, // un shortId nous est utile au moment de l'importation du jeu de données `npm run data` car les relations y sont identifiées à l'aide d'identifiants courts
  // "email": String,
  // "password": "password",
  // "token": String, // Le token permettra d'authentifier l'utilisateur à l'aide du package `passport-http-bearer`
  status: '',

  candidate: {
    firstname: "",
    lastname: "",
    description: "",
    photo: "",
    city: "",
    phone: "",
    loc: {lng: 0, lat: 0},
    lastConnection: Date,
    cv:{
      title: "",
      experience: "",
      competences: [],
      languages: [],
      degree: "",
      qualities: [],
    } // cv
  }, // candidate
  recruiter: {
    firstname: "",
    lastname: "",
    society: "",
    description: "",
    photo: "",
    city: "",
    loc: {lng: 0, lat: 0},
    lastConnection: "",
    announces: [{
      title: "",
      description: "",
      competences: [],
      languages: [],
      salary: "",
    }]
  }
} //var candidate

// Création des candidats
for (var i=0; i<(newUsers)/2; i++) {
  
  users.push(getCandidate());
} // for

console.log(users);
// console.log(users[5].candidate.cv.title);
