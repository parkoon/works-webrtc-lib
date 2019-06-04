const login = ({ id, password }) => {
    ktalk.sendMessage({
        eventOp: 'Login',
        userId: id,
        userPw: ktalk.encryption(password),
        reqDate: ktalk.createRequestDate(),
        reqNo: ktalk.createRequestNo()
    })
}

const logout = () => {
    ktalk.sendMessage({
        eventOp: 'Login',
        userId: id,
        userPw: ktalk.encryption(password),
        reqDate: ktalk.createRequestDate(),
        reqNo: ktalk.createRequestNo()
    })
}

module.exports = {
    login
}
