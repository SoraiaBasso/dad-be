
exports.up = function(knex, Promise) {
  return Promise.all([
		knex.schema.createTableIfNotExists('user', function(table) {
			table.increments('id').primary();
			table.string('name').notNullable();
			table.string('nickname').notNullable().unique();
			table.string('email').notNullable().unique();
			table.string('password').notNullable();
			table.boolean('admin').notNullable();
			table.boolean('blocked').notNullable();
			table.string('reason_blocked').notNullable();
			table.string('reason_reactivated').notNullable();
			table.integer('total_points').notNullable();
			table.integer('total_games_played').notNullable();
			table.string('token');
			table.timestamps(false, true)
		}),

		knex.schema.createTableIfNotExists('password_resets', function(table) {
			table.string('email');  //na estrutura dos professors tem index (), por?
			table.string('token');
			table.timestamps(false, true)
		}),

			knex.schema.createTableIfNotExists('config', function(table) {
			table.increments('id').primary();
			table.string('platform_email');
			table.string('platform_email_properties');
			table.string('img_base_path');
			table.timestamps(false, true)
		}),

		knex.schema.createTableIfNotExists('decks', function(table) {
			table.increments('id').primary();
			table.string('name');
			table.string('hidden_face_image_path');
			table.boolean('active').defaultTo(true);
			table.boolean('complete').defaultTo(false);
			table.timestamps(false, true)
		}),

		knex.schema.createTableIfNotExists('cards', function(table) {
			table.increments('id');
			table.enu('value', ['Ace', '2','3','4','5','6','7','Jack','Queen','King']);
			table.enu('suite', ['Club','Diamond','Heart','Spade']);
			table.integer('deck_id').unsigned();
			table.foreign('deck_id').references('decks.id').onDelete('CASCADE');
			table.string('path');
			table.timestamps(false, true)
		}),

		knex.schema.createTableIfNotExists('games', function(table) {
			table.increments('id').primary();
			table.enu('value', ['status', 'pending','active','terminated','canceled']).defaultTo('pending');
			//Nº de pontos das cartas
			table.integer('team1_cardpoints').nullable();
			table.integer('team2_cardpoints').nullable();
			//Nº da equipa que ganhou
			table.integer('team_winner').nullable();
			//Nº da equipa que desconfiou (null-> nenhuma equipa desconfiou)
			table.integer('team_desconfiou').nullable();
			//Nº da equipa que renunciou (null-> nenhuma equipa renunciou)
			table.integer('team_renunciou').nullable();
			//Nº de pontos finais do jogo (a atribuir aos jogadores)
              //Valores possíveis (-4, 0, 1, 2, 4)
            table.integer('team1_points').nullable();
            table.integer('team2_points').nullable();
            table.integer('created_by').unsigned();
			table.foreign('created_by').references('user.id');
			table.integer('deck_used').unsigned();
			table.foreign('deck_used').references('decks.id');
			table.timestamps(false, true)
		}),

		knex.schema.createTableIfNotExists('game_user', function(table) {
			table.integer('game_id').unsigned();
			table.foreign('game_id').references('games.id').onDelete('CASCADE');
			table.integer('user_id').unsigned();
			table.foreign('user_id').references('user.id');
			table.integer('team_number')
		})

	])
};

exports.down = function(knex, Promise) {
   return Promise.all([
  		knex.schema.dropTableIfExists('game_user'),
		knex.schema.dropTableIfExists('games'),
		knex.schema.dropTableIfExists('cards'),
		knex.schema.dropTableIfExists('decks'),
		knex.schema.dropTableIfExists('config'),
		knex.schema.dropTableIfExists('password_resets'),
		knex.schema.dropTableIfExists('user')
	])
};
