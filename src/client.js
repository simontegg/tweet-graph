import finalCreateStore from './store'

const sheetRouter = require('sheet-router')

const initialState = {
  loggedIn: false,
  user: {}
}

const store = finalCreateStore(initialState)



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
      return base(signIn(props))(params, yo, props)
    })
  ]
})



const yo = require('yo-yo')

function signIn (props) {
  return function () {
    function handleClick () {
      const state = props.store.getState()
      console.log('clicked', state)    
    }

    return yo`<img 
      onclick=${handleClick} 
      src="images/sign-in-with-twitter.png" />`
  }
}



document.querySelector('#app')
  .appendChild(router('/login', yo, { store: store }))



