
exports.up = function(knex, Promise) {
    knex('user').insert({
      name: 'admin',
      email: 'admin@mail.dad',
      nickname: 'admin',
      password: 'secret',
      admin: true,
      blocked: false,
      reason_blocked: '',
      reason_reactivated: '',
      total_points: 0,
      total_games_played: 0
    }).then(() => {
		return Promise.all([
		    knex('oauth_clients').insert({
		      name: null,
		      client_id: 'democlient',
		      client_secret: 'democlientsecret',
		      redirect_uri: 'http://localhost/cb',
		      grant_types: null,
		      scope: null,
		      user_id: 1
		    }),
		      knex('oauth_scopes').insert({
		      scope: 'profile',
		      is_default: null
		    })
		]);

  	});



};

exports.down = function(knex, Promise) {
  
};
