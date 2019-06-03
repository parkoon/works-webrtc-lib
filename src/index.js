const socket = require('./modules/socket')()
const { state, getState, setUser, setPeer } = require('./store')
const encryption = require('./helpers/encryption')
const {
    createAnswer,
    createOffer,
    p2pVideoConnectDone,
    setCandidate,
    setUserMedia
} = require('./modules/p2p-video')

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
window.ktalk.setUserMedia = setUserMedia
window.ktalk.createOffer = createOffer
window.ktalk.createAnswer = createAnswer
window.ktalk.p2pVideoConnectDone = p2pVideoConnectDone
window.ktalk.setCandidate = setCandidate

/** auth */
window.ktalk.login = login
