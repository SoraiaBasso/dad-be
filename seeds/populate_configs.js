
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('config').del()
    .then(function () {
      
      return knex('config').insert(
        {platform_email: 'dad.sueca@gmail.com', platform_email_properties: '', img_base_path: ''}
      );
    });
};
