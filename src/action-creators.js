import app from './client-app'
import request from 'superagent'

//const authService = app.service('auth/twitter')
const relationshipService = app.service('/relationships')

//const login = () => ({ type: 'LOGIN' })
//const loginFailure = () => ({ type: 'LOG_IN_FAIL' })
//const logOut = () => ({ type: 'LOG_OUT' })
  
export function fetchFollowships () {
  return function (dispatch) {
    return relationshipService.find()
      .then(res => {
        console.log('res', res)
      })
  }
}


// export function loginSuccess (user) {
//   return [
//     login(),
//     updateUser(user)
//   ]
// }
// 
// export function getLogin () {
//   console.log('getLogin')
//   return function (dispatch) {
//     console.log('authService', authService)
//     return request.get('http://localhost:3030/auth/twitter')
//       .set('Accept', 'application/json')
//       .set('Content-Type', 'application/json')
//       .end((err, res) => {
//         console.log(err, res)
//         //user => dispatch(loginSuccess(user)),
//         //error => dispatch(loginFailure())
//       })
//     }
// }



