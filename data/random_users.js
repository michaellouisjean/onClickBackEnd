// IMPORTS
// faker permet de générer des données utilisateurs
// var faker = require('faker');
var faker = require('faker/locale/fr');
var lodash = require('lodash');
var jsonfile = require('jsonfile');
// FONCTIONS
function getLanguages () {
  var languages = ["Allemand","Anglais","Arabe","Cantonais","Espagnol","Finnois","Français","Italien","Japonais","Néerlandais","Polonais","Russe"];
  var level = ["notions","courant","bilingue"];
  var spoken = [];
  var used = [];
  for (var i=0; i<lodash.random(1,5); i++) {
    var index = lodash.random(0,languages.length-1);
    while (used.findIndex((el) => {return el===index})!==-1) {
      index = lodash.random(0,languages.length-1);
    }
    used.push[index];
    spoken.push({name: languages[index], level: level[lodash.random(0,level.length-1)]});
  }
  return spoken;
} // getLanguages

function getLoc() {
  var lng = lodash.random(2.247734,2.424202).toFixed(6);
  var lat = lodash.random(48.810933,48.903997).toFixed(6);
  return {lng: lng, lat: lat};
}

// PROGRAMME
var users=[];
var newUsers=20;
var defaultUser=  {
  // "shortId": Number, // un shortId nous est utile au moment de l'importation du jeu de données `npm run data` car les relations y sont identifiées à l'aide d'identifiants courts
  // "email": String,
  // "password": "password",
  // "token": String, // Le token permettra d'authentifier l'utilisateur à l'aide du package `passport-http-bearer`
  status: '',
  firstname: "",
  lastname: "",
  description: "",
  photo: "",
  city: "",
  phone: "",
  loc: {lng: 0, lat: 0},
  lastConnection: 0,
  society: "",
  cv:{
    title: "",
    experience: "",
    competences: [],
    languages: [],
    degree: "",
    qualities: [],
  }, // cv
  announces: [{
    title: "",
    description: "",
    competences: [],
    languages: [],
    salary: "",
  }]
}; //var defaultUser


// Création des candidats
for (var i=0; i<(newUsers)/2; i++) {
  var today = Date.now();
  var pastDate = today-86400000;
  var user = Object.assign({}, defaultUser);
  user.cv = Object.assign({}, {});
  user.announce = Object.assign({}, {});
  user.status='candidate';
  user.firstname = faker.name.firstName();
  user.lastname = faker.name.lastName();
  user.description = faker.lorem.paragraph();
  user.photo = faker.internet.avatar();
  user.city = 'Paris';
  user.phone = faker.phone.phoneNumberFormat();
  user.loc = getLoc();
  user.lastConnection = faker.date.between(pastDate,today);
  user.lastConnection = faker.date.recent();
  user.cv.title = faker.name.jobType();
  user.cv.languages = getLanguages();

  users.push(user);
  // console.log(users[i].cv.title);
  // console.log(users[i].cv.languages);
  // console.log(users[i].loc);
  console.log(users);
} // for

// console.log(users);
// console.log(users[5].cv.title);
// console.log(users[6].cv.title);
// console.log(users[7].cv.title);
// console.log(users[8].cv.title);
// console.log(users[5].cv.languages);
// console.log(users[6].cv.languages);
// console.log(users[7].cv.languages);
// console.log(users[8].cv.languages);

var file = './test.json'

jsonfile.writeFile(file, users, function (err) {
  console.error(err)
})
