const cardOptions = ['Ace', '2', '3', '4', '5', '6', '7', 'Jack', 'Queen', 'King'];
const cardSuites = ['Club', 'Diamond', 'Heart', 'Spade'];


const express = require('express');
const bodyParser = require('body-parser');
const store = require('./store')(cardOptions, cardSuites);
const app = express();
const Oauthserver = require('oauth2-server');

const User = require('./model/User.js').User;
const Config = require('./model/Config.js').Config;


var fs = require('fs');
const fileUpload = require('express-fileupload');
app.use(fileUpload());

//Para poder ir buscar o auth token => req.token
const bearerToken = require('express-bearer-token');
app.use(bearerToken());


app.use(express.static('public'));
//app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());


const security = require("./security")(store);
security.initMiddleware(app);
passport = security.getPassport();


var nodemailer = require('nodemailer');

store.getPlatformEmail().then((email) => {
  
  //console.log('EMAIL EMAIL EMAIL EMAIL EMAIL');
  console.log(email[0].platform_email);
  var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: email[0].platform_email,
      //user: 'dad.sueca@gmail.com',
      pass: 'secret*0D18'
    }
  });

  /*
  const mailOptions = {
    from: 'dad.sueca@gmail.com', // sender address
    to: 'to@email.com', // list of receivers
    subject: 'Subject of your email', // Subject line
    html: '<p>Your html here</p>' // plain text body
  }; */


  app.use(function(req, res, next) {
    //Estas Duas linhas de código é para permitir CORS 
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  });


  require('./routes.js')(app, transporter, store, passport, fs, email[0].platform_email);

  //Rota para login
  /*app.post('/login', passport.authenticate('local'), function(req, res) {
    res.send(req.user);
  });*/

  server = app.listen(8080, () => {
    console.log('Server running on http://localhost:8080')
  })


  var mongoose = require('mongoose');
  var autoIncrement = require('mongoose-auto-increment');
  mongoose.connect('mongodb://localhost/dad-mongodb');

  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log("Connected to MongoDB");


    autoIncrement.initialize(db);

    var gameSchema = mongoose.Schema({
      //id: Number,
      status: {
        type: String,
        default: "pending"
      },
      cardTrump: {
        userId: Number,
        played: {
          type: Boolean,
          default: false
        },
        trumpCard: Object,
      },
      total_players: {
        type: Number,
        default: 1
      },
      team1_cardpoints: Number,
      team2_cardpoints: Number,
      team1_cheating: Boolean,
      team2_cheating: Boolean,
      created_by: Object,
      created_by_id: Number,
      deck_used: Number,

      users: Array,
      currentPlayerId: Number,
      table: Object,
      suiteInGame: {
        type: String,
        default: null
      },
    }, {
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    });

    gameSchema.plugin(autoIncrement.plugin, {
      model: 'Game',
      field: 'id'
    });

    var Game = mongoose.model('Game', gameSchema);

    require('./socketio.js')(server, store, Game, cardOptions, cardSuites, fs);

  });



});