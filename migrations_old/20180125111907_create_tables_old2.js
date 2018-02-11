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
			table.enu('value', ['Ace', '2','3','4','5','6','7','8','9','10','Jack','Queen','King']);
			table.enu('suite', ['Club','Diamond','Heart','Spade']);
			table.integer('deck_id').unsigned();
			table.foreign('deck_id').references('decks.id').onDelete('CASCADE');
			table.string('path');
			table.timestamps(false, true)
		})

	])
};



exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.dropTableIfExists('user'),
		knex.schema.dropTableIfExists('config'),
		knex.schema.dropTableIfExists('decks'),
		knex.schema.dropTableIfExists('cards')
	])

};