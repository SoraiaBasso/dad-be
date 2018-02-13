
exports.up = function(knex, Promise) {
  
return Promise.all([
    knex.schema.createTableIfNotExists('oauth_clients', function(table) {
      table.increments('id').primary();
      table.string('name');
      table.string('client_id');
      table.string('client_secret');
      table.string('redirect_uri');
      table.string('grant_types');
      table.string('scope');
      table.integer('user_id', 10).unsigned().references('id').inTable('User').onDelete('CASCADE');
    }),
    knex.schema.createTableIfNotExists('oauth_access_tokens', function(table) {
      table.increments('id').primary();
      table.string('access_token');
      table.datetime('expires');
      table.string('scope');
      table.integer('client_id').unsigned().references('id').inTable('oauth_clients').onDelete('CASCADE');
      table.integer('user_id');
    }),
    knex.schema.createTableIfNotExists('oauth_authorization_codes', function(table) {
      table.increments('id').primary();
      table.string('authorization_code');
      table.datetime('expires');
      table.string('redirect_uri');
      table.string('scope');
      table.integer('client_id').unsigned().references('id').inTable('oauth_clients').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('User').onDelete('CASCADE');
    }),
    knex.schema.createTableIfNotExists('oauth_refresh_tokens', function(table) {
      table.increments('id').primary();
      table.string('refresh_token');
      table.datetime('expires');
      table.string('scope');
      table.integer('client_id').unsigned().references('id').inTable('oauth_clients').onDelete('CASCADE');
      table.integer('user_id').unsigned().references('id').inTable('User').onDelete('CASCADE');
    }),
    knex.schema.createTableIfNotExists('oauth_scopes', function(table) {
      table.increments('id').primary();
      table.string('scope');
      table.boolean('is_default')
    }),      
  ]);
};


exports.down = function(knex, Promise) {

	return Promise.all([
		knex.schema.dropTableIfExists('oauth_access_tokens'),
		knex.schema.dropTableIfExists('oauth_authorization_codes'),
		knex.schema.dropTableIfExists('oauth_refresh_tokens'),
		knex.schema.dropTableIfExists('oauth_scopes'),
		knex.schema.dropTableIfExists('oauth_clients')
		])
   
};
