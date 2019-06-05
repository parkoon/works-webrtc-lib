const { getState } = require('../store')
const dispatch = require('../helpers/event')
const { LOGOUT_FAILURE } = require('../constants/actions')

const login = ({ id, password }) => {
    Ktalk.sendMessage({
        eventOp: 'Login',
        userId: id,
        userPw: Ktalk.encryption(password),
        reqDate: Ktalk.createRequestDate(),
        reqNo: Ktalk.createRequestNo(),
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
        reqDate: Ktalk.createRequestDate(),
        reqNo: Ktalk.createRequestNo()
    })
}

module.exports = {
    login,
    logout
}
