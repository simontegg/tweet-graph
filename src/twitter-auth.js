var cookieParser            = require('cookie-parser')
var errors                  = require('feathers-errors')
var exposeConnectMiddleware = require('feathers-authentication/lib/middleware').exposeConnectMiddleware
var passport                = require('passport')
var session                 = require('express-session')
var successfulLogin         = require('feathers-authentication/lib/middleware').successfulLogin
var LevelStore              = require('level-session-store')(session)
var Strategy                = require('passport-twitter').Strategy
require('dotenv').load()

// TODO This file will be obsolete with resolution of https://github.com/feathersjs/feathers-authentication/issues/42

module.exports = function(options) {
  return function() {
    var app = this;
    options = Object.assign(
      {
        passReqToCallback: true,
        callbackSuffix:    'callback',
        permissions:       {}
      },
      app.get('auth'),
      { endPoint: '/auth/twitter' },
      options
    );
    options.callbackURL = options.callbackURL || (options.endPoint + '/' + options.callbackSuffix);
    var authOptions = Object.assign({ session: false, state: true }, options.permissions);

//    console.log('app', options)


    app
    .use(cookieParser())
    .use(session({
      resave:            false,
      saveUninitialized: false,
      secret:            process.env.SECRET_KEY,
      store:             new LevelStore()
    }))
    .use(passport.session())
    .use(options.endPoint, exposeConnectMiddleware, {
      oauthCallback: function(req, accessToken, accessTokenSecret, profile, callback) {
        app.service(options.userEndpoint)
        .find({
          internal: true,
          query:    { twitterId: profile.id }
        })
        .then(function(users) {
          var user = users[0] || users.data && users.data[0]

          if (user) {
            return user
          }

          return app.service(options.userEndpoint).create(
            {
              twitterId: profile.id,
              twitter:   Object.assign({ accessToken: accessToken, accessTokenSecret: accessTokenSecret }, profile._json)
            },
            { internal: true }
          )
        })
        .then(function(user) {
          callback(null, user)
        })
        .catch(callback)
      },
      find: function(params) {
        return passport.authenticate('twitter', authOptions)(params.req, params.res)
      },
      get: function(id, params) {
        if (id !== 'callback') {
          return Promise.reject(new errors.NotFound())
        }

        return new Promise(function(resolve, reject) {
          passport.authenticate('twitter', authOptions, function(err, user) {
            if (err) {
              return reject(err);
            }
            if (!user) {
              return reject(new errors.NotAuthenticated('An error occurred logging in with twitter'));
            }

            return app.service(options.tokenEndpoint)
            .create(user, { internal: true })
            .then(resolve)
            .catch(reject)
          })(params.req, params.res)
        })
      }
    }, successfulLogin(options))

    var service = app.service(options.endPoint)

    passport.use(new Strategy(options, service.oauthCallback.bind(service)))

    if (options.TokenStrategy) {
      passport.use(new options.TokenStrategy(options, service.oauthCallback.bind(service)))
    }
  }
}
