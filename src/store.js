import { createStore, compose, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import multi from 'redux-multi'
import reducer from './reducer'

if (process.env.NODE_ENV === 'development') {
  var logger = require('redux-logger')
}

let middleware = [thunk, multi]

if (process.env.NODE_ENV === 'development') {
  if (process.browser) {
    middleware.push(logger())
  }
}

export default function finalCreateStore(initialState) {
  const createEnhancedStore = compose(
    applyMiddleware(...middleware)
  )(createStore)

  return createEnhancedStore(reducer, initialState)
}
