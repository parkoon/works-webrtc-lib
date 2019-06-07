const { getState, setUser } = require('../store')
const dispatch = require('../helpers/event')
const { LOGOUT_FAILURE } = require('../constants/actions')
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

const signup = () => {
    Ktalk.sendMessage({
        eventOp: 'SignUp',
        reqNo: createRequestNo(),
        reqDate: createRequestDate(),
        userId: 'asas',
        userPw: 'asdasd',
        userName: 'asas',
        deviceType: 'pc'
    })
}

module.exports = {
    login,
    logout,
    signup
}
