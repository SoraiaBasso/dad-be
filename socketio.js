module.exports = function(server, store, Game, cardOptions, cardSuites) {
	/*var io = require('socket.io')(server);
	 
	 
	 */
	var io = require('socket.io')(server);
	var express = require('express');
	var app = express();
	var fs = require('fs');

	shuffle = function(a) {
		var j, x, i;
		for (i = a.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = a[i];
			a[i] = a[j];
			a[j] = x;
		}
		return a;
	}

	returnPendingGames = function(sendTo) {
		Game.find({
			status: "pending"
		}, function(err, games) {
			if (err) return console.error(err);
			//console.log("Games:", games);
			sendTo.emit('pendingGames', {
				games: games
			});
		});
	}

	filterActiveGamesByUser = function(games, userId) {


		//console.log("ENTROU NO RETURN FILTER ACTIVE GAMES by user");
		//console.log("ENTROU NO RETURN FILTER ACTIVE GAMES by user");

		var activeGames = [];

		for (var i = 0; i < games.length; i++) {
			let currentGame = games[i];
			//	console.log("games.length", games.length)

			let isInGame = false;
			for (var j = 0; j < currentGame.users.length; j++) {
				let user = currentGame.users[j];

				//console.log("user.id", user.id)
				//console.log("userId", userId)

				if (user.id == userId) {
					isInGame = true;
					for (var l = 0; l < user.cards.length; l++) {
						user.cards[l].cardImage = null;
					}
				} else {
					//se nao for o proprio user apaga as cartas do array 
					user.cardCount = user.cards.length;
					delete user.cards;
				}
				//console.log("CARTAS DO USER DENTRO DO METODO filterActiveGamesByUser");
				//console.log("user.cards", user.cards)
			}
			if (isInGame) {
				//console.log("is in game!");
				delete currentGame.team1_cheating;
				delete currentGame.team2_cheating;


				activeGames.push(currentGame);
			}
		}

		return activeGames;
	}



	returnActiveGames = function(sendTo, userId) {

		//console.log("ENTROU NO RETURN ACTIVE GAMES");

		Game.find({
			status: "active"
		}, function(err, games) {
			if (err) return console.error(err);
			activeGames = filterActiveGamesByUser(games, userId);

			//console.log("ACTIVE GAMES DEPOIS DE FILTRADOS POR USER");
			//console.log(activeGames);

			sendTo.emit('activeGames', {
				games: activeGames
			});
		});
	}
	returnActiveGamesBySocketId = function(sendToId, userId) {

		console.log('ENTROU NO RETURN ACTIVE GAMES BY SOCKETiD');

		Game.find({
			status: "active"
		}, function(err, games) {
			if (err) return console.error(err);

			activeGames = filterActiveGamesByUser(games, userId);

			//console.log('ACTIVE GAMES DEPOIS DE FILTRADOS BY USER');

			//console.log(activeGames);

			io.to(sendToId).emit('activeGames', {
				games: activeGames
			});
		});
	}
	returnActiveGamesToRoom = function(sendToRoom, userId) {

		console.log('ENTROU NO RETURN ACTIVE GAMES TO ROOM');
		//console.log('sendToRoom', sendToRoom);

		Game.find({
			status: "active"
		}, function(err, games) {
			if (err) return console.error(err);

			activeGames = filterActiveGamesByUser(games, userId);

			console.log('ACTIVE GAMES DEPOIS DE FILTRADOS BY USER');

			//console.log(activeGames);

			io.sockets.in(sendToRoom).emit('activeGames', {
				games: activeGames
			});
		});
	}



	returnCardImages = function(sendTo, cards) {

		/*	console.log('ENTROU NOreturnCardImages');
			console.log('Cartas a enviar ao cliente');
			console.log('Cartas a enviar ao cliente');
			console.log(cards);*/


		sendTo.emit('cardImages', {
			cards: cards
		});
	}

	returnFirstPlayerInGame = function(sendTo, gameId) {

		Game.find({
			id: gameId
		}, function(err, game) {


			var firstPlayer = game[0].users[Math.floor(Math.random() * game[0].users.length)];


			sendTo.emit('firstPlayerId', {
				firstPlayerId: firstPlayer.id
			});
		});
	}


	getCardsImages = function(cards, deckId) {

		var promises = cards.map(function(card) {
			return new Promise(function(card, resolve, reject) {
				fs.readFile(card.path, function(err, data) {
					if (err) {
						console.log(err);
						reject("");
					} else {
						card.image = data.toString('base64');
						resolve(card);
					}
				});
			}.bind(this, card));
		});

		return Promise.all(promises).then(function(results) {
			var cardsToSend = {
				deckId: deckId,
				cards: []
			};

			for (var i = 0; i < results.length; i++) {
				cardsToSend.cards.push(results[i]);
			}

			return cardsToSend;
		});

	}


	getHiddenFaceImage = function(deckId) {

		return store.getHiddenFacePath(deckId).then((hiddenFacePath) => {
			//console.log(hiddenFacePath);
			hiddenFacePath = hiddenFacePath[0].path;
			var card = {
				path: hiddenFacePath,
				image: ''
			};

			return new Promise(function(card, resolve, reject) {
				fs.readFile(card.path, function(err, data) {
					if (err) {
						console.log(err);
						reject("");
					} else {
						card.image = data.toString('base64');
						resolve(card);
					}
				});
			}.bind(this, card));
		});
	}

	createFinishedGame = function(team1Points, team2Points, game, teamWinner,
									team_desconfiou, team_renunciou) {
							//debug
		console.log('SOcketIO - TEAM1_POINTS = ')
		console.log(team1Points)
		console.log('SOcketIO - TEAM2_POINTS = ')
		console.log(team2Points)

		var gameToCreate = {
			id: game.id,
			value: game.status,
			team1_cardpoints: game.team1_cardpoints,
			team2_cardpoints: game.team2_cardpoints,
			team_winner: teamWinner,
			team_desconfiou: team_desconfiou,
			team_renunciou: team_renunciou,
			team1_points: team1Points,
			team2_points: team2Points,
			created_by: game.created_by_id,
			deck_used: game.deck_used
		}

		var usersToUpdate = [];

		for (var i = 0; i < game.users.length; i++) {
			var user = game.users[i];
			var userTotalPoints = 0;
			if (game.users[i].teamId == 1) {
				userTotalPoints = team1Points;
			} else {
				userTotalPoints = team2Points;
			}

			usersToUpdate.push({
				id: user.id,
				total_points: userTotalPoints,
				team_number: user.teamId
			});

		var room = "game_" + game.id + "_user_" + user.id;

		io.sockets.in(room).emit('gameOver', {
				game: game, teamWinner: teamWinner
			});


		}

		store.createGame(gameToCreate).then(() => {
			store.updateUsersEndOfGame(usersToUpdate, game.id);
		})





	}




	require('socketio-auth')(io, {
		authenticate: function(socket, data, callback) {
			//get credentials sent by the client 
			var token = data.token;

			if (!token) {
				console.log("No token for socket auth");
				return callback(new Error("No token"));
			}

			store.getUserByToken(token).then((users) => {
				user = users[0];
				if (!user) {
					console.log("No User found for socket auth");
					return callback(new Error("User not found"));
				}
				Game.find({
					status: "active"
				}, function(err, games) {
					if (err) return console.error(err);

					for (var i = 0; i < games.length; i++) {
						var game = games[i];

						for (var j = 0; j < game.users.length; j++) {
							var userAux = game.users[j];
							if(user.id == userAux.id){
								console.log("User " + user.id + " is in game " + game.id);
								var socketRoom = "game_" + game.id + "_user_" + user.id;
								socket.join(socketRoom);

							}
						}


					}




				});



				return callback(null, true);
			});
		}
	});

	io.on('connection', function(socket) {
		console.log('a user connected');

		socket.on('disconnect', function() {
			console.log('user disconnected');
		});
		socket.on('getPendingGames', function() {
			console.log('getPendingGames');
			returnPendingGames(socket);
		});

		socket.on('getActiveGames', function(data) {
			//console.log('getActiveGames', data);

			if (!data.userId) return console.error("userId was not sent!");

			store.getUserById(data.userId).then((user) => {
				user = user[0];
				if (!user) return console.error("User with ID " + data.userId + "does not exist!");

				returnActiveGames(socket, data.userId);

			});
		});
		socket.on('createNewGame', function(data) {
			//console.log('createNewGame');
			//console.log(data);
			store.getDecks().then((decks) => {
				if (!decks || decks.length == 0) {
					console.log("No Decks!");
					return;
				}
				var deck = decks[Math.floor(Math.random() * decks.length)];
				//console.log("Chosen deck:", deck);
				delete data.user.password;
				delete data.user.token;
				delete data.user.admin;
				delete data.user.reason_blocked;
				delete data.user.reason_reactivated;
				delete data.user.total_points;
				delete data.user.total_games_played;


				//data.user.socketId = socket.id;

				var game = new Game({
					created_by: data.user,
					created_by_id: data.user.id,
					deck_used: deck.id
				});

				game.users.push(data.user);

				/*
								  socket.join('justin bieber fans');
								  socket.broadcast.to('justin bieber fans').emit('new fan');
								  io.sockets.in('rammstein fans').emit('new non-fan');
				*/


				game.save(function(err, game) {
					if (err) return console.error(err);
					//console.log("CREATED GAME: ", game);
					var room = "game_" + game.id + "_user_" + data.user.id;
					console.log("room", room);
					socket.join(room);

					socket.emit('returnGameId', {
						gameId: game.id
					})
					returnPendingGames(io.sockets);

				});


			});
		});

		socket.on('joinGame', function(data) {
			//console.log('joinGame', data);

			if (!data.gameId || !data.userId) {
				console.log("Required fields not received!");
				return;
			}
			Game.findOne({
				id: data.gameId,
				status: "pending"
			}, function(err, game) {
				if (err) return console.error(err);

				store.getUserById(data.userId).then((user) => {
					user = user[0];
					if (!user) return console.error("User with ID " + data.userId + "does not exist!");
					delete user.password;
					delete user.token;
					delete user.admin;
					delete user.reason_blocked;
					delete user.reason_reactivated;
					delete user.total_points;
					delete user.total_games_played;

					//console.log("JOINED USERS:", game.users);
					if (game.users.length >= 4) return console.error("Game is full!");
					for (var i = 0; i < game.users.length; i++) {
						let user = game.users[i];
						if (user.id == data.userId) {
							console.log("This user already joined!!");
							return;
						}
					}

					//user.socketId = socket.id;
					game.users.push(user);
					game.total_players++;
					game.save(function(err, game) {
						if (err) return console.error(err);

						//console.log("JOINED GAME: ", game);
						var room = "game_" + game.id + "_user_" + data.userId;
						console.log("room", room);
						socket.join(room);
						returnPendingGames(io.sockets);

					});

				});
			});
		});

		socket.on('removePendingGame', function(data) {
			console.log('removePendingGame', data);

			if (!data.gameId || !data.userId) {
				console.log("Required fields not received!");
				return;
			}
			Game.findOne({
				id: data.gameId,
				status: "pending"
			}, function(err, game) {
				if (err) return console.error(err);
				if (!game) return console.error("Game to delete does not exist!");

				store.getUserById(data.userId).then((user) => {
					user = user[0];
					if (!user) return console.error("User with ID " + data.userId + "does not exist!");

					if(user.id != game.created_by_id){
						return console.error("User was not this game creator!");
					}
					game.remove(function(err, game) {
						if (err) return console.error(err);

						returnPendingGames(io.sockets);

					});

				});
			});
		});


		socket.on('startGame', function(data) {

			//console.log('startGame', data);
			if (!data.gameId || !data.userId) {
				console.log("Required fields not received!");
				return;
			}
			//procura o jogo pelo id
			Game.findOne({
				id: data.gameId,
				status: "pending"
			}, function(err, game) {
				if (err) return console.error(err);
				if (game.status != 'pending') return console.error("Game is not pending!");
				if (data.userId != game.created_by_id) return console.error("This user cannot start the game!");
				store.getUserById(data.userId).then((user) => {
					user = user[0];
					if (!user) return console.error("User with ID " + data.userId + "does not exist!");


					game.status = "active";

					//escolhe o primeiro a receber as cartas
					var firstPlayer = game.users[Math.floor(Math.random() * game.users.length)];


					console.log('FIRST PLAYER ID:')
					console.log(firstPlayer.id)

					//atribuir as equipas
					var teamId = 1;
					game.table = {};
					var cards = [];
					game.cardTrump = {}; //carta trunfo

					//coloca todas as cartas num array para depois as baralhar
					for (let a = 0; a < cardSuites.length; a++) {
						for (let i = 0; i < cardOptions.length; i++) {
							cards.push({
								cardSuite: cardSuites[a],
								cardValue: cardOptions[i]
							});
						}
					}
					//baralhar as cartas  
					cards = shuffle(cards);

					var firstPlayerTeamID = null;


					for (var i = 0; i < game.users.length; i++) {
						let user = game.users[i];
						game.users[i].teamId = teamId;

						if (teamId == 1) {
							teamId = 2;
						} else {
							teamId = 1;
						}
						//criar a mesa com os espaços (para cada jogador)
						game.table[user.id] = null;
						//faz um array de cartas para cada jogador (vai ser a mão do jogador)
						user.cards = [];

						/*
						//preencher o array de cartas de cada user com 10 cartas
						for (var j = 0; j < 10; j++) {
							user.cards.push(cards.pop()); //pop vai buscar o ultimo elemento/objecto do array cards
						}*/

						//o primeiro jogador, escolhido aleatoriamente, fica a sul
						if (user.id == firstPlayer.id) {
							user.orientation = "SOUTH";
							firstPlayerTeamID = user.teamId;

						}
						/*
						if (user.id == data.userId) {
							user.orientation = "SOUTH";
							ownerTeamId = user.teamId;
						} */

					}

					//escolher a orientaçao para os outros jogadores
					var isEastSet = false;
					for (var i = 0; i < game.users.length; i++) {
						let user = game.users[i];
						if (user.teamId == firstPlayerTeamID) {
							if (user.id != firstPlayer.id) {
								user.orientation = "NORTH";
							} else {
								continue;
							}
						} else {
							if (isEastSet) {
								user.orientation = "WEST";
								game.currentPlayerId = user.id;
							} else {
								user.orientation = "EAST";
								isEastSet = true;
							}
						}
					}

					//ordenar os users de acordo com a sua posição num array
					var distributionOrder = [];
					for (var i = 0; i < game.users.length; i++) {
						var user = game.users[i];
						if (user.orientation == "SOUTH") {
							distributionOrder[0] = user;
						} else if (user.orientation == "WEST") {
							distributionOrder[1] = user;
						} else if (user.orientation == "NORTH") {
							distributionOrder[2] = user;
						} else if (user.orientation == "EAST") {
							distributionOrder[3] = user;
						}
					}

					//console.log('DISTRIBUTION ORDER ARRAY DEPOIS DE PREENCHIDO:')
					//console.log(distributionOrder);
					//distribuir as cartas pelos users pela ordem pretendida (sentido horário)
					for (var i = 0; i < distributionOrder.length; i++) {
						var user = distributionOrder[i];

						for (var j = 0; j < 10; j++) {
							user.cards.push(cards.pop());
						}


						if (user.id == firstPlayer.id) {
							//definimos o trunfo para ir com o jogo
							game.cardTrump = {
								userId: user.id,
								trumpCard: user.cards.shift()
							};
							/*console.log('CARTA TRUNFO:')
							console.log(game.cardTrump)*/
						}
						/*	console.log('CARTAS ATRIBUIDAS AO USER:', user.id);
							console.log('CARTAS:' user.cards);*/
					}

					game.team1_cardpoints = 0;
					game.team2_cardpoints = 0;
					game.team1_cheating = false;
					game.team2_cheating = false;



					game.markModified('users');


					game.save(function(err, game) {
						if (err) return console.error(err);

						//COISAS PARA A AREA DE JOGO

						//for(let i = 0; game.users)
						//returnActiveGames(socket, data.userId);
						//devolver os active games para todos os users do jogo
						for (var i = 0; i < game.users.length; i++) {
							let user = game.users[i];

							returnActiveGamesToRoom("game_" + game.id + "_user_" + user.id, user.id);
						}


						//devolve os pending games para todos
						returnPendingGames(io.sockets);


					});



				});

			});
		});

		socket.on('getCards', function(data) {

			/*	console.log("DECKID RECEBIDO NO CANAL getCards:");
				console.log("DECKID RECEBIDO NO CANAL getCards:");
				console.log("DECKID RECEBIDO NO CANAL getCards:", data.deckId);
				console.log("owncards RECEBIDO NO CANAL getCards:");
				console.log("owncards RECEBIDO NO CANAL getCards:"); */
			console.log("owncards RECEBIDO NO CANAL getCards:", data.ownCards);
			if (!data.deckId || !data.ownCards || data.ownCards.length == 0) {
				console.log("Required fields not received!");
				return;
			}

			var deckId = data.deckId;
			var owncards = data.ownCards;



			//IR AO STORE buscar o caminho da carta pretendida
			store.getCardsPath(deckId, owncards).then((cards) => {
				//console.log("CARTAS RECEBIDAS DO STORE:", cards);

				//ir a pasta store buscar a imagem com esse caminho
				//app.use(express.static(cards[0].path));


				getHiddenFaceImage(deckId).then((hiddenFaceCard) => {



					getCardsImages(cards, deckId).then((cardsToSend) => {
						/*	console.log("cardsToSend")
							console.log("cardsToSend")
							console.log("cardsToSend")
							console.log("cardsToSend")
							console.log("cardsToSend")
							console.log("cardsToSend")
							console.log("cardsToSend")
							console.log("cardsToSend")*/
						cardsToSend.hiddenFaceImage = hiddenFaceCard.image.toString('base64');
						//console.log("cardsToSend", cardsToSend)
						socket.emit('cardImages', cardsToSend);



					});


				});

			});

		});

		socket.on('updateGame', function(data) {
			console.log("ENTROU NO CANAL updateGame!");
			console.log("dados recebidos:");
			console.log("clickedCard:", data.clickedCard);
			console.log("gameId:", data.gameId);
			console.log("userId:", data.userId);

			if (!data.clickedCard || !data.gameId || !data.userId) {
				console.log("Required fields not received!");
				return;
			}

			Game.find({
				id: data.gameId
			}, function(err, game) {
				if (err) return console.error(err);
				game = game[0];
				/*	console.log('GAME');
					console.log('GAME');
					console.log('GAME');
					console.log('GAME');*/
				//	console.log(game);
				if(!game) {
					console.error("This Game does not exist!");
					return;
				}

				console.log('currentPlayerId', game.currentPlayerId);
				if (game.currentPlayerId != data.userId) {
					console.error("It's not this user's turn to play!");
					return;
				}

				var user = null;
				for (var i = 0; i < game.users.length; i++) {
					user = game.users[i]
					if (user.id == data.userId) {
						break;
					}
				}

				if (!user) {
					console.error("User with id " + data.userId + " not in game!");
					return;
				}
				//veririfica se a socket tem a socketRoom, e se nao, junta-a à socket
				var socketRoom = "game_" + game.id + "_user_" + data.userId;
				if (!io.sockets.adapter.rooms[socketRoom] ||
					!io.sockets.adapter.rooms[socketRoom][socket.id]) {
					socket.join(socketRoom);
				}


				console.log("Current User: ", user);
				var cardCount = 0;
				for (var i = 0; i < game.users.length; i++) {
					var userTable = game.users[i];

					if (game.table[userTable.id]) {
						cardCount++;
					}
				}
				if (cardCount == 4) {
					console.error("Table is already full!");
					return;
				}

				//procurar o indice da carta no array de cartas do user
				var card = null;
				if (data.clickedCard.cardValue == game.cardTrump.trumpCard.cardValue &&
					data.clickedCard.cardSuite == game.cardTrump.trumpCard.cardSuite &&
					data.userId == game.cardTrump.userId &&
					!game.cardTrump.played) {
					card = data.clickedCard;

					console.log('card trump played')
					console.log('card trump played')
					console.log('card trump played')
					console.log('card trump played')
					console.log(card)
					game.cardTrump.played = true;
					//game.markModified('cardTrump');

				} else {
					var cardIndex = null;


					for (var i = 0; i < user.cards.length; i++) {
						console.log("user.cards[i]", user.cards[i]);

						if (user.cards[i].cardValue == data.clickedCard.cardValue &&
							user.cards[i].cardSuite == data.clickedCard.cardSuite) {
							cardIndex = i;
						}
					}

					if (cardIndex === null) {
						console.error("User does not have this card!");
						return;
					}
					//tirar a carta do array de cartas do user e guarda-la numa var
					card = user.cards.splice(cardIndex, 1)[0];
				}



				console.log('TABLE ')
				console.log('TABLE ')
				console.log('TABLE ')
				console.log(game.table)

				//verifica se já há cartas na mesa
				var hasCards = false;
				for (var i = 0; i < game.users.length; i++) {
					var userId = game.users[i].id

					if (game.table[userId]) {
						hasCards = true;
					}
				}
				//se não houver cartas na mesa, então a primeira carta é o naipe do jogo
				if (!hasCards) {
					game.suiteInGame = data.clickedCard.cardSuite;
				} else {
					console.log('Cartas na mesa. Ver se está a fazer batota...');
					if ((user.teamId == 1 && game.team1_cheating) ||
						(user.teamId == 2 && game.team2_cheating)) {
						//se ele jogar carta diferente do naipe da mesa
						console.log("A equipa já está a fazer batota! Passar à frente se fez batota...");
					} else {
						if (card.cardSuite != game.suiteInGame) {
							//procurar cartas do naipe da mesa na mao dele
							for (var i = 0; i < user.cards.length; i++) {
								var suiteCard = user.cards[i];
								if (suiteCard.cardSuite == game.suiteInGame) {
									//BATOTA
									console.log("Este sacana fez batota!");
									if (user.teamId == 1) {
										game.team1_cheating = true;
									} else {
										game.team2_cheating = true;
									}
									break;
								}

							}
						}
					}


					//se encontrou, batota
				}

				//Por carta na mesa
				card.cardImage = '';
				game.table[data.userId] = card;

				//buscar proxima orientaçao
				var orientations = ["SOUTH", "WEST", "NORTH", "EAST"];

				var oldUserOrientation = user.orientation;
				var oldOrientationIndex = orientations.indexOf(oldUserOrientation);

				var newOrientationIndex = oldOrientationIndex + 1;
				if (newOrientationIndex == orientations.length) {
					newOrientationIndex = 0;
				}
				var newOrientation = orientations[newOrientationIndex];

				//procurar o user que tem a mesma orientacao que a nova orientacao definida e po-lo como proximo a jogar
				for (var i = 0; i < game.users.length; i++) {
					user = game.users[i]
					if (user.orientation == newOrientation) {
						console.log("Next User: ", user);
						game.currentPlayerId = user.id;
						break;
					}
				}
				console.log("Game Updated!");



				game.markModified('users');
				game.markModified('table');
				game.markModified('suiteInGame');
				game.save(function(err, game) {
					if (err) return console.error(err);
					console.log("Game Updated and Saved!");
					console.log(game);

					for (var i = 0; i < game.users.length; i++) {
						let user = game.users[i];


						returnActiveGamesToRoom("game_" + game.id + "_user_" + user.id, user.id);
					}

				});



			});


		});

		socket.on('cleanTable', function(data) {
			console.log('ENTROU NO CANAL cleanTable!');
			console.log("dados recebidos:");
			console.log("gameId:", data.gameId);
			console.log('userId:', data.userId);

			if (!data.gameId || !data.userId) {
				console.log("Required fields not received!");
				return;
			}
			//veririfica se a socket tem a socketRoom, e se nao, junta-a à socket


			Game.find({
				id: data.gameId
			}, function(err, game) {


				//console.log('Game to clean');
				//console.log('Game to clean');
				//console.log(game);
				var game = game[0];
				var socketRoom = "game_" + game.id + "_user_" + data.userId;
				if (!io.sockets.adapter.rooms[socketRoom] ||
					!io.sockets.adapter.rooms[socketRoom][socket.id]) {
					socket.join(socketRoom);
				}

				var normalCards = [];
				var trumpCards = [];
				var suiteInGameCards = [];
				var allCards = [];
				console.log('trumpCards')
				console.log(trumpCards)
				var isTrump = false;
				var cardPoints = 0;
				for (var i = 0; i < game.users.length; i++) {
					var user = game.users[i];

					var cardFromTable = game.table[user.id];
					console.log('CARD FROM TABLE')
					console.log('CARD FROM TABLE')
					console.log('CARD FROM TABLE')
					console.log(cardFromTable);
					//verifica o naipe para saber se é trunfo
					//cardSuite: 'Spade', cardValue: 'King', cardImage: ''

					if (cardFromTable.cardSuite == game.cardTrump.trumpCard.cardSuite) {
						isTrump = true;
					} else {
						isTrump = false;
					}

					switch (cardFromTable.cardValue) {

						case 'Ace':
							cardPoints = 11;
							break;
						case '7':
							cardPoints = 10;
							break;
						case 'King':
							cardPoints = 4;
							break;
						case 'Jack':
							cardPoints = 3;
							break;
						case 'Queen':
							cardPoints = 2;
							break;
						default:
							cardPoints = 0;

					}

					if (isTrump) {
						trumpCards.push({
							userId: user.id,
							userTeam: user.teamId,
							suite: cardFromTable.cardSuite,
							value: cardFromTable.cardValue,
							cardPoints: cardPoints,
							isTrump: isTrump
						});
						/*trumpCards[i] = {userId: user.id, 
									userTeam: user.teamId, 
									suite: cardFromTable.cardSuite, 
									value: cardFromTable.cardValue,
									cardPoints: cardPoints,
									isTrump: isTrump}; */
					} else if (cardFromTable.cardSuite == game.suiteInGame) {
						suiteInGameCards.push({
							userId: user.id,
							userTeam: user.teamId,
							suite: cardFromTable.cardSuite,
							value: cardFromTable.cardValue,
							cardPoints: cardPoints,
							isTrump: isTrump
						});
						/*	suiteInGameCards[i] = {userId: user.id, 
										userTeam: user.teamId, 
										suite: cardFromTable.cardSuite, 
										value: cardFromTable.cardValue,
										cardPoints: cardPoints,
										isTrump: isTrump}; */
					} else {
						normalCards.push({
							userId: user.id,
							userTeam: user.teamId,
							suite: cardFromTable.cardSuite,
							value: cardFromTable.cardValue,
							cardPoints: cardPoints,
							isTrump: isTrump
						});
					}
					allCards.push({
						userId: user.id,
						userTeam: user.teamId,
						suite: cardFromTable.cardSuite,
						value: cardFromTable.cardValue,
						cardPoints: cardPoints,
						isTrump: isTrump
					});

					/*• Ás: 11 pontos;
				• 7: 10 pontos;
				• rei: 4 pontos;
				• valete: 3 pontos;
				• rainha: 2 pontos;
				• 6, 5, 4, 3, 2: 0 pontos */
				}

				console.log('TRUMP CARDS FROM TABLE')
				console.log(trumpCards);
				console.log('suiteInGameCards CARDS FROM TABLE')
				console.log(suiteInGameCards);

				//array com todos os valores possiveis
				var arrayOfValues = ['2', '3', '4', '5', '6', 'Queen', 'Jack', 'King', '7', 'Ace'];
				//var 
				var higherCard = null;
				var cardValueIndex = null;
				var higherCardValueIndex = null;

				if (trumpCards.length) {
					console.log('EXISTEM CARTAS TRUNFO')
					for (var i = 0; i < trumpCards.length; i++) {
						var card = trumpCards[i];

						if (!higherCard) {
							higherCard = card;
							//console.log('HIGHER CARD: ', [i], ':', higherCard);
						} else {
							cardValueIndex = arrayOfValues.indexOf(card.value);
							console.log('card.value', card.value);
							console.log('cardValueIndex', cardValueIndex);
							higherCardValueIndex = arrayOfValues.indexOf(higherCard.value);
							console.log('higherCard.value', higherCard.value);
							console.log('higherCardValueIndex', higherCardValueIndex);

							if (cardValueIndex > higherCardValueIndex) {
								higherCard = card;
							}
						}
						console.log('HIGHER CARD: ', [i], ':', higherCard);
					}
				} else {
					console.log('NÃO EXISTEM CARTAS TRUNFO')
					for (var i = 0; i < suiteInGameCards.length; i++) {
						var card = suiteInGameCards[i];

						if (!higherCard) {
							higherCard = card;
						} else {
							cardValueIndex = arrayOfValues.indexOf(card.value);
							console.log('card.value', card.value);
							console.log('cardValueIndex', cardValueIndex);
							higherCardValueIndex = arrayOfValues.indexOf(higherCard.value);
							console.log('higherCard.value', higherCard.value);
							console.log('higherCardValueIndex', higherCardValueIndex);

							if (cardValueIndex > higherCardValueIndex) {
								higherCard = card;
							}
						}
					}
				}
				console.log('higherCard')
				console.log('higherCard')
				console.log('higherCard')
				console.log('higherCard')
				console.log(higherCard)

				game.currentPlayerId = higherCard.userId;



				var roundPoints = 0;
				for (var i = 0; i < allCards.length; i++) {
					roundPoints += allCards[i].cardPoints;
				}
				console.log('ROUND POINTS')
				console.log(roundPoints)
				//atribuir os pontos aos user e ao seu teammate
				if (higherCard.userTeam == 1) {
					game.team1_cardpoints += roundPoints;

				} else {
					game.team2_cardpoints += roundPoints;

				}

				/*
								for (var i = 0; i < game.users.length; i++) {
									var user = game.users[i];
									if(user.teamId == higherCard.userTeam){
										var teamId = higherCard.userTeam;
										//actualizar os pontos das cartas da equipa que ganhou esta rodada
										if(teamId == 1){
											game.team1_cardpoints += roundPoints;
											game.markModified('game.team1_cardpoints');
										} else {
											game.team2_cardpoints += roundPoints;
											game.markModified('game.team2_cardpoints');
										}
										
									}

								}*/
				console.log('TEAM 1 CARD POINTS')
				console.log(game.team1_cardpoints)
				console.log('TEAM 2 CARD POINTS')
				console.log(game.team2_cardpoints)

				//limpar a mesa

				for (var i = 0; i < game.users.length; i++) {
					var user = game.users[i];

					game.table[user.id] = null;
				}

				var gameOver = true;

				if (!game.cardTrump.played) {
					gameOver = false;
				} else {
					//verrificar se os jogadores ainda têm cartas
					for (var i = 0; i < game.users.length; i++) {
						var userCards = game.users[i].cards;

						if (userCards.length > 0) {
							gameOver = false;
						}
					}
				}


				if (gameOver) {
					game.status = 'terminated';

					var teamWinner = game.team1_cardpoints > game.team2_cardpoints ? 1 :
						game.team2_cardpoints > game.team1_cardpoints ? 2 :
						0;
						console.log('TEAM WINNER')
						console.log(teamWinner)
					/*1 ponto cada, se o total da pontuação (das cartas) da equipa >=61 e <=90;
o 2 pontos cada, se o total da pontuação (das cartas) da equipa >= 91 e <=119;
o 4 ponto cada, se o total da pontuação (das cartas) da equipa = 120;
• Em caso de empate ou derrota (sem renuncia) os jogadores recebem 0 pontos;
• Em caso de derrota devido a uma renuncia confirmada, são descontados 4 pontos aos
jogadores da equipa que fez a renuncia e são atribuídos 4 pontos aos jogadores da equipa
vencedora (que declarou desconfiança);
• Em caso de derrota devido a uma desconfiança não confirmada, são descontados 4 pontos
aos jogadores da equipa que declarou desconfiança (não confirmada) e são atribuídos 4
pontos aos jogadores da equipa vencedora. */

					/*var teamWinnerPoints = 0;
					var teamWinnerCardPoints = teamWinner == 1 ? game.team1_cardpoints :
						teamWinner == 2 ? game.team2_cardpoints : 60;

						if (61 = < teamWinnerCardPoints <= 90) {
							teamWinnerPoints = 1;
						} else if (91 = < teamWinnerCardPoints <= 119) {
							teamWinnerPoints = 2;
						} else if (teamWinnerCardPoints == 120) {
							teamWinnerPoints = 4;
						} else if (teamWinnerCardPoints == 60) {
							teamWinnerPoints = 0;
							
						} */
					

					var team1Points = 0;
					var team2Points = 0;

					if(teamWinner == 1){ 
						console.log('A EQUPA 1 GANHOU')
						console.log('game.team1_cardpoints')
						console.log(game.team1_cardpoints)
							//atribuir pontos finais
						if (game.team1_cardpoints >= 61 &&
						 game.team1_cardpoints <= 90) {
							console.log('61 <= game.team1_cardpoints <= 90')
							team1Points = 1;
						} else if (game.team1_cardpoints >= 91 &&
						 game.team1_cardpoints <= 119) {
							console.log('91 <= game.team1_cardpoints <= 119')
							team1Points = 2;
						} else if (game.team1_cardpoints == 120) {
							console.log('game.team1_cardpoints == 120')
							team1Points = 4;
						}

					} else if(teamWinner == 2){ 
						console.log('A EQUIPA 2 GANHOU')
						console.log('game.team2_cardpoints')
						console.log(game.team2_cardpoints)
						if (61 <= game.team2_cardpoints <= 90) {
							console.log('61 <= game.team2_cardpoints <= 90')
							team2Points = 1;
						} else if (91 <= game.team2_cardpoints <= 119) {
							console.log('91 <= game.team2_cardpoints <= 119')
							team2Points = 2;
						} else if (game.team2_cardpoints == 120) {
							console.log('game.team2_cardpoints == 120')
							team2Points = 4;
						}
					}  else if (teamWinner == 0) {
							console.log('As Equipas empataram!');
							team1Points = 0;
							team2Points = 0;
						}

					createFinishedGame(team1Points, team2Points, game, teamWinner,
									0, 0);



				}


				game.markModified('table');
				game.save(function(err, game) {
					if (err) return console.error(err);
					console.log("Game Updated and Saved!");
					console.log(game);

					for (var i = 0; i < game.users.length; i++) {
						let user = game.users[i];
						returnActiveGamesToRoom("game_" + game.id + "_user_" + user.id, user.id);
					}

				});

			});



		});

		socket.on('suspect', function(data) {
				console.log('ENTROU NO CANAL suspect!');
				console.log("dados recebidos:");
				console.log("gameId:", data.gameId);
				console.log('userId:', data.userId);

				if (!data.gameId || !data.userId) {
					console.log("Required fields not received!");
					return;
				}
				//veririfica se a socket tem a socketRoom, e se nao, junta-a à socket


				Game.find({
					id: data.gameId
				}, function(err, game) {
					var game = game[0];
					var socketRoom = "game_" + game.id + "_user_" + data.userId;
					if (!io.sockets.adapter.rooms[socketRoom] ||
						!io.sockets.adapter.rooms[socketRoom][socket.id]) {
						socket.join(socketRoom);
					}
					var user = null;
					for (var i = 0; i < game.users.length; i++) {
						user = game.users[i]
						if (user.id == data.userId) {
							break;
						}
					}

					if (!user) {
						console.error("User with id " + data.userId + " not in game!");
						return;
					}
					var otherTeamCheated = null;
					var userTeamId = user.teamId;
					var otherTeamId = user.teamId == 1 ? 2 : 1;


					if(userTeamId == 1) {
						otherTeamCheated = game.team2_cheating;
					}else{
						otherTeamCheated = game.team1_cheating;
					}

					var teamWinner = 0;
					var team_renunciou = 0;
					if(otherTeamCheated){
						console.log("Other Team Has Cheated!");
						if(userTeamId == 1){
							team1Points = 4;
							team2Points = -4;
							teamWinner = 1;
							team_renunciou = 2;
						}else {
							team1Points = -4;
							team2Points = 4;
							teamWinner = 2;
							team_renunciou = 1;
						}
					} else {
						console.log("Other Team Has Not Cheated!");
						if(userTeamId == 1){
							team1Points = -4;
							team2Points = 4;
							teamWinner = 2;
						}else {
							team1Points = 4;
							team2Points = -4;
							teamWinner = 1;
						}
						
					}
					game.status = 'terminated';


					createFinishedGame(team1Points, team2Points, game, teamWinner,
						userTeamId, team_renunciou);

					game.save(function(err, game) {
						if (err) return console.error(err);
						console.log("Game Updated and Saved!");
						console.log(game);

						for (var i = 0; i < game.users.length; i++) {
							let user = game.users[i];
							returnActiveGamesToRoom("game_" + game.id + "_user_" + user.id, user.id);
						}

					});







			});

		});



		//ADICIONAR METODOS ANTES DISTO
	});




}