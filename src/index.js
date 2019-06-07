const socket = require('./modules/socket')()
const { state, getState, setUser, setP2pVideoPeer } = require('./store')
const encryption = require('./helpers/encryption')
const { startVideoCall, stopVideoCall, acceptVideoCall, rejectVideoCall } = require('./modules/p2p-video')

const { startScreenShare, stopScreenShare, acceptScreenShare } = require('./modules/p2p-screen')

const { login, logout, signup } = require('./modules/auth')
const { createRequestDate, createRequestNo } = require('./helpers/request')

const { createInput, fileShareHandler, imageMapping } = require('./modules/file')
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

const { get } = require('./modules/contacts')

/** main */
Ktalk = {}

/** user & peer state */
Ktalk.getState = getState

/** socket */
Ktalk.sendMessage = socket.sendMessage
Ktalk.IO = document.createElement('div')

/** p2p video connection */
Ktalk.VideoCall = {}
Ktalk.VideoCall.start = startVideoCall
Ktalk.VideoCall.stop = stopVideoCall
Ktalk.VideoCall.accept = acceptVideoCall
Ktalk.VideoCall.reject = rejectVideoCall

/** p2p screen share */
Ktalk.ScreenShare = {}
Ktalk.ScreenShare.start = startScreenShare
Ktalk.ScreenShare.stop = stopScreenShare
Ktalk.ScreenShare.accept = acceptScreenShare

/** auth */
Ktalk.Auth = {}
Ktalk.Auth.login = login
Ktalk.Auth.logout = logout
Ktalk.Auth.signup = signup

/** file share */
Ktalk.File = {}
Ktalk.File.uploader = createInput
Ktalk.File.share = fileShareHandler

/** realtime canvas */
Ktalk.Whiteboard = {}
Ktalk.Whiteboard.create = (w, h) => createCanvas(w, h)
Ktalk.Whiteboard.drawing = (x, y) => drawing(x, y)
Ktalk.Whiteboard.block = blockDrawing
Ktalk.Whiteboard.release = releaseDrawing
Ktalk.Whiteboard.setPenColor = setPenColor
Ktalk.Whiteboard.setPenThickness = setPenThickness
Ktalk.Whiteboard.setTool = setWhiteboardTool
Ktalk.Whiteboard.setEraserSize = setEraserSize
Ktalk.Whiteboard.imageMapping = imageMapping

/** contacts */
Ktalk.Contacts = {}
Ktalk.Contacts.get = get
