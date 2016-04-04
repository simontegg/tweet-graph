import finalCreateStore from './store'
import { getLogin } from './action-creators'

const sheetRouter = require('sheet-router')

const initialState = {
  loggedIn: false,
  user: {}
}

const store = finalCreateStore(initialState)

//store.dispatch(getLogin())

const base = function (content) {
  return function (params, yo, state) {
    return yo`<main>
      <header></header>
      <aside></aside>
      ${content(params, yo, state)}
    </main>`
  }
}

const router = sheetRouter(function (route) {
  return [
    route('/login', (params, yo, props) => {
      return base(signIn)(params, yo, props)
    })
  ]
})



const yo = require('yo-yo')

function signIn () {
  return yo`<a href='/auth/twitter' >
    <img src="images/sign-in-with-twitter.png" />
  </a>`
}



document.querySelector('#app')
  .appendChild(router('/login', yo, { store: store }))



