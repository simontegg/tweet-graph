'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks')
const auth = require('feathers-authentication').hooks
const Twitter = require('twit')
const map = require('lodash.map')
const pull = require('pull-stream')
const toPull = require('stream-to-pull-stream')
const fromPromise = require('stream-from-promise')
const delay = require('pull-delay')
const DAY_MS = 60 * 60 * 24 * 1000
const each = require('lodash.foreach')
const filter = require('lodash.filter')
const noop = function () {}

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

function getTwitterClient (user) {
  return new Twitter({
    consumer_key:        process.env.CONSUMER_KEY,
    consumer_secret:     process.env.CONSUMER_SECRET,
    access_token:        user.twitter.accessToken,
    access_token_secret: user.twitter.accessTokenSecret
  })
}

function toTriple (followerId) {
  return function (followeeId) {
    return {
      subject: parseInt(followerId, 10),
      predicate: 'follows',
      object: parseInt(followeeId, 10)
    }
  }
}

function isStale(updatedAt, diff) {
  return (Date.now() - updatedAt) > diff 
}

function fetchFollowees (client, twitterId) {
  if (Array.isArray(twitterId)) {
    const promises = []

    each(twitterId, (id, i)  => {
      promises.push(new Promise((resolve, reject) => {
         setTimeout(() => {
            fetchFollowees(client, id, save)
              .then(res => {
                resolve(res.data.ids)
              })
              .catch(reject)
         }, 60001 * (i + 1))
      }))
    })

    return new Promise.all(promises)
  } else {
    return new Promise((resolve, reject) => {
      client.get('friends/ids', { user_id: twitterId })
        .then(res => {
          console.log('resolving...')
          resolve(res.data.ids)
        })
        .catch(reject)
    })
  }
}


const onEnd = (subject, relationshipService) => () => {
  const stream = relationshipService.getStream({ 
    subject: subject, 
    predicate: 'follows',   
    filter: triple => { 
      return !triple.updatedAt || isStale(triple.updatedAt, DAY_MS)
    }
  })
      
  stream.on('data', data => {
    relationshipService.remove(data, (err, res) => {
      console.log('-')
    })
  })
}

const toSubject = id => ({ subject: id, predicate: 'follows' })

const refreshNetwork = (client, twitterId, relationshipService) => twitterIds => {
  pull(
    pull.values(twitterIds),
    pull.map(toSubject),
    pull.asyncMap((subject, cb) => {
      relationshipService.getTriple(subject, (err, triple) => {
        cb(err, triple)
      })
    }),
    pull.collect((err, triples) => {
      // TODO filterIn if id1 has no triples as subject
      const filtered = filter(twitterIds, (id, i) => {
        return !triples[i] || triples[i].updatedAt && isStale(triples[i].updatedAt, DAY_MS)
      })
    
      let id = null

      pull(
        pull.values(filtered),
        delay(60001),
        pull.asyncMap((id1, cb) => {
          console.log('id1', id1)
          client.get('friends/ids', { user_id: id1 }, (err, res) => {
            cb(err, map(res.ids, toTriple(id1)))
          })
        }),
        pull.flatten(),
        pull.asyncMap(relationshipService.createOrUpdate),
        pull.drain(triple => {
          if(triple.subject !== id) {
            id = triple.subject
            onEnd(id, relationshipService)()
          }
          return true
        }, () => {
          console.log('done')   
        })
      )
    })
    )
  
}

function refreshCheck (hook) {
  const result = hook.result
  const user = hook.params.user
  const relationshipService = hook.app.service('relationships')
  const userService = hook.app.service('users')
  console.log('hook')

  if (!user.followeesUpdatedAt || isStale(user.followeesUpdatedAt, DAY_MS)) {
    const client = getTwitterClient(user)
    const followeesPromise = fetchFollowees(client, user.twitterId)
    const followeesSource = toPull(fromPromise.obj(followeesPromise))

    pull(
      followeesSource,
      pull.through(refreshNetwork(client, user.twitterId, relationshipService)),
      pull.flatten(),
      pull.map(toTriple(user.twitterId)),
      pull.asyncMap(relationshipService.createOrUpdate),
      pull.onEnd(onEnd(user.twitterId, relationshipService))
    )
  }


  // save followees
  //  prune old network

  // return fetchFollowee2 
  //.then()

  // fetchFollowees
  // create set new difference
  // drop set old difference
  //  recurse 
  //    fetch followee[i] followees
  //    create new difference
  //    drop set old difference
  //else if (isStale(results[0].createdAt, 10000)) {
  // newly
  //}

  return hook  
}

exports.before = {
  all: [
    //    auth.verifyToken(),
    auth.populateUser()
    //    auth.restrictToAuthenticated()
  ],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [
    refreshCheck
  ],
  get: [],
  create: [

  ],
  update: [],
  patch: [],
  remove: []
};
