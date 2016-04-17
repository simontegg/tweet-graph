'use strict'
require('dotenv').load()
const relationship = require('./relationship')
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
    successRedirect:      '/',
    failureRedirect:      false,
    httpOnly:             true
  }))

  app.configure(twitterAuth({
    consumerKey:    process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    userEndpoint: '/users'
  }))
  app.configure(user);
  app.configure(relationship);
}
