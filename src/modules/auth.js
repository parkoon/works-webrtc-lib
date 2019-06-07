const { getState, setUser } = require('../store')
const dispatch = require('../helpers/event')
const { LOGOUT_FAILURE, SIGNUP_FAILURE, SIGNUP_REQUEST, SIGNUP_SUCCESS } = require('../constants/actions')
const { createRequestDate, createRequestNo } = require('../helpers/request')

const login = ({ id, password }) => {
    setUser({
        id
    })
    Ktalk.sendMessage({
        eventOp: 'Login',
        userId: id,
        userPw: Ktalk.encryption(password),
        reqDate: createRequestDate(),
        reqNo: createRequestNo(),
        deviceType: 'pc'
    })
}

const logout = () => {
    const { user } = getState()

    if (!user.id) {
        return dispatch({
            type: LOGOUT_FAILURE,
            payload: 'already logged out, login first'
        })
    }
    console.log('user.id', user.id)
    Ktalk.sendMessage({
        eventOp: 'Logout',
        userId: user.id,
        reqDate: createRequestDate(),
        reqNo: createRequestNo()
    })
}

const signup = user => {
    const { id, password, name } = user
    dispatch({
        type: SIGNUP_REQUEST
    })

    if (!id || !password || !name) {
        return dispatch({
            type: SIGNUP_FAILURE,
            payload: {
                message: 'id, password, name parameter required'
            }
        })
    }

    Ktalk.sendMessage({
        eventOp: 'SignUp',
        reqNo: createRequestNo(),
        reqDate: createRequestDate(),
        userId: id,
        userPw: password,
        userName: name,
        deviceType: 'pc'
    })
}

module.exports = {
    login,
    logout,
    signup
}
