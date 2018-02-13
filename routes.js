module.exports = function(app, transporter, store, passport, fs, platformEmail) {


  function errorFunction(err, req, res, next) {
    //Entra para aqui se for erro
    const status = !err.code ? 500 : err.code;
    const message = !err.message ? err : err.message;

    console.error(message);

    res.status(status).send(message);
  }

  const crypto = require('crypto');

  var bcrypt = require("bcrypt");

  const sha1 = require('sha1');

  //Rota para criar um utilizador
  app.post('/api/users/create', (req, res) => {
    //console.log(req); 

    //http://46.101.25.53:8080/email-confirmation/1/bg45ehge54h5435w4356h34w5hy6754jy754j67
    //http://localhost:7555/email-confirmation/1/bg45ehge54h5435w4356h34w5hy6754jy754j67

    crypto.randomBytes(48, function(err, buffer) {
      var confirmation_token = buffer.toString('hex');

      store
        .createUser({
          name: req.body.name,
          email: req.body.email,
          nickname: req.body.nickname,
          password: req.body.password,
          confirmation_token: confirmation_token
        })
        .then((ids) => {
          console.log(ids);
          var id = ids[0];

          //adicionar ao email um link com o porto + id + hash
          var mailOptions = {
            from: platformEmail,
            to: req.body.email,
            subject: '"Sueca" Account Creation',
            text: 'Please, click the link to confirm your subscription.\n' +
            'http://46.101.25.53:8080/email-confirmation/' + id + '/' + confirmation_token,
            //'http://localhost:7555/email-confirmation/' + id + '/' + confirmation_token,
            html: '<p>Please, click the link to confirm your subscription.</p>' +
            '<p><a href="http://46.101.25.53:8080/email-confirmation/' + id + '/' + confirmation_token + '">email confirmation link</a></p>'
            //'<p><a href="http://localhost:7555/email-confirmation/' + id + '/' + confirmation_token + '">email confirmation link</a></p>'

          }

          transporter.sendMail(mailOptions, function(err, info) {
            if (err)
              console.log(err)
            else
              console.log(info);
          });

          res.sendStatus(200)
        })
        .catch((err) => {
          error = {
            code:
             err.code,
            message: err.sqlMessage
          };

          if (!error.message) {
            error.message = 'Unexpected Error!';
            error.message = err;
          }
          console.log(error);

          res.status(500).send(error);
        });

    });

  });

  app.get('/email-confirmation/:id/:confirmation_token', function(req, res, next) {
    store.getUserById(req.params.id).then((users) => {
      user = users[0];
      console.log(user);
      if (!user) {
        res.status(400).send("Wrong User Id!");
        return;
      }

      if (req.params.confirmation_token == user.confirmation_token) {
        store.activateUser(req.params.id).then(() => {
          res.redirect('http://165.227.238.36:8080');
          //res.redirect('http://localhost:8080');
          return;
        });
      } else {
        res.status(400).send("Wrong Confirmation Token!");
      }

    });
  });

  //Password reset
  app.post('/password/reset', (req, res) => {

    console.log('API PASSWORD RESETS WITH REQUEST');
    console.log(req.body.email);

    crypto.randomBytes(48, function(err, buffer) {
      var reset_password_token = buffer.toString('hex');

      store.savePasswordResetDetails({
          email: req.body.email,
          token: reset_password_token
        })
        .then((data) => {

          console.log('Email and token saved:');
          console.log(data);

          var mailOptions = {
            from: platformEmail,
            to: req.body.email,
            subject: 'Sueca Password Reset',
            text: 'Please, click the link to reset your password.\n' +
             //'http://localhost:7555/password-reset/' + reset_password_token,
             'http://46.101.25.53:8080/password-reset/' + reset_password_token,
            html: '<p>Please, click the link to reset your password.</p>' +
             //'<p><a href="http://localhost:7555/password-reset/' + reset_password_token + '">password reset link</a></p>'
             '<p><a href="http://46.101.25.53:8080/password-reset/' + reset_password_token + '">password reset link</a></p>'

          }

          transporter.sendMail(mailOptions, function(err, info) {
            if (err)
              console.log(err)
            else
              console.log(info);
          });

          res.sendStatus(200)
        })
        .catch((err) => {
          error = {
            code: err.code,
            message: err.sqlMessage
          };

          if (!error.message) {
            error.message = 'Unexpected Error!';
            error.message = err;
          }
          console.log(error);

          res.status(500).send(error);
        });

    });

  });

  app.get('/password-reset/:reset_password_token', function(req, res, next) {

    console.log('API PASSWORD RESET - redirect to client');
    console.log(req.params.reset_password_token);

    res.redirect('http://165.227.238.36:8080/#/passwordReset/' + req.params.reset_password_token);
    //res.redirect('http://localhost:8080/#/passwordReset/'+req.params.reset_password_token);

    /*
        console.log('API PASSWORD RESET - get email from table');
        console.log(req.params.reset_password_token);
        store.getEmailByTokenFromPasswordResets(req.params.reset_password_token).then((emails) => {
          email = emails[0];
          console.log(emails);
          if(!emails){
            res.status(400).send("Wrong User Id!");
            return;
          }



          if(req.params.reset_password_token == email.email){
             // res.redirect('http://165.227.238.36:8080');

            store.activateUser(req.params.id).then(() => {
              res.redirect('http://165.227.238.36:8080');
              return;
            });
          
          }else{
            res.status(400).send("Wrong Confirmation Token!");
          }

        });
        */
  });


  app.post('/changePassword', function(req, res, next) {

    console.log('API PASSWORD RESET - change password');
    console.log(req.body.password);
    console.log(req.body.token);

    if (!req.body.password || !req.body.token) {
      res.status(400).send("Required Parameters not received!");
      return;
    }

    store.getEmailByTokenFromPasswordResets(req.body.token).then((emails) => {
      var email = emails[0];
      console.log(emails);
      if (!email) {
        res.status(400).send("Email for token not found!");
        return;
      }

      store.getUserByEmail(email.email).then((users) => {
        var user = users[0];

        if (!user) {
          res.status(500).send("User for given email not found!");
          return;
        }

        store.changeUserPassword(user.id, req.body.password).then(() => {

          store.removeResetToken(email.email).then(() => {
            res.send({
              response: "Password Changed!"
            });
            return;
          });

        });

      });

    });
  });


  //Esta Rota é apenas para testar!
  app.get('/', function(req, res, next) {
    res.send('Servidor Backend do Projecto Dad-2018. Rota para teste.');
  });

  //Rota para login
  app.post('/login', function(req, res, next) {
    passport.authenticate('local', function(err, user, info) {
      if (err) {
        return next(err)
      }
      if (!user) {
        return res.status(401).json({
          message: info.message
        })
      }
      res.json(user);
    })(req, res, function(req, res, ) {
      res.send(req.user);
    });
  });

  //Rota para logout
  app.post('/logout', function(req, res) {
    store.getUserByToken(req.body.token).then((user) => {
      user = user[0]; //Aqui vem uma lista de users
      if (!user) {
        return res.status(500).send({
          message: "User not Found!"
        });
      }

      store.updateUserToken(user.id, null).then(() => {
        res.send("OK!");
      });
    });
  });

  //Devolve todos os users
  app.get('/api/users', passport.authenticate('bearer'), passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      store.getUsers().then((users) => {
        //Depois de executar o getUsers, apenas os envia como resposta
        res.send(users);
      });
    },
    function(err, req, res, next) {
      //Entra para aqui se for erro
      const status = !err.code ? 500 : err.code;
      const message = !err.message ? err : err.message;

      res.status(status).send(message);
    });

  //Devolve um user através do seu token
  app.get('/api/user/:token', passport.authenticate('bearer'), function(req, res, next) {
    store.getUserByToken(req.params.token).then((users) => {
      user = users[0];
      console.log(user);
      user.password = null;
      res.send(user);
    });
  });

  //Rota para ir buscar as configuracoes da plataforma
  app.get('/api/admin/config/details', passport.authenticate('bearer'), passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      store.getConfigDetails().then((configs) => {
        config = configs[0];
        res.send(config);

      });
    }, errorFunction);

  //Rota para editar o user
  app.put('/api/users/:id', passport.authenticate('bearer'), (req, res) => {

    console.log(req);
    var user = {
      id: req.params.id,
      name: req.body.name,
      email: req.body.email,
      nickname: req.body.nickname
    };

    store.editUser(user).then(() => res.sendStatus(200));

  });

  //Editar a password do user
  app.put('/api/users/password/:id', passport.authenticate('bearer'), (req, res) => {

    console.log(req);
    store.
    editUserPassword(req.params.id, req.body.password).then(() => res.sendStatus(200));

  });

  //Rota para alterar a password do adminstrador
  app.put('/api/admin/password/:id', passport.authenticate('bearer'), passport.authenticate('admin', {
    failWithError: true
  }), (req, res) => {

    console.log(req.body.oldPassword, req.body.newPassword);

    store.
    editAdminPassword(req.params.id, req.body.oldPassword, req.body.newPassword).then(() => res.sendStatus(200));

  }, errorFunction);

  //Rota para o administrador alterar dados de administração
  app.put('/api/admin/:id', passport.authenticate('bearer'), passport.authenticate('admin', {
    failWithError: true
  }), (req, res) => {

    //console.log(req.params.id);
    var user = {
      id: req.params.id,
      email: req.body.email,
      nickname: req.body.nickname
    };

    store.
    editAdmin(user).then(() => res.sendStatus(200))
  }, errorFunction);

  //Rota para apagar o user (o próprio)
  app.delete('/api/users/:id', passport.authenticate('bearer'), (req, res) => {
    console.log(req);

    store.getUserByToken(req.token).then((users) => {
      users = user[0];
      var email = user.email;

      if (user.id != req.params.id) {
        return res.status(401).send("You are not allowed to delete another user!");
      } else {
        store.deleteUser(req.params.id).then(() => {
            var mailOptions = {
            from: platformEmail,
            to: email,
            subject: 'Sueca Account Deletion',
            text: 'Your account as been excluded from Sueca game.\n' 

          }

          transporter.sendMail(mailOptions, function(err, info) {
            if (err)
              console.log(err)
            else
              console.log(info);
          });

          res.sendStatus(200);
        });
      }
    });

  });

  //Rota para apagar o user
  app.delete('/api/admin/users/:id', passport.authenticate('bearer'),
    passport.authenticate('admin', {
      failWithError: true
    }), (req, res) => {
      console.log(req.params.id);
      console.log(req.body.token);

      store.getUserById(req.params.id).then((user) => {
        user = user[0];

        if (user.admin) {
          res.status(400).send("Can't delete Admin!");
          return;
        }

        store.
        deleteUser(req.params.id).then(() => {

          var mailOptions = {
            from: platformEmail,
            to: user.email,
            subject: 'Sueca Account Deleted',
            text: 'Your account has been deleted. You have been permanently excluded from Sueca.'
          }


          transporter.sendMail(mailOptions, function(err, info) {
            if (err)
              console.log(err)
            else
              console.log(info);
          });

        });
        res.sendStatus(200);

      });

    }, errorFunction);

  //Rota para o admin bloquear o user
  app.put('/api/admin/users/block/:id', passport.authenticate('bearer'), passport.authenticate('admin', {
    failWithError: true
  }), (req, res) => {
    console.log(req.params.id, req.body.reason_blocked);
    store.getUserById(req.params.id).then((user) => {
      user = user[0];

      if (user.admin) {
        res.status(400).send("Can't block Admin!");
        return;
      }

      store.blockUser(req.params.id, req.body.reason_blocked).then(() => {

        var mailOptions = {
          from: platformEmail,
          to: user.email,
          subject: 'Sueca Account Blocked',
          text: 'Your account has been blocked. Reason:' + user.reason_blocked
        }


        transporter.sendMail(mailOptions, function(err, info) {
          if (err)
            console.log(err)
          else
            console.log(info);
        });

      });
      res.sendStatus(200);
    });
  }, errorFunction);

  //Rota para o admin desbloquear o user
  app.put('/api/admin/users/unblock/:id', passport.authenticate('bearer'),
    passport.authenticate('admin', {
      failWithError: true
    }), (req, res) => {
      console.log(req.params.id, req.body.reason_reactivated);
      store.
      unblockUser(req.params.id, req.body.reason_reactivated).then(() => {
        store.getUserById(req.params.id).then((user) => {
          user = user[0];

          var mailOptions = {
            from: platformEmail,
            to: user.email,
            subject: 'Sueca Account unblocked',
            text: 'Your account has been unblocked. You can now login on Sueca game. Reason:' + user.reason_reactivated
          }


          transporter.sendMail(mailOptions, function(err, info) {
            if (err)
              console.log(err)
            else
              console.log(info);
          });

        });
        res.sendStatus(200)

      });
    }, errorFunction);

  /***********************************************STATISTICS***************************************************************/

  //Rota para devolver o total de jogadores na plataforma
  app.get('/api/statistics/numberOfPlayers', function(req, res, next) {

    store.getTotalNumberOfPlayers().then((totals) => {

      total = totals[0];
      res.send(total);

    });

  });

  //Rota para devolver o total de jogos jogados
  app.get('/api/statistics/totalGamesPlayed', function(req, res, next) {

    console.log("ENTROU NA API totalGamesPlayed");

    store.getTotalGamesPlayed().then((totals) => {
      total = totals[0];
      console.log('Total de jogos jogados recebido do store:')
      console.log(total)
      res.send(total);

    });
  });

  //Rota para devolver os cinco jogadores com mais jogos jogados
  app.get('/api/statistics/topFiveByNumOfGames', function(req, res, next) {
    store.getTopFiveByNumOfGames().then((users) => {
      res.send(users);
    })
  });

  //Devolve o top cinco jogadores com mais pontos
  app.get('/api/statistics/topFiveByPoints', function(req, res, next) {
    store.getTopFiveByPoints().then((users) => {
      res.send(users);
    })
  });

  //Devolve o top cinco jogadores com melhor media
  app.get('/api/statistics/topFiveByAverage', function(req, res, next) {
    store.getTopFiveByAverage().then((users) => {
      console.log("topFiveByAverage");
      console.log("topFiveByAverage");
      console.log(users[0]);
      res.send(users[0]);
    })
  });

  //Devolve o numero de vitorias de um user
  app.get('/api/statistics/users/:id/totalWins', passport.authenticate('bearer'), function(req, res, next) {

    store.getUserTotalWins(req.params.id).then((totals) => {
      total = totals[0][0];
      console.log("totalWins");
      console.log(total)
      res.send(total);
    })

  });

  //Devolve o numero de derrotas de um user
  app.get('/api/statistics/users/:id/totalLosses', passport.authenticate('bearer'), function(req, res, next) {

    store.getUserTotalLosts(req.params.id).then((totals) => {
      console.log('ENTROU NA API TOTAL LOSTS');
      total = totals[0][0];
      console.log("totalLosts")
      console.log(total)
      res.send(total);
    })

  });

  //Devolve o numero de EMPATES de um user
  app.get('/api/statistics/users/:id/totalDraws', passport.authenticate('bearer'), function(req, res, next) {

    store.getUserTotalDraws(req.params.id).then((totals) => {

      console.log('ENTROU NA API TOTAL daws');
      total = totals[0][0];
      console.log(total);
      res.send(total);
    })

  });

  //Devolve o numero de PONTOS de um user
  app.get('/api/statistics/users/:id/totalPoints', passport.authenticate('bearer'), function(req, res, next) {

    store.getUserTotalPoints(req.params.id).then((totals) => {

      console.log('ENTROU NA API TOTAL POINTS');
      total = totals[0][0];
      console.log(total);
      res.send(total);
    })

  });

  //Devolve a media de PONTOS de um user
  app.get('/api/statistics/users/:id/pointAverage', passport.authenticate('bearer'), function(req, res, next) {

    store.getUserPointAverage(req.params.id).then((totals) => {

      console.log('ENTROU NA API POINT AVERAGE');
      total = totals[0][0];
      console.log(total);
      res.send(total);
    })

  });

  //Devolve as estatisticas de todos os jogadores(apenas para o administrador)
  app.get('/api/statistics/admin/usersStats', passport.authenticate('bearer'),
    passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      store.getUsers().then((users) => {
        var promises = [];

        for (var i = 0; i < users.length; i++) {
          var user = users[i];
          var userPromises = []
          userPromises.push(store.getUserById(user.id));
          userPromises.push(store.getUserTotalWins(user.id));
          userPromises.push(store.getUserTotalDraws(user.id));
          userPromises.push(store.getUserTotalLosts(user.id));

          var promise = Promise.all(userPromises).then(data => {
            var userToSend = {}

            for (var j = 0; j < data.length; j++) {
              var field = data[j][0];
              //console.log(field);


              if (field.id) {
                userToSend.id = field.id;
                userToSend.nickname = field.nickname;
                userToSend.totalGamesPlayed = field.total_games_played;
              } else {
                field = field[0];
                //console.log(field);

                if (field.totalWins !== undefined) {
                  userToSend.totalWins = field.totalWins;
                } else if (field.totalLosts !== undefined) {
                  userToSend.totalLosts = field.totalLosts;
                } else if (field.totalDraws !== undefined) {
                  userToSend.totalDraws = field.totalDraws;
                }
              }
            }
            //console.log("userToSend");
            //console.log(userToSend);        
            return Promise.resolve(userToSend);


          });
          promises.push(promise);


        }

        Promise.all(promises).then((usersToSend) => {
          console.log("USERS");
          console.log("USERS");
          console.log(usersToSend);
          res.send(usersToSend);
        });

      });

    }, errorFunction);

  //Devolve o histórico da quantidade de jogos jogados por dia
  app.get('/api/statistics/admin/gamesHistoryData', passport.authenticate('bearer'),
    passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      store.getGamesHistoryData().then((data) => {
        console.log("gamesHistoryData");
        console.log(data);
        res.send(data);
      })


    }, errorFunction);



  /*************************************UPLOAD E DOWNLOAD**************************************************/

  //faz upload de uma imagem e guarda o seu caminho na bd
  app.post('/upload', passport.authenticate('bearer'), function(req, res) {

    console.log('API UPLOAD');
    console.log(req.files);

    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }

    let fileReceived = req.files.file;
    let deckName = req.body.deckname;

    // console.log('NOME DO deckname no servidor');

    console.log('A mover ficheiro para: ./store/' + fileReceived.name);
    let pathFile = './store/' + fileReceived.name;

    fileReceived.mv(pathFile, function(err) {

      if (err) {
        return res.status(500).send(err);
      }

      //fazer o store do caminho do ficheiro na bd
      store.insertPathFile(pathFile, deckName).then((decks) => {

        //console.log('Caminho do ficehiro armazenado com sucesso:');
        //console.log('ID: ');
        console.log('ID do deck criado: ');
        console.log('ID: ');
        console.log('ID: ');
        console.log(decks[0]);
        res.send({
          deckId: decks[0]
        });

      });

    });
  });

  //Faz upload de várias imagens
  app.post('/upload/multiple/cards', passport.authenticate('bearer'), function(req, res) {

    console.log('API UPLOAD MULTIPLE FILES');
    // console.log(req);

    if (!req.files) {
      return res.status(400).send('No files were uploaded.');
    }

    let filesReceived = req.files;
    let filesCount = Object.keys(filesReceived).length;
    let filePaths = [];

    //  console.log(' FILES 1');
    // console.log(' FILES 1 name');
    // console.log(filesReceived.files[1].name);
    let requests = [];

    for (var i = 0; i < 40; i++) { //filesReceived é um objecto e a chave d cd posicao é uma string, por isso tenho que fazer a concatenaçao com o i

      let file = filesReceived['files[' + i + ']'];

      if (file) {
        let filename = file.name;
        console.log(filename);

        filePaths[i] = './store/' + filename;


      } else {
        filePaths[i] = false;
      }
    }

    store.getCardsByPath(filePaths).then((cards) => {
      if (cards.length) {
        var message = 'There already are images with those names!';

        for (var i = 0; i < cards.length; i++) {
          message += ' Name: ' + cards[i].path + ',';
        }
        res.status(400).send(message);
        return;
      }

      for (var i = 0; i < 40; i++) {

        if (filePaths[i]) {
          var file = filesReceived['files[' + i + ']'];
          requests.push(file.mv(filePaths[i], function(err) {
            if (err) {
              return res.status(500).send(err);
            }
          }));
        }

      }

      console.log(req.body.deckId);
      let deckId = req.body.deckId;

      Promise.all(requests).then(function() {
        store.createCards(filePaths, deckId).then(() => {

          store.getDeckCards(deckId).then((cards) => {

            var isDeckCompleted = cards.length == 40;

            store.setCompleteDeck(deckId, isDeckCompleted).then(() => {
              res.send('Files stored!');
            });
          });


          res.send('Files stored!');
        });
      });

    });
  });


  ////*********************************************DECKS********************************************************//

  //Devolve todos os baralhos
  app.get('/api/decks', passport.authenticate('bearer'), passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      store.getDecks().then((decks) => {
        console.log('RESPOSTA NO servidr')
        console.log(decks);

        for (var i = 0; i < decks.length; i++) {
          decks[i].created_at = decks[i].created_at.toISOString().
          replace(/T/, ' ').replace(/\..+/, '');
          decks[i].updated_at = decks[i].updated_at.toISOString().
          replace(/T/, ' ').replace(/\..+/, '');
        }

        res.send(decks);
      });
    }, errorFunction);

  //Devolve um baralho
  app.delete('/api/decks/:id', passport.authenticate('bearer'), passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      console.log(req.params.id);

      store.getDeck(req.params.id).then((decks) => {
        var deck = decks[0];
        if (!deck) {
          res.status(400).send("Deck Not Found!");
          return;
        }
        if (deck.active) {
          res.status(400).send("Deck is currently being used!");
          return;
        }
        store.getDeckCards(req.params.id).then((cards) => {
          console.log("Deck Cards to delete:");
          console.log(cards);

          var promises = [];

          for (var i = 0; i < cards.length; i++) {
            var card = cards[i]

            var promise = fs.unlink(card.path, (err) => {
              if (err) throw err;
              console.log('successfully deleted ' + card.path);
            });
            promises.push(promise);
          }

          Promise.all(promises).then(() => {
            store.removeCardsByDeckId(req.params.id).then(() => {
              console.log("Deleted Deck Cards!");

              store.removeDeck(req.params.id).then(() => {
                console.log("Deleted Deck!");
                res.sendStatus(200);
              })
            });

          })

        });


      })



    }, errorFunction);

  //api/get/card/paths
  app.get('/api/get/card/paths', passport.authenticate('bearer'), passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      console.log(req.body.deck.id);

    }, errorFunction);


  app.get('/api/decks/:deckId/cards/images/', passport.authenticate('bearer'), passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      console.log(req.params.deckId);


      store.getDeckCards(req.params.deckId).then((cards) => {


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

        Promise.all(promises).then(function(results) {
          var cardsToSend = {
            deckId: req.params.deckId,
            cards: []
          };

          for (var i = 0; i < results.length; i++) {
            cardsToSend.cards.push(results[i]);
          }

          res.send(cardsToSend);
          return;
        });


      });

    }, errorFunction);


};