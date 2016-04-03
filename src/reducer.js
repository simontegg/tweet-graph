import { combineReducers } from 'redux'


function loggedIn (state = false, action) {
  const actions = {
    LOG_IN: () => true,
    LOG_OUT: () => false
  }
  if (!actions[action.type]) { 
    return state
  }
  return actions[action.type]()
}

function user(state = {}, action) {
  if (action.type === 'UPDATE_USER') { 
    return action.payload
  }
  else {
    return state
  }
}

export default combineReducers({ loggedIn, user })
