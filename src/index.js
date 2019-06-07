const socket = require('./modules/socket')()
const { state, getState, setUser, setP2pVideoPeer } = require('./store')
const encryption = require('./helpers/encryption')
const { startVideoCall, stopVideoCall, acceptVideoCall } = require('./modules/p2p-video')

const { startScreenShare, stopScreenShare, acceptScreenShare } = require('./modules/p2p-screen')

const { login, logout } = require('./modules/auth')
const { createRequestDate, createRequestNo } = require('./helpers/request')

const { createInput, fileShareHandler, mapping } = require('./modules/file')
const {
    createCanvas,
    drawing,
    blockDrawing,
    releaseDrawing,
    setPenColor,
    setPenThickness,
    setWhiteboardTool,
    setEraserSize
} = require('./modules/canvas')

/** main */
Ktalk = {}

/** user & peer state */
Ktalk.getState = getState

/** request data */
Ktalk.createRequestDate = createRequestDate
Ktalk.createRequestNo = createRequestNo

/** password encryption */
Ktalk.encryption = encryption

/** socket */
Ktalk.sendMessage = socket.sendMessage
Ktalk.listener = document.createElement('div')

/** p2p video connection */
Ktalk.startVideoCall = startVideoCall
Ktalk.stopVideoCall = stopVideoCall
Ktalk.acceptVideoCall = acceptVideoCall

/** p2p screen share */
Ktalk.startScreenShare = startScreenShare
Ktalk.stopScreenShare = stopScreenShare
Ktalk.acceptScreenShare = acceptScreenShare

/** auth */
window.Ktalk.login = login
window.Ktalk.logout = logout

/** file share */
Ktalk.uploader = createInput()
Ktalk.sendFile = fileShareHandler

/** realtime canvas */
Ktalk.whiteboard = (w, h) => createCanvas(w, h)
Ktalk.drawing = (x, y) => drawing(x, y)
Ktalk.blockDrawing = blockDrawing
Ktalk.releaseDrawing = releaseDrawing
Ktalk.setPenColor = setPenColor
Ktalk.setPenThickness = setPenThickness
Ktalk.setWhiteboardTool = setWhiteboardTool
Ktalk.setEraserSize = setEraserSize
Ktalk.mapping = mapping
