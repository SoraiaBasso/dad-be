
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries

  return knex('decks').del()
    .then(() => {
      // Inserts seed entries
      return knex('decks').insert(
        {name: 'Default deck', hidden_face_image_path: './store/semFace.png', active: true, complete: true} 
      ).then(() => {


	  return knex('cards').del()
	    .then(function () {


	      const cardOptions = ['Ace', '2', '3', '4', '5', '6', '7', 'Jack', 'Queen', 'King'];
	      const cardSuites = ['Club', 'Diamond', 'Heart', 'Spade'];
	      const cardNames = ['p', 'o', 'c', 'e'];

	      let cards = [];

	      for(let a = 0; a < cardSuites.length; a++) {
	          for(let i = 0; i < cardOptions.length; i++) {
	            
	            let aux = i +1;
	            if(aux > 7){
	            	aux += 3;
	            }


	              cards.push(
	                  {value: cardOptions[i], 
	                   suite: cardSuites[a],
	                   deck_id: 1,
	                   path: "./store/"+cardNames[a]+aux+".png" }
	                );
	              } 
	            
	        }
	        console.log("cards");
	        console.log(cards);

	      return knex('cards').insert(cards);
	    });


      })
    });
};



