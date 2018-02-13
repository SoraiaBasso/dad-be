const User = require('./model/User.js').User;
const knex = require('knex')(require('./knexfile'));
const crypto = require('crypto');
const bcrypt = require("bcrypt");


module.exports = function(cardOptions, cardSuites) {
  var module = {};

  module.createUser = function({
    name,
    email,
    nickname,
    password,
    confirmation_token
  }) {


    console.log("Add user " + name + " with password " + password +
      ", email " + email + " nickname " + nickname + "confirmation token" + confirmation_token)

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
        total_games_played: 0,
        confirmed: 0,
        confirmation_token: confirmation_token
      });
    });

  };
  module.activateUser = function(userId) {
    return knex('user').where('id', '=', userId)
      .update({
        confirmation_token: '',
        confirmed: 1
      });
  };
  module.getPlatformEmail = function() {
    return knex('config').select('platform_email');
  };
  //savePasswordResetDetails
  module.savePasswordResetDetails = function(resetData) {
    return knex('password_resets')
      .insert({
        email: resetData.email,
        token: resetData.token
      });
  };
  module.getEmailByTokenFromPasswordResets = function(token) {
    return knex('password_resets').select('email').where('token', '=', token);
  };
  module.removeResetToken = function(email) {
    return knex('password_resets')
      .where('email', email)
      .del();
  };



  module.getUsers = function() {

    return knex('user').select('id', 'name', 'email', 'nickname', 'blocked', 'admin', 'reason_blocked', 'reason_reactivated', 'total_points', 'total_games_played').from('user');

  };
  module.getUser = function(username) {
    return knex('user').select('id', 'name', 'email', 'nickname', 'password', 'admin', 'reason_blocked', 'reason_reactivated', 'total_points', 'total_games_played', 'blocked', 'confirmed')
      .from('user').where('nickname', '=', username)
      .orWhere('email', '=', username);
  };
  module.getUserById = function(id) {
    return knex('user').select('id', 'name', 'email', 'nickname', 'password', 'admin', 'reason_blocked', 'reason_reactivated', 'total_points', 'total_games_played', 'confirmation_token')
      .from('user').where('id', '=', id);
  };
  module.getUserByEmail = function(email) {
    return knex('user').select().where('email', '=', email);
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
  module.changeUserPassword = function(userId, password) {
    return bcrypt.hash(password, 10).then(function(hash) {
      return knex('user').where('id', '=', userId)
        .update({
          password: hash
        });
    });
  };
  module.editAdmin = function(user) {
    return knex('user').where('id', '=', user.id)
      .update({
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

  //Total de jogadores na plataforma
   module.getTotalNumberOfPlayers = function() {

    return knex('user').count('id as count');

  };

  //Total de jogos jogados
  module.getTotalGamesPlayed = function() {
    //contar os game_id cujo estado é terminated
    return knex('games').count('id as count').where('value', '=', 'terminated');

  };
  module.getTopFiveByNumOfGames = function() {

    return knex('user').orderBy('total_games_played', 'desc').limit('5');

  };
  module.getTopFiveByPoints = function() {

    return knex('user').orderBy('total_points', 'desc').limit('5');

  }; //TODO depois e criar tabela games e use games
  module.getTopFiveByAverage = function() {

    return knex.raw('SELECT id as userId, nickname, total_points/total_games_played AS avg ' +
                            'FROM user '+
                            'ORDER BY avg desc '+
                            'LIMIT 5');


    

    //fazer uma subconsulta onde faço sum dos pontos de 1 jogador para tds os jogos que ja jogou
    //dividir pelo num de jogos pa fazer  a media (ou usar simplemnte o avg)
    //enviar os jogadores
   /* return knex.select('*').avg('sumPoints').from(function() {
                                                    this.sum('total_points as sumPoints')
                                                    .from('user').join('game_user', 'user.id', 'game_user.user_id')
                                                    .join('games', 'game_user.game_id', 'gams.id')
                                                    .groupBy('sumPoints').as('t1')
                                                    }) */

   /*var subcolumn = knex.avg('salary')
    .from('employee')
    .whereRaw('dept_no = e.dept_no')
    .as('avg_sal_dept');

    knex.select('e.lastname', 'e.salary', subcolumn)
    .from('employee as e')
    .whereRaw('dept_no = e.dept_no') */

    
  }; 
  module.getUserTotalGamesPlayed = function(userId) {
    //contar os game_id cujo estado é terminated
    return knex('games').count('id as totalGamesPlayed').where('value', '=', 'terminated').andWhere('id', '=', userId);

  };
  //TODO depois e criar tabela games e use games
  module.getUserTotalWins = function(userId) {

    return knex.raw('SELECT count(*) as totalWins ' +
                            'FROM user u '+
                            'JOIN game_user gu ON u.id=gu.user_id '+
                            'JOIN games g ON gu.game_id=g.id '+
                            'WHERE gu.team_number = g.team_winner '+
                            'AND u.id = ?;', [userId]);

    //O Where não funciona??
    /*return knex('user').select()//count('user.id as count')
                       .join('game_user', 'user.id', 'game_user.user_id')
                       .join('games', 'game_user.game_id', 'games.id')
                       .where('game_user.team_number', '=', 'games.team_winner');*/
  };
  module.getUserTotalLosts = function(userId) {

    return knex.raw('SELECT count(*) as totalLosts ' +
                            'FROM user u '+
                            'JOIN game_user gu ON u.id=gu.user_id '+
                            'JOIN games g ON gu.game_id=g.id '+
                            'WHERE gu.team_number != g.team_winner '+
                            'AND g.team_winner != 0 '+
                            'AND u.id = ?;', [userId]);

  };
  module.getUserTotalDraws = function(userId) {

    return knex.raw('SELECT count(*) as totalDraws ' +
                            'FROM user u '+
                            'JOIN game_user gu ON u.id=gu.user_id '+
                            'JOIN games g ON gu.game_id=g.id '+
                            'WHERE g.team_winner = 0 '+
                            'AND u.id = ?;', [userId]);

  };
  module.getUserTotalPoints = function(userId) {

    return knex.raw('SELECT total_points as totalPoints ' +
                            'FROM user '+
                            'WHERE id = ?;', [userId]);

  };
  module.getUserPointAverage = function(userId) {

    return knex.raw('SELECT total_points/total_games_played as pointAverage ' +
                            'FROM user '+
                            'WHERE id = ?;', [userId]);

  };

  //getUsersStatsForAdmin
  module.getGamesHistoryData = function() {

    console.log('Entrou no getGamesHistoryData');

    return knex.select(knex.raw("id, extract(DAY from g.created_at) as day"))
      .count('* as count')
      .from('games as g')
      .groupByRaw("day")
      .orderBy(knex.raw("day"));
/*

      var qry = db.knex
  .select(db.knex.raw("array_agg(t2.id) as session_ids, extract('hour' from t2.start_timestamp) as hour"))
  .count('*')
  .from('sessions as t2')
  .groupByRaw("extract('hour' from t2.start_timestamp)")
  .orderBy(db.knex.raw("extract('hour' from t2.start_timestamp)"));*/
    
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