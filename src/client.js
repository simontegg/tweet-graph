import { extend } from 'lodash'
import finalCreateStore from './store'
import { getLogin } from './action-creators'
import * as actionCreators from './action-creators'
const sheetRouter = require('sheet-router')
const yo = require('yo-yo')

const initialState = window._state || {
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
    route('/', (params, yo, props) => {
      extend(props, actionCreators)
      console.log('props', props)
      const state = props.store.getState()
      const content = state.loggedIn ? profile : signIn 
      return base(content)(params, yo, props)
    })
  ]
})

function profile (params, yo, props) {
  const { store, fetchFollowships } = props
  const state = store.getState()
  const { twitter } = state.user
  const { screen_name, profile_image_url } = twitter
  console.log('props in profile', props)

  function handleClick () {
    console.log('button click')
    store.dispatch(fetchFollowships()) 
  }

  return yo`<div class="profile">
      <img src=${profile_image_url} />
      <p>${screen_name}</p>
      <button onclick=${handleClick}>fetch friends</button>
    </div>`
}


function signIn () {
  return yo`<a href='/auth/twitter' >
    <img src="images/sign-in-with-twitter.png" />
  </a>`
}



document.querySelector('#app')
  .appendChild(router('/', yo, { store: store }))



