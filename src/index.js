const socket = require('./modules/socket')()
const { state, getState, setUser, setP2pVideoPeer } = require('./store')
const encryption = require('./helpers/encryption')
const {
    createP2pVideoAnswer,
    createP2pVideoOffer,
    p2pVideoConnectDone,
    setP2pVideoCandidate,
    sendVideoCall,
    acceptVideoCall,
    rejectVideoCall
} = require('./modules/p2p-video')

const { startScreenShare, stopScreenShare } = require('./modules/p2p-screen')

const { login } = require('./modules/auth')
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
window.ktalk.sendVideoCall = sendVideoCall
window.ktalk.createP2pVideoOffer = createP2pVideoOffer
window.ktalk.createP2pVideoAnswer = createP2pVideoAnswer
window.ktalk.p2pVideoConnectDone = p2pVideoConnectDone
window.ktalk.setP2pVideoCandidate = setP2pVideoCandidate
window.ktalk.acceptVideoCall = acceptVideoCall
window.ktalk.rejectVideoCall = rejectVideoCall

/** p2p screen share */
window.ktalk.startScreenShare = startScreenShare
window.ktalk.stopScreenShare = stopScreenShare

/** auth */
window.ktalk.login = login
