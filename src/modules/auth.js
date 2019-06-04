const { getState } = require('../store')
const dispatch = require('../helpers/event')
const { LOGOUT_FAILURE } = require('../constants/actions')

const login = ({ id, password }) => {
    ktalk.sendMessage({
        eventOp: 'Login',
        userId: id,
        userPw: ktalk.encryption(password),
        reqDate: ktalk.createRequestDate(),
        reqNo: ktalk.createRequestNo(),
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
    ktalk.sendMessage({
        eventOp: 'Logout',
        userId: user.id,
        reqDate: ktalk.createRequestDate(),
        reqNo: ktalk.createRequestNo()
    })
}

module.exports = {
    login,
    logout
}
