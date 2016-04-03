'use strict'
require('dotenv').load()
const authentication = require('feathers-authentication')
const user = require('./user');
const twitterAuth = require('../twitter-auth')
module.exports = function() {
  const app = this;

  app.configure(authentication({
    token: {
      secret: process.env.SECRET_KEY
    },
    idField:              '_id',
    setUpSuccessRedirect: false,
    setUpFailureRedirect: false,
    successRedirect:      false,
    failureRedirect:      false
  }))

  app.configure(twitterAuth({
    consumerKey:    process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    userEndpoint: '/users'
  }))
  app.configure(user);
}
