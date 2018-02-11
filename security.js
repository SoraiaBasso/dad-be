module.exports = function(store) {
    module = {};

    const passport = require('passport');
    //duas estrategia de autenticacao
    const LocalStrategy = require('passport-local').Strategy;
    const BearerStrategy = require('passport-http-bearer').Strategy;
    const CustomStrategy = require('passport-custom').Strategy;

    const crypto = require('crypto');

    var bcrypt = require("bcrypt");


    const sha1 = require('sha1');


    //esta stratégia é para quando o user faz login - mudar password todo
    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    }, (username, password, done) => {
        console.log('Received: ' + username + ', ' + password);
        store.getUser(username).then(user => {
            user = user[0];
            console.log(user);
            if (user === null || user === undefined) {
                return done(null, false, {
                    message: 'Incorrect credentials.'
                });
            }

            bcrypt.compare(password, user.password).then(function(res) {
                if (!res) {
                    console.log('Invalid password!');
                    return done(null, false, {
                        message: 'Incorrect credentials.'
                    });
                }
                //gera o token e guarda-o na bd
                //user.token = sha1(user.username + Date.now()); 
                crypto.randomBytes(48, function(err, buffer) {
                    user.token = buffer.toString('hex');
                    store.updateUserToken(user.id, user.token)
                        //.then(r => r.modifiedCount !== 1 ? done(null, false) : done(null, user))
                        .then(r => done(null, user))
                        .catch(err => done(err));
                });

            });


        }).catch(err => done(err));
    }));
    //estratégia para quando o user já está logado
    passport.use(new BearerStrategy((token, done) => {
        store.getUserByToken(token).then(users => {
                const user = users[0];
                console.log(user);
                console.log(token);
                return user ? done(null, user, {
                    scope: 'all'
                }) : done(null, false);
            })
            .catch(err => {
                console.log(err);
                return done(err);
            });
    }));

    passport.use('admin', new CustomStrategy(
        function(req, done) { //done: método que vem a seguir (request => auth(bearer) => auth(admin) => metodo da API). Neste caso o done é o metodo da API
            const token = req.token;

            if (!token) {
                done({
                    code: 401,
                    message: "No Token Received!"
                });
                //return res.status(401).send("No Token Received!");
            }
            store.getUserByToken(token).then((users) => {
                const user = users[0];
                console.log('USER:');
                console.log(users);
                if (!user) {
                    done({
                        code: 401,
                        message: "No User Found!"
                    });
                    //return res.status(401).send("No User Found!");

                }
                if (!user.admin) {
                    done({
                        code: 401,
                        message: "User is not Admin!"
                    });
                    //return res.status(401).send("User is not Admin!");

                }
                return done(null, user)
            });
        }
    ));


    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user);
    });


    module.initMiddleware = function(server) {
        server.use(passport.initialize());

    };
    module.getPassport = function() {
        return passport;
    };
    /*
    //classe com metodos 
    class Security {
        constructor() {
            this.passport = passport;
            this.authorize = this.passport.authenticate('bearer', {
                session: false
            });
            this.initMiddleware = (server) => {
                server.use(passport.initialize());
            };
            this.getPassport = () => {
                return this.passport;
            };
        }
    }*/
    return module;
}
//exports.Security = Security;