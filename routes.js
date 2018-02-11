module.exports = function(app, transporter, store, passport) {


  function errorFunction(err, req, res, next) {
    //Entra para aqui se for erro
    const status = !err.code ? 500 : err.code;
    const message = !err.message ? err : err.message;

    res.status(status).send(message);
  }



  //Rota para criar um utilizador
  app.post('/api/users/create', (req, res) => {
    console.log(req); //Request, o que veio
    store
      .createUser({
        //req.body => onde estão os dados
        name: req.body.name,
        email: req.body.email,
        nickname: req.body.nickname,
        password: req.body.password
      })
      .then(() => {

        var mailOptions = {
          from: 'blackjack.projectdad@gmail.com',
          to: req.body.email,
          subject: 'Blackjack Account Creation',
          text: 'Please, click the link to confirm your subscription.',
          html: '<p>Please, click the link to confirm your subscription.</p>'
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
  })

  //Esta Rota é apenas para testar!
  app.get('/', function(req, res, next) {
    //no chrome ou postman, escrever http://localhost:7555
    res.send('Rota Teste');
  });

  //Rota para login
  app.post('/login', passport.authenticate('local'), function(req, res) {
    res.send(req.user);
  });

  //Rota para logout
  app.post('/logout', function(req, res) {
    store.getUserByToken(req.body.token).then((user) => {
      user = user[0]; //Aqui vem uma lista de users
      if (!user) {
        return res.status(500).send({message: "User not Found!"});
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
  app.put('/api/user/edit/:id', passport.authenticate('bearer'), (req, res) => {

    console.log(req);
    const user = new User(req.params.id, req.body.name, req.body.email,
      req.body.nickname, req.body.password);

    store.editUser(user).then(() => res.sendStatus(200));

  });

  //Editar a password do user
  app.put('/api/user/edit/password/:id', passport.authenticate('bearer'), (req, res) => {

    console.log(req);
    store.
    editUserPassword(req.params.id, req.body.password).then(() => res.sendStatus(200));

  });

  //Rota para alterar a password do adminstrador
  app.put('/api/admin/edit/password/:id', passport.authenticate('bearer'), passport.authenticate('admin', {
    failWithError: true
  }), (req, res) => {

    console.log(req.body.oldPassword, req.body.newPassword);

    store.
    editAdminPassword(req.params.id, req.body.oldPassword, req.body.newPassword).then(() => res.sendStatus(200));

  }, errorFunction);

  //Rota para o administrador alterar dados de administração
  app.put('/api/admin/edit/:id', passport.authenticate('bearer'), passport.authenticate('admin', {
    failWithError: true
  }), (req, res) => {

    //console.log(req.params.id);
    const user = new User(req.params.id, req.body.name, req.body.email,
      req.body.nickname, req.body.password);

    store.
    editAdmin(user).then(() => res.sendStatus(200))
  }, errorFunction);

  //Rota para apagar o user (o próprio)
  app.delete('/api/user/delete/:id', passport.authenticate('bearer'), (req, res) => {
    console.log(req);

    store.getUserByToken(req.token).then((users) => {
      users = user[0];
      if (user.id != req.params.id) {
        return res.status(401).send("You are not allowed to delete another user!");
      } else {
        store.
        deleteUser(req.params.id).then(() => res.sendStatus(200));
      }
    });

  });

  //Rota para apagar o user
  app.delete('/api/admin/delete/user/:id', passport.authenticate('bearer'),
    passport.authenticate('admin', {
      failWithError: true
    }), (req, res) => {
      //console.log(req);
      console.log(req.params.id);
      console.log(req.body.token);

      store.
      deleteUser(req.params.id).then(() => {
        store.getUserById(req.params.id).then((user) => {
          user = user[0];

          var mailOptions = {
            from: 'blackjack.projectdad@gmail.com',
            to: user.email,
            subject: 'Blackjack Account Deleted',
            text: 'Your account has been deleted. You have been permanently excluded from Blackjack.'
            //html: '<p>Please, click the link to confirm your subscription.</p>'
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
  app.put('/api/admin/block/user/:id', passport.authenticate('bearer'), passport.authenticate('admin', {
    failWithError: true
  }), (req, res) => {
    console.log(req.params.id, req.body.reason_blocked);
    store.
    blockUser(req.params.id, req.body.reason_blocked).then(() => {
      store.getUserById(req.params.id).then((user) => {
        user = user[0];

        var mailOptions = {
          from: 'blackjack.projectdad@gmail.com',
          to: user.email,
          subject: 'Blackjack Account Blocked',
          text: 'Your account has been blocked. Reason:' + user.reason_blocked
          //html: '<p>Please, click the link to confirm your subscription.</p>'
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
  app.put('/api/admin/unblock/user/:id', passport.authenticate('bearer'), /* passport.authenticate('admin', { failWithError: true }),*/ (req, res) => {
    console.log(req.params.id, req.body.reason_reactivated);
    store.
    unblockUser(req.params.id, req.body.reason_reactivated).then(() => {
      store.getUserById(req.params.id).then((user) => {
        user = user[0];

        var mailOptions = {
          from: 'blackjack.projectdad@gmail.com',
          to: user.email,
          subject: 'Blackjack Account Blocked',
          text: 'Your account has been blocked. Reason:' + user.reason_reactivated
          //html: '<p>Please, click the link to confirm your subscription.</p>'
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

    /*store.getTotalNumberOfPlayers().then((totals) => {

      total = totals[0];
      res.send(total);

    });*/

    store.getTotalNumberOfPlayers().then((totals) => {
      console.log(totals);

      /*  total = totals[0];
        console.log(total)
        total = total['COUNT']
        console.log(total)*/

      total = totals[0];
      //console.log (total)
      res.send(total);
      /*total = totals[0];
      res.send(total);*/

    });
  });

  //api/statistics/totalGamesPlayed
  //Rota para devolver o total de jogos jogados
  app.get('/api/statistics/totalGamesPlayed', function(req, res, next) {

    //console.log("Index antes do getTotalGamesPlayed");

    store.getTotalGamesPlayed().then((totals) => {
      total = totals[0];
      //console.log (total)
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

  //api/statistics/topFiveByAverage

  //Devolve o top cinco jogadores com melhor media
  app.get('/api/statistics/topFiveByAverage', function(req, res, next) {
    store.getTopFiveByAverage().then((users) => {
      res.send(users);
    })
  });

  //api/statistics/user/totalWins/
  //Devolve o numero de vitorias de um user
  app.get('/api/statistics/user/totalWins/:id', passport.authenticate('bearer'), function(req, res, next) {

    store.getUserTotalWins().then((totals) => {
      total = totals[0];
      //console.log (total)
      res.send(total);
    })

  });

  //api/statistics/user/totalLosts/
  //Devolve o numero de derrotas de um user
  app.get('/api/statistics/user/totalLosts/:id', passport.authenticate('bearer'), function(req, res, next) {

    store.getUserTotalLosts().then((totals) => {
      console.log('ENTROU NA API TOTAL LOSTS')
      total = totals[0];
      //console.log (total)
      res.send(total);
    })

  });

  //api/statistics/user/totalDraws/
  //Devolve o numero de EMPATES de um user
  app.get('/api/statistics/user/totalDraws/:id', passport.authenticate('bearer'), function(req, res, next) {

    store.getUserTotalDraws().then((totals) => {

      console.log('ENTROU NA API TOTAL daws')
      total = totals[0];
      //console.log (total)
      res.send(total);
    })

  });



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
        res.send({deckId: decks[0]});

      });

    });
  });

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
    console.log(filesReceived['files['+1+']'].name);
    // console.log(' FILES 1 name');
   // console.log(filesReceived.files[1].name);
   let requests = [];

    for(var i = 0; i < 40; i++){ //filesReceived é um objecto e a chave d cd posicao é uma string, por isso tenho que fazer a concatenaçao com o i
        
        let file = filesReceived['files['+i+']'];

        if(file){
          let filename = file.name;
          console.log(filename);

          filePaths[i] = './store/' + filename;

          requests.push(file.mv(filePaths[i], function(err) {
            if (err) {
              return res.status(500).send(err);
            }
          })); 
        }else{
          filePaths[i] = false;
        }
    }

    console.log(req.body.deckId);
    let deckId = req.body.deckId;

    Promise.all(requests).then(function() {
      store.createCards(filePaths, deckId).then(() => {
        
    
      res.send('Files stored!');
      });
    });
  });


  ////*********************************************DECKS********************************************************//

  //Devolve todos os baralhos
  app.get('/api/get/decks', passport.authenticate('bearer'), passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      store.getDecks().then((decks) => {
        console.log('RESPOSTA NO servidr')
        console.log(decks);

        res.send(decks);
      });
    }, errorFunction);

//api/get/card/paths
app.get('/api/get/card/paths', passport.authenticate('bearer'), passport.authenticate('admin', {
      failWithError: true
    }),
    function(req, res, next) {

      console.log(req.body.deck.id);

    }, errorFunction);


};

