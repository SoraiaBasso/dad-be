const User = require('./model/User.js').User;
const knex = require('knex')(require('./knexfile'));
const bcrypt = require("bcrypt");

module.exports = function(cardOptions, cardSuites) {
  var module = {};

  module.createUser = function({
    name,
    email,
    nickname,
    password
  }) {
    console.log("Add user " + name + " with password " + password +
      ", email " + email + " and nickname " + nickname)

    return bcrypt.hash(password, 10).then(function(hash) {
      return knex('user').insert({
        name: name,
        email: email,
        nickname: nickname,
        password: hash,
        admin: false,
        blocked: false,
        reason_blocked: '',
        reason_reactivated: '',
        total_points: 0,
        total_games_played: 0
      });
    });

  };
  module.getPlatformEmail = function() {
    return knex('config').select('platform_email');
  };
  module.getUsers = function() {

    return knex('user').select('id', 'name', 'email', 'nickname', 'blocked', 'admin', 'reason_blocked', 'reason_reactivated', 'total_points', 'total_games_played').from('user');

  };
  module.getUser = function(username) {
    return knex('user').select('id', 'name', 'email', 'nickname', 'password', 'admin', 'reason_blocked', 'reason_reactivated', 'total_points', 'total_games_played')
      .from('user').where('nickname', '=', username)
      .orWhere('email', '=', username);
  };
  module.getUserById = function(id) {
    return knex('user').select('id', 'name', 'email', 'nickname', 'password', 'admin', 'reason_blocked', 'reason_reactivated', 'total_points', 'total_games_played')
      .from('user').where('id', '=', id);
  };
  module.getUserByToken = function(token) {
    return knex('user').select('id', 'name', 'email', 'nickname', 'password', 'admin').from('user').where('token', '=', token);
  };
  //TODO isto esta hardcoded nao se se é preciso mudar pk nao sei se é suposto haver mais do que um email nesta 
  //tabela
  module.getConfigDetails = function() {
    return knex('config').select('platform_email', 'platform_email_properties').from('config').where('id', '=', 1);
  };
  //quando o user faz login, guarda o token na bd
  module.updateUserToken = function(id, token) {

    return knex('user').where('id', '=', id)
      .update({
        token: token
      });
  };
  module.editUser = function(user) {
    return knex('user').where('id', '=', user.id)
      .update({
        name: user.name,
        nickname: user.nickname,
        email: user.email
      })
  };
  module.editAdmin = function(user) {
    return knex('user').where('id', '=', user.id)
      .update({
        name: user.name,
        nickname: user.nickname,
        email: user.email
      })
  };

  module.editUserPassword = function(id, password) {
    return knex('user').where('id', '=', id)
      .update({
        password: password
      })
  };
  module.editAdminPassword = function(id, oldPassword, newPassword) {
    return knex('user').where('id', '=', id).andWhere('password', '=', oldPassword)
      .update({
        password: newPassword
      })
  };
  module.deleteUser = function(id) {
    return knex('user').where('id', '=', id).delete();

  };
  module.blockUser = function(id, reason_blocked) {
    console.log(id);
    return knex('user').where('id', '=', id).update({
      blocked: 1,
      reason_blocked: reason_blocked,
      /*apagamos o campo reason_reactivated pois já não faz sentido guardar a mensagem*/
      reason_reactivated: ''
    });
  };
  module.unblockUser = function(id, reason_reactivated) {
    console.log(id);
    return knex('user').where('id', '=', id).update({
      blocked: 0,
      reason_reactivated: reason_reactivated,
      /*apagamos o campo reason_blocked pois já não faz sentido guardar a mensagem*/
      reason_blocked: ''
    });
  };
  /************************************STATISTICAS************************************/
  module.getTotalNumberOfPlayers = function() {
    return knex('user').count('id as count');
    /* knex('user').count('id')
   
     });*/


  }; //TODO depois de criar a tabela
  module.getTotalGamesPlayed = function() {
    //so para devolver alguma coisa estou a usar tabela users
    return knex('user').count('id as count');

  };
  module.getTopFiveByNumOfGames = function() {

    return knex('user').orderBy('total_games_played', 'desc').limit('5');

  };
  module.getTopFiveByPoints = function() {

    return knex('user').orderBy('total_points', 'desc').limit('5');

  }; //TODO depois e criar tabela games e use games
  module.getTopFiveByAverage = function() {

    //fazer uma subconsulta onde faço sum dos pontos de 1 jogador para tds os jogos que ja jogou
    //dividir pelo num de jogos pa fazer  a media (ou usar simplemnte o avg)
    //enviar os jogadores

    //so para devolver alguma coisa
    return knex('user').orderBy('total_games_played', 'desc').limit('5');
  }; //TODO depois e criar tabela games e use games
  module.getUserTotalWins = function() {

    // return kenx('games').count(/*nome da coluna*/).where(/*nome da cluna com user_id*/, '=', id);

    //so para devolver alguma coisa estou a usar tabela users
    return knex('user').count('id as count');

  };
  module.getUserTotalLosts = function() {

    // return kenx('games').count(/*nome da coluna*/).where(/*nome da cluna com user_id*/, '=', id); e tb onde a coluna ta
    //tabela games tenha valor 0 (tipo wins=0)

    //so para devolver alguma coisa estou a usar tabela users
    return knex('user').count('id as count');

  };
  module.getUserTotalDraws = function() {

    // nao sei como vou contar isto

    //so para devolver alguma coisa estou a usar tabela users
    return knex('user').count('id as count');

  };
  module.insertPathFile = function(pathFile, deckname) {
    return knex('decks').insert({
      name: deckname,
      hidden_face_image_path: pathFile
    });
  };
  module.getDecks = function() {
    return knex('decks').select();
  };
  module.createNewGame = function(userId, deckId) {
    return knex('games').insert({
      total_players: 1,
      created_by: userId,
      deck_used: deckId
    }).then((gameIds) => {
      gameId = gameIds[0]
      console.log("created game id: " + gameId);

      return knex('game_user').insert({
        game_id: gameId,
        user_id: userId
      })

    })
  };
  module.createCards = function(filePaths, deckId) {


    //value: Ace, 2, 3, 4, 5, 6, 7, 8, 9, 10, Jack, Queen, King
    //suite: Club, Diamond, Heart, Spade
    //deck_id
    //path
    let cards = [];
    for (let i = 0; i < filePaths.length; i++) {
      let card = {}

    }
    for (let a = 0; a < cardSuites.length; a++) {
      for (let i = 0; i < cardOptions.length; i++) {

        let filePathsIndex = a * cardOptions.length + i;

        if (filePaths[filePathsIndex] !== false) {
          cards.push({
            value: cardOptions[i],
            suite: cardSuites[a],
            deck_id: deckId,
            path: filePaths[filePathsIndex]
          });
        }
      }

    }
    console.log("cards");
    console.log(cards);

    return knex('cards').insert(cards);


  };
  module.getCardsPath = function(deckId, owncards) {


    var whereCards = '';
    for (var i = 0; i < owncards.length; i++) {
      whereCards += '(cards.suite = \'' + owncards[i].cardSuite 
      + '\' AND cards.value = \'' + owncards[i].cardValue + '\')'
      if(i < owncards.length-1) {
        whereCards += ' OR';
      }
    }


    // return knex.select('path').from('cards').where('cards.deck_id', '=', deckId);
    /*return knex.select('path').from('cards').where(
    {
      'cards.deck_id': deckId ,
      'cards.suite': owncards.cardSuite,
       'cards.value': owncards.cardValue
    });*/

    return knex.select('value', 'suite', 'path').from('cards')
    .whereRaw(whereCards)
    .andWhere('cards.deck_id', '=', deckId)
    .on('query', function(data) {
      console.log(data);
    })

    
  };

  module.getHiddenFacePath = function(deckId) {
    return knex.select('hidden_face_image_path as path').from('decks')
    .where('id', '=', deckId);


  };

  module.createGame = function(game) {
      return knex('games').insert(game);
  };


  module.updateUsersEndOfGame = function(users, gameId) {
      var promises = [];

      for (var i = 0; i < users.length; i++) {
        promises.push(knex('user')
        .whereIn('id', users[i].id)
        .update({
          'total_points': knex.raw('total_points + '+users[i].total_points),
          'total_games_played': knex.raw('total_games_played + 1')
        }));
        promises.push(knex('game_user').insert({
          game_id: gameId,
          user_id: users[i].id,
          team_number: users[i].team_number
        }));

      }
      return Promise.all(promises);

  };



  return module;
}