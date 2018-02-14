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
 
  module.getConfigDetails = function() {
    return knex('config').select('platform_email', 'platform_email_properties').from('config').where('id', '=', 1);
  };

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

  /*************************************************STATISTICS***********************************************/

  //Total de jogadores na plataforma
   module.getTotalNumberOfPlayers = function() {

    return knex('user').count('id as count');

  };

  //Total de jogos jogados
  module.getTotalGamesPlayed = function() {
    //contar os game_id cujo estado é terminated
    return knex('games').count('id as count').where('value', '=', 'terminated');

  };

  //top 5 jogadores com mais jogos
  module.getTopFiveByNumOfGames = function() {

    return knex('user').orderBy('total_games_played', 'desc').limit('5');

  };

  //top 5 jogadores com mais pontos
  module.getTopFiveByPoints = function() {

    return knex('user').orderBy('total_points', 'desc').limit('5');

  }; 

  //top 5 jogadores com melhor média
  module.getTopFiveByAverage = function() {

    return knex.raw('SELECT id as userId, nickname, total_points/total_games_played AS avg ' +
                            'FROM user '+
                            'ORDER BY avg desc '+
                            'LIMIT 5');
  
  }; 

  //total de jogos de um user
  module.getUserTotalGamesPlayed = function(userId) {
    //contar os game_id cujo estado é terminated
    return knex('games').count('id as totalGamesPlayed').where('value', '=', 'terminated').andWhere('id', '=', userId);

  };
  //total de vitórias de um user
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

  //total de derrotas de um user
  module.getUserTotalLosts = function(userId) {

    return knex.raw('SELECT count(*) as totalLosts ' +
                            'FROM user u '+
                            'JOIN game_user gu ON u.id=gu.user_id '+
                            'JOIN games g ON gu.game_id=g.id '+
                            'WHERE gu.team_number != g.team_winner '+
                            'AND g.team_winner != 0 '+
                            'AND u.id = ?;', [userId]);

  };

  //total de empates de um user
  module.getUserTotalDraws = function(userId) {

    return knex.raw('SELECT count(*) as totalDraws ' +
                            'FROM user u '+
                            'JOIN game_user gu ON u.id=gu.user_id '+
                            'JOIN games g ON gu.game_id=g.id '+
                            'WHERE g.team_winner = 0 '+
                            'AND u.id = ?;', [userId]);

  };

  //total de pontos de um user
  module.getUserTotalPoints = function(userId) {

    return knex.raw('SELECT total_points as totalPoints ' +
                            'FROM user '+
                            'WHERE id = ?;', [userId]);

  };

  //média de pontos de um user
  module.getUserPointAverage = function(userId) {

    return knex.raw('SELECT total_points/total_games_played as pointAverage ' +
                            'FROM user '+
                            'WHERE id = ?;', [userId]);

  };

  //getUsersStatsForAdmin
  module.getGamesHistoryData = function() {

    console.log('Entrou no getGamesHistoryData');

    return knex.select(knex.raw("extract(DAY from g.created_at) as day"))
      .count('* as count')
      .from('games as g')
      .groupByRaw("extract(DAY from g.created_at)")
      .orderBy(knex.raw("extract(DAY from g.created_at)"));
/*

      var qry = db.knex
  .select(db.knex.raw("array_agg(t2.id) as session_ids, extract('hour' from t2.start_timestamp) as hour"))
  .count('*')
  .from('sessions as t2')
  .groupByRaw("extract('hour' from t2.start_timestamp)")
  .orderBy(db.knex.raw("extract('hour' from t2.start_timestamp)"));*/
    
  };
/*******************************************DECKS****************************************************/
  module.insertPathFile = function(pathFile, deckname) {
    return knex('decks').insert({
      name: deckname,
      hidden_face_image_path: pathFile,
      active: 0
    });
  };
  module.setCompleteDeck = function(deckId, isCompleteDeck) {
    return knex('decks').where('id', '=', deckId).update({
      complete: isCompleteDeck
    });
  };
  module.setActiveDeck = function(deckId, isActiveDeck) {
    return knex('decks').where('id', '=', deckId).update({
      active: isActiveDeck
    });
  };
  module.getDecks = function() {
    return knex('decks').select();
  };
  module.getCompleteDecks = function() {
    return knex('decks').select().where('complete', '=', true);
  };
  module.getDeck = function(deckId) {
    return knex('decks').select().where('id', '=', deckId);
  };
  module.getDeckCards = function(deckId) {
    return knex('cards').select().where('deck_id', '=', deckId);
  };
  module.getCard = function(deckId, suite, option) {
    return knex('cards').select().where('deck_id', '=', deckId)
    .andWhere('suite', '=', suite).andWhere('value', '=', option);
  };
  module.getCardsByPath = function(paths) {
    var pathsAux = [];
    for (var i = 0; i < paths.length; i++) {
      if(paths[i]) {
        pathsAux.push(paths[i]);
      }
    }
    console.log(pathsAux);
    return knex.select().from('cards').whereIn('path', pathsAux);
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

    let cardsToCreate = [];
    let cardsToUpdate = [];
    let promises = [];
    for (let i = 0; i < filePaths.length; i++) {
      let card = {}

    }
    for (let a = 0; a < cardSuites.length; a++) {
      for (let i = 0; i < cardOptions.length; i++) {

        let filePathsIndex = a * cardOptions.length + i;

        if (filePaths[filePathsIndex] !== false) {

          var promise = module.getCard(deckId, cardSuites[a], cardOptions[i]).then((cards) => {
            var oldCard = cards[0];
            var newCard ={
              value: cardOptions[i],
              suite: cardSuites[a],
              deck_id: deckId,
              path: filePaths[filePathsIndex]
            };

            if(oldCard){
              newCard.id = oldCard.id;
              cardsToUpdate.push(newCard);
            }else{
              cardsToCreate.push(newCard);
            }
          });
          promises.push(promise);
        }
      }
    }

    return Promise.all(promises).then(() => {
      console.log("cardsToCreate");
      console.log(cardsToCreate);
      console.log("cardsToUpdate");
      console.log(cardsToUpdate);

      var updatePromises = [];

      updatePromises.push(knex('cards').insert(cardsToCreate));

      for (var i = 0; i < cardsToUpdate.length; i++) {
        var cardToUpdate = cardsToUpdate[i];

        var promise = knex('cards').where('id', '=', cardToUpdate.id).update({
          path: cardToUpdate.path,
        });
        updatePromises.push(promise);

      }
      return Promise.all(updatePromises);
    });
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
  module.removeCardsByDeckId = function(deckId) {
    return knex('cards')
      .where('deck_id', deckId)
      .del();
  };
  module.removeDeck = function(deckId) {
    return knex('decks')
      .where('id', deckId)
      .del();
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
