const { getState, setP2pScreenPeer } = require('../store')
const { createRequestDate, createRequestNo } = require('../helpers/request')
const { configuration } = require('../constants/webrtc')
const dispatch = require('../helpers/event')
const {
    SCREEN_REQUEST,
    SCREEN_SUCCESS,
    SCREEN_STOP_SUCCESS,
    SCREEN_STOP_REQUEST,
    SHARE_FAILURE
} = require('../constants/actions')

let __k__talk__screen

const setScreenPeerConnection = stream => {
    return new Promise(async (resolve, reject) => {
        try {
            const peer = new RTCPeerConnection(configuration)

            peer.onaddstream = ({ stream }) => {
                setP2pScreenPeer({
                    stream
                })
                dispatch({
                    type: SCREEN_SUCCESS
                })
                __k__talk__screen.srcObject = stream
            }

            peer.onicecandidate = e => {
                if (e.candidate) {
                    Ktalk.sendMessage({
                        eventOp: 'Candidate',
                        reqDate: createRequestDate(),
                        reqNo: createRequestNo(),
                        usage: 'screen',
                        roomId: getState().user.room,
                        userId: getState().user.id,
                        candidate: e.candidate
                    })
                }
            }

            // const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

            if (stream) {
                peer.addStream(stream)
                __k__talk__screen.srcObject = stream

                stream.getVideoTracks()[0].onended = stopScreenShare
            }

            resolve(peer)
        } catch (err) {
            reject(err)
        }
    })
}

const clearScreenStream = stream => {
    if (!stream) return
    try {
        stream.getTracks().forEach(track => {
            track.stop()
            console.log(`${track.kind} (id: ${track.id}) is stop!`)
        })
    } catch (err) {
        console.error(err)
    }
}

// Set candidate
const setP2pScreenCandidate = candidate => {
    const { p2pScreenPeer } = getState()

    if (candidate) {
        p2pScreenPeer.instance.addIceCandidate(new RTCIceCandidate(candidate))
    }
}

// Create offer SDP
const createP2pScreenOffer = () => {
    return new Promise(async (resolve, reject) => {
        const { p2pScreenPeer } = getState()
        try {
            const offer = await p2pScreenPeer.instance.createOffer()
            p2pScreenPeer.instance.setLocalDescription(offer)

            resolve(offer)
        } catch (err) {
            reject(err)
        }
    })
}

// Crate answer SDP
const createP2pScreenAnswer = offer => {
    return new Promise(async (resolve, reject) => {
        const { p2pScreenPeer } = getState()

        try {
            p2pScreenPeer.instance.setRemoteDescription(offer)
            const answer = await p2pScreenPeer.instance.createAnswer()
            p2pScreenPeer.instance.setLocalDescription(answer)
            resolve(answer)
        } catch (err) {
            reject(err)
        }
    })
}

const acceptScreenShare = async ({ screen }) => {
    if (!screen) {
        return dispatch({
            type: SHARE_FAILURE,
            payload: {
                message: 'screen(video element) parameter  required'
            }
        })
    }

    __k__talk__screen = screen

    try {
        const peer = await setScreenPeerConnection()

        setP2pScreenPeer({
            instance: peer
        })

        // set offer sdp (receiver)
        // create and send answer sdp (receiver)
        const answer = await createP2pScreenAnswer(window.__screen__offer)
        delete window.__screen__offer

        const { user } = getState()

        return Ktalk.sendMessage({
            eventOp: 'SDP',
            reqDate: createRequestDate(),
            reqNo: createRequestNo(),
            usage: 'screen',
            roomId: user.room,
            userId: user.id,
            sdp: answer
        })
    } catch (err) {
        console.error(err)
    }
}

const startScreenShare = ({ screen }) => {
    if (!screen) {
        return dispatch({
            type: SHARE_FAILURE,
            payload: {
                message: 'screen(video element) parameter  required'
            }
        })
    }

    const { user } = getState()
    // 세션 체크

    __k__talk__screen = screen

    dispatch({
        type: SCREEN_REQUEST
    })

    Ktalk.sendMessage({
        eventOp: 'SessionReserve',
        reqNo: createRequestNo(),
        reqDate: createRequestDate(),
        userId: user.id,
        roomId: user.room
    })
}

const p2pScreenConnectDone = answer => {
    const { p2pScreenPeer } = getState()
    p2pScreenPeer.instance.setRemoteDescription(answer)

    dispatch({
        type: SCREEN_SUCCESS
    })
}

const captureScreen = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let stream = ''

            if (navigator.getDisplayMedia) {
                stream = await navigator.getDisplayMedia({ video: true })
            } else if (navigator.mediaDevices.getDisplayMedia) {
                stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
            } else {
                stream = await navigator.mediaDevices.getUserMedia({ video: { mediaSource: 'screen' } })
            }

            resolve(stream)
        } catch (err) {
            stopScreenShare()
        }
    })
}

const stopScreenShare = () => {
    const { p2pScreenPeer, user } = getState()
    clearScreenStream(p2pScreenPeer.stream)

    dispatch({
        type: SCREEN_STOP_REQUEST
    })

    Ktalk.sendMessage({
        eventOp: 'SessionReserveEnd',
        reqNo: createRequestNo(),
        reqDate: createRequestDate(),
        userId: user.id,
        roomId: user.room
    })

    Ktalk.sendMessage({
        eventOp: 'ScreenShareConferenceEnd',
        reqNo: createRequestNo(),
        reqDate: createRequestDate(),
        userId: user.id,
        roomId: user.room
    })
}

module.exports = {
    startScreenShare,
    stopScreenShare,
    captureScreen,
    setScreenPeerConnection,
    createP2pScreenOffer,
    createP2pScreenAnswer,
    p2pScreenConnectDone,
    setP2pScreenCandidate,
    clearScreenStream,
    acceptScreenShare
}
