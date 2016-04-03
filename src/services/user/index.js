'use strict';
const level = require('level')
const Model = require('level-model')
const inherits = require('util').inherits
const extend = require('lodash').extend
var db = level('db')

function Users (db, opts) {
  Model.call(this, db, opts)
}

inherits(Users, Model)

const users = new Users(db, {
  modelName: 'users',
  indexKeys: [ 'twitterId' ],
  properties: {
    twitterId: { type: 'integer' },
    twitter: { type: 'object' },
    retweetRate: { type: 'number' },
    mentionRate: { type: 'number' }, 
  },
  required: [ 'twitterId' ]
})

const hooks = require('./hooks');

const UserService = {
  find(params) {
    console.log('params', params)
    return new Promise(function (resolve, reject) {
      users.get(parseInt(params.query.twitterId), function (err, res) {
        if (err) {
          // TODO check for other errors 
          console.log(Object.keys(err))
          resolve([])
        } 
        resolve(res)
      })
    })
  },

  get(id, params) {
    return new Promise(function (resolve, reject) {
      users.get(params.query.twitterId, function (err, res) {
        if (err) {
          reject(err)
        } 
        resolve(res)
      })
    })
  },

  create(data, params) {
    console.log('data', data, params)
    return new Promise(function (resolve, reject) {
      users.create(data, function (err, res) {
        if (err) {
          reject(err)
        } 
        resolve(res)
      })
    })
  },

  update(id, data, params) {
    return new Promise(function (resolve, reject) {
      users.get(id, function (err, user) {
        if (err) {
          reject(err)
        } 
        users.update(extend(user, data), function (err, res) {
          if (err) {
            reject(err)
          } 
          resolve(res)
        })
      })
    })
  },

  patch(id, data, params) {
    return new Promise(function (resolve, reject) {
      users.get(id, function (err, user) {
        if (err) {
          reject(err)
        } 
        users.update(extend(user, data), function (err, res) {
          if (err) {
            reject(err)
          } 
          resolve(res)
        })
      })
    })
  },

  remove(id, params) {
    return new Promise(function (resolve, reject) {
      users.delete(id, function (err, res) {
        if (err) {
          reject(err)
        } 
        resolve(res)
      })
    })
  },

  before: {
    all(hook) {
      if (hook.data) {
        hook.data.twitterId = parseInt(hook.data.twitterId)
      }
    }
  }
}

module.exports = function(){
  const app = this;

  // Initialize our service with any options it requires
  app.use('/users', UserService);

  // Get our initialize service to that we can bind hooks
  const userService = app.service('/users');

  // Set up our before hooks
  userService.before(hooks.before);

  // Set up our after hooks
  userService.after(hooks.after);
};

module.exports.Service = UserService;
