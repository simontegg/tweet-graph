
const feathers = require('feathers/client')
const rest = require('feathers-rest/client')
const superagent = require('superagent')
const host = 'http://localhost:3030'
const app = feathers()
  .configure(rest(host).superagent(superagent))

export default app
