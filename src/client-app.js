
const feathers = require('feathers/client')
const rest = require('feathers-rest/client')
const superagent = require('superagent')
const host = 'http://localhost:3030'

//const primus = new Primus(host)




const app = feathers()
  //.configure(feathers.hooks())
  //.configure(feathers.primus(primus))
  .configure(rest(host).superagent(superagent))

export default app
