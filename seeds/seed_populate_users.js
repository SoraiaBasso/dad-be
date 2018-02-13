const bcrypt = require("bcrypt");
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('user').del()
    .then(function() {
      // Inserts seed entries

      return bcrypt.hash('123', 10).then(function(hash) {

        var users = [{
            name: 'soraia 1',
            email: 'soraia1@mail.com',
            nickname: 'soraia1',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 2',
            email: 'soraia2@mail.com',
            nickname: 'soraia2',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 3',
            email: 'soraia3@mail.com',
            nickname: 'soraia3',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 4',
            email: 'soraia4@mail.com',
            nickname: 'soraia4',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 5',
            email: 'soraia5@mail.com',
            nickname: 'soraia5',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 6',
            email: 'soraia6@mail.com',
            nickname: 'soraia6',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 7',
            email: 'soraia7@mail.com',
            nickname: 'soraia7',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 8',
            email: 'soraia8@mail.com',
            nickname: 'soraia8',
            password: hash,
            admin: false,
            blocked: true,
            reason_blocked: 'Very bad person',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 9',
            email: 'soraia9@mail.com',
            nickname: 'soraia9',
            password: hash,
            admin: false,
            blocked: true,
            reason_blocked: 'Not fairplay!',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 10',
            email: 'soraia10@mail.com',
            nickname: 'soraia10',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 11',
            email: 'soraia11@mail.com',
            nickname: 'soraia11',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 12',
            email: 'soraia12@mail.com',
            nickname: 'soraia12',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 13',
            email: 'soraia13@mail.com',
            nickname: 'soraia13',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 14',
            email: 'soraia14@mail.com',
            nickname: 'soraia14',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },

          {
            name: 'soraia 15',
            email: 'soraia15@mail.com',
            nickname: 'soraia15',
            password: hash,
            admin: false,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          },
        ];

        return bcrypt.hash('secret', 10).then(function(hashSecret) {


          users.push({
            name: 'admin',
            email: 'admin@mail.dad',
            nickname: 'admin',
            password: hashSecret,
            admin: true,
            blocked: false,
            reason_blocked: '',
            reason_reactivated: '',
            total_points: 0,
            total_games_played: 0,
            confirmed: 1,
            confirmation_token: ''
          });

          return knex('user').insert(users).then(() => {

           /* return knex('games').del()
              .then(function() {
                return knex('games').insert([{
                    value: 'terminated',
                    team1_cardpoints: 65,
                    team2_cardpoints: 10,
                    team_winner: 1,
                    team1_points: 1,
                    team2_points: 0,
                    created_by: 3,
                    deck_used: 1
                  }, {
                    value: 'terminated',
                    team1_cardpoints: 91,
                    team2_cardpoints: 30,
                    team_winner: 1,
                    team1_points: 2,
                    team2_points: 0,
                    created_by: 4,
                    deck_used: 1
                  }, {
                    value: 'terminated',
                    team1_cardpoints: 0,
                    team2_cardpoints: 120,
                    team_winner: 2,
                    team1_points: 0,
                    team2_points: 4,
                    created_by: 3,
                    deck_used: 1
                  }, {
                    value: 'terminated',
                    team1_cardpoints: 60,
                    team2_cardpoints: 60,
                    team_winner: 0,
                    team1_points: 0,
                    team2_points: 0,
                    created_by: 11,
                    deck_used: 1
                  },

                ]);
              });*/
          }); 
        });
      });
    });
};