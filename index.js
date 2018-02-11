const cardOptions = ['Ace', '2', '3', '4', '5', '6', '7', 'Jack', 'Queen', 'King'];
const cardSuites = ['Club', 'Diamond', 'Heart', 'Spade'];


const express = require('express');
const bodyParser = require('body-parser');
const store = require('./store')(cardOptions, cardSuites);
const app = express();
const Oauthserver = require('oauth2-server');

const User = require('./model/User.js').User;
const Config = require('./model/Config.js').Config;


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

var platformEmail = store.getPlatformEmail().then((email) => {
  //
  //console.log('EMAIL EMAIL EMAIL EMAIL EMAIL');
  console.log(email[0].platform_email);
  //email = email[0];
  return email[0].platform_email;
});

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: platformEmail,
    pass: 'secret123'
  }
});

/*
const mailOptions = {
  from: 'blackjack.projectdad@gmail.com', // sender address
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


require('./routes.js')(app, transporter, store, passport);

//Rota para login
/*app.post('/login', passport.authenticate('local'), function(req, res) {
  res.send(req.user);
});*/


server = app.listen(7555, () => {
  console.log('Server running on http://localhost:7555')
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

  gameSchema.plugin(autoIncrement.plugin, { model: 'Game', field: 'id' });

  var Game = mongoose.model('Game', gameSchema);

  require('./socketio.js')(server, store, Game, cardOptions, cardSuites);

  /*
    var silence = new Game({
      name: 'Silence'
    });
    console.log(silence.name); // 'Silence'

    silence.save(function (err, silence) {
      if (err) return console.error(err);
    });
  */
});