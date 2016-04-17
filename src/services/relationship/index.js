'use strict';
require('dotenv').load()
const extend = require('lodash.assignin')
const map = require('lodash.map')
const levelgraph = require('levelgraph')
const level = require('level-browserify')
const db = levelgraph((level('relationships')))
const hooks = require('./hooks')
const Twitter = require('twitter')
const Triple = require('./model')

const DAY_MS = 60 * 60 * 24 * 1000


const Service = {
  find(params) {
    const user = params.user
    const followee = params.followee
    const twitterId = user.twitter.id
    const results = []

    return new Promise((resolve, reject) => {
      const query = { 
        subject: twitterId, 
        predicate: 'follows'
      }

      if (followee) {
        extend(query, { object: followee })
      }

      const stream = db.getStream(query)

      stream.on('data', triple => { 
        results.push(triple) 
      })

      stream.on('end', () => { 
        resolve(results)
      })
    })
  },

  getTriple(params, callback) {
    db.get(params, (err, list) => {
      if (err) callback(err)
      callback(null, list[0])
    })
  },

  get(params, callback) {
    console.log('get', callback)
    db.get(params, callback)
  },
  
  getStream(params) {
    return db.getStream(params)
  },

  isFresh(params, duration) {
    
  },

  create(data, callback) {
    const triple = Triple(data)
    db.put(triple, err => {
      if (err) {
        callback(err)
      }
      callback(null, triple)
    })
  },
 
  update(triple, data, callback) {
    console.log(triple, data, callback)
    const updatedTriple = Object.assign(triple, data, { updatedAt: Date.now() }) 
    db.del(triple, err => {
      if (err) { 
        callback(err)
      } else {
        db.put(updatedTriple)
        callback(null, updatedTriple)
        // TODO fix weird callback bug
      //  db.put(updatedTriple, err => {
      //    if (err) { 
      //      callback(err)
      //    } else {
      //      console.log('callback', callback)
      //      callback(null, updatedTriple)
      //    }
      //  })
      }
    })
  },
 
  createOrUpdate(triple, cb) {
    let result = false
    const stream = db.getStream(triple)
    
    stream.on('data', function (data) {
      if (!result) {
        Service.update(data, triple, cb)
        result = true
      }
    })

    stream.on('end', function () {
      if (!result) {
        Service.create(triple, cb)
      }
    })
  },

  patch(id, data, params) {
    return Promise.resolve(data);
  },

  remove(triple, callback) {
    //console.log('removing', callback)
    db.del(triple, err => {
      if (err && callback) {
        //callback(err)
      } else if (callback) {
        //callback(null, triple)
      }
    })
  }
}


function populateUser (app) {
  return function (req, res, next) {
    const userService = app.service('/users')
    userService.get(req.session.userId)
    .then(user => {
      req.feathers.user = user     
      next()
    })
    .catch(err => { 
      console.log(err) 
      next()
    })
  }
}


module.exports = function (){
  const app = this

  // Initialize our service with any options it requires
  app.use('/relationships', populateUser(app), Service)

  // Get our initialize service to that we can bind hooks
  const relationshipService = app.service('/relationships')

  // Set up our before hooks
  relationshipService.before(hooks.before)

  // Set up our after hooks
  relationshipService.after(hooks.after)
}

module.exports.Service = Service
module.exports.db = db
