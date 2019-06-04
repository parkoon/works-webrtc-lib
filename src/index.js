const socket = require('./modules/socket')()
const { state, getState, setUser, setP2pVideoPeer } = require('./store')
const encryption = require('./helpers/encryption')
const { startVideoCall, stopVideoCall, acceptVideoCall } = require('./modules/p2p-video')

const { startScreenShare, stopScreenShare, acceptScreenShare } = require('./modules/p2p-screen')

const { login, logout } = require('./modules/auth')
const { createRequestDate, createRequestNo } = require('./helpers/request')

/** main */
window.ktalk = {}

/** user & peer state */
window.ktalk.getState = getState

/** request data */
window.ktalk.createRequestDate = createRequestDate
window.ktalk.createRequestNo = createRequestNo

/** password encryption */
window.ktalk.encryption = encryption

/** socket */
window.ktalk.sendMessage = socket.sendMessage
window.ktalk.listener = document.createElement('div')

/** p2p video connection */
window.ktalk.startVideoCall = startVideoCall
window.ktalk.stopVideoCall = stopVideoCall
window.ktalk.acceptVideoCall = acceptVideoCall

/** p2p screen share */
window.ktalk.startScreenShare = startScreenShare
window.ktalk.stopScreenShare = stopScreenShare
window.ktalk.acceptScreenShare = acceptScreenShare

/** auth */
window.ktalk.login = login
window.ktalk.logout = logout
