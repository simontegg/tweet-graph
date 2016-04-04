'use strict'

const path = require('path')
const serveStatic = require('feathers').static
const favicon = require('serve-favicon')
const compress = require('compression')
const cors = require('cors')
const feathers = require('feathers')
const authentication = require('feathers-authentication')
const configuration = require('feathers-configuration')
const hooks = require('feathers-hooks')
const rest = require('feathers-rest')
const bodyParser = require('body-parser')
const primus = require('feathers-primus')
const middleware = require('./middleware')
const services = require('./services')
const cookieParser = require('cookie-parser')
const hbs = require('express-handlebars')

const app = feathers()

app.configure(configuration(path.join(__dirname, '..')))
app.engine('hbs', hbs({
  helpers: {
    json: function (context) {
      return JSON.stringify(context)                
    }
  }
}))
app.set('view engine', 'hbs')
app.set('views', __dirname + '/../views')

app.use(compress())
.options('*', cors())
.use(cors())
.use(favicon( path.join(app.get('public'), 'favicon.ico') ))
.use(cookieParser())
.use(bodyParser.json())
.use(bodyParser.urlencoded({ extended: true }))
.configure(hooks())
.configure(rest())
//.configure(primus({ transformer: 'websockets' }))
.configure(services)
.use('/', function (req, res, next) {
  if (req.url === '/' && req.session.userId) {
    const userService = app.service('/users')
    userService.get(req.session.userId)
      .then(user => {
        console.log('user', user)   
        res.render('index', { data: JSON.stringify({ loggedIn: true, user: user }) })
        //next()
      })
  } else {
    next()
  }
})
.use('/', serveStatic( app.get('public') ))
.configure(middleware)


module.exports = app
