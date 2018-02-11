//cria a tabela
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
      table.timestamps(false, true)
    })
  ]);
}

//apaga a tabela
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user')
}