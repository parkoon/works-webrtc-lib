const { getState, setP2pScreenPeer } = require('../store')
const { createRequestDate, createRequestNo } = require('../helpers/request')
const { configuration } = require('../constants/webrtc')
const dispatch = require('../helpers/event')

const setScreenPeerConnection = stream => {
    return new Promise(async (resolve, reject) => {
        try {
            const peer = new RTCPeerConnection(configuration)

            peer.onaddstream = ({ stream }) => {
                setP2pScreenPeer({
                    stream
                })
                document.querySelector('#local-screen').srcObject = stream
            }

            peer.onicecandidate = e => {
                if (e.candidate) {
                    ktalk.sendMessage({
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
                document.querySelector('#local-screen').srcObject = stream

                stream.getVideoTracks()[0].onended = () => {
                    dispatch({
                        type: 'SCREEN_SHARE_STOP'
                    })
                }
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

const startScreenShare = () => {
    const { user } = getState()
    // 세션 체크

    ktalk.sendMessage({
        eventOp: 'SessionReserve',
        reqNo: createRequestNo(),
        reqDate: createRequestDate(),
        userId: user.id,
        roomId: user.room
    })

    // if (p2pScreenPeer.session)
    // getState
}

const p2pScreenConnectDone = answer => {
    const { p2pScreenPeer } = getState()
    p2pScreenPeer.instance.setRemoteDescription(answer)
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
            reject(err)
        }
    })
}

const stopScreenShare = () => {
    const { p2pScreenPeer, user } = getState()
    clearScreenStream(p2pScreenPeer.stream)

    ktalk.sendMessage({
        eventOp: 'SessionReserveEnd',
        reqNo: createRequestNo(),
        reqDate: createRequestDate(),
        userId: user.id,
        roomId: user.room
    })

    ktalk.sendMessage({
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
    clearScreenStream
}
