const { setP2pVideoPeer, getState, setUser, setLoading } = require('../store')
const { createRequestDate, createRequestNo } = require('../helpers/request')
const {
    CALL_FAILURE,
    CALL_SUCCESS,
    CALL_REQUEST,
    CALL_ACCEPT,
    CALL_REJECT,
    CALL_STOP_REQUEST
} = require('../constants/actions')
const dispatch = require('../helpers/event')
const { configuration } = require('../constants/webrtc')

/**
 *
 * @param {Object} option
 * @param {Element} option.localVideo // required
 * @param {Element} option.remoteVideo // required
 * @param {String} option.type // required
 * @param {Function} option.onicecnadidate // required
 */
const startVideoCall = async option => {
    const { localVideo, remoteVideo, target } = option
    // const { loading } = getState()
    // if (loading.call) {
    //     return dispatch({
    //         type: CALL_FAILURE,
    //         payload: {
    //             message: 'start call already'
    //         }
    //     })
    // }

    // Parameter validation
    if (!localVideo || !remoteVideo) {
        return dispatch({
            type: CALL_FAILURE,
            payload: {
                message: 'localVideo, remoteVideo(video element) parameter required'
            }
        })
    }

    if (!target) {
        return dispatch({
            type: CALL_FAILURE,
            payload: {
                message: 'target parameter require'
            }
        })
    }

    setUser({ target })
    dispatch({
        type: CALL_REQUEST,
        payload: {
            target
        }
    })

    try {
        /**
         * 1. init peer connection
         * 2. create video stream
         * 3. set stream to peer
         * 4. send call(eventOP) message
         */
        const peer = await initVideoPeer(localVideo, remoteVideo)
        const stream = await createVideoStream()
        peer.addStream(stream)
        localVideo.srcObject = stream
        // await setUserMedia(localVideo, remoteVideo)

        setP2pVideoPeer({
            instance: peer,
            localStream: stream
        })

        // setLoading({
        //     call: true
        // })

        console.log('========= LOG START =======')
        console.log(getState())
        console.log('========= LOG END =========')

        Ktalk.sendMessage({
            eventOp: 'Call',
            userId: getState().user.id,
            targetId: [target],
            reqDeviceType: 'pc',
            reqDate: createRequestDate(),
            reqNo: createRequestNo()
        })
    } catch (err) {
        console.error(err)
    }
}

const createVideoStream = () => {
    return new Promise(async (resolve, reject) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            resolve(stream)
        } catch (err) {
            reject(err)
        }
    })
}

const initVideoPeer = (localVideo, remoteVideo) => {
    return new Promise((resolve, reject) => {
        try {
            const peer = new RTCPeerConnection(configuration)

            peer.onaddstream = ({ stream }) => {
                remoteVideo.srcObject = stream
                setP2pVideoPeer({
                    remoteStream: stream
                })

                dispatch({
                    type: CALL_SUCCESS
                })
            }

            peer.onicecandidate = e => {
                if (e.candidate) {
                    Ktalk.sendMessage({
                        eventOp: 'Candidate',
                        reqDate: createRequestDate(),
                        reqNo: createRequestNo(),
                        usage: 'cam',
                        roomId: getState().user.room,
                        userId: getState().user.id,
                        candidate: e.candidate
                    })
                }
            }
            resolve(peer)
        } catch (err) {
            reject(err)
        }
    })
}

// Create offer SDP
const createP2pVideoOffer = () => {
    return new Promise(async (resolve, reject) => {
        const { p2pVideoPeer } = getState()
        try {
            const offer = await p2pVideoPeer.instance.createOffer()
            p2pVideoPeer.instance.setLocalDescription(offer)

            resolve(offer)
        } catch (err) {
            reject(err)
        }
    })
}

// Crate answer SDP
const createP2pVideoAnswer = offer => {
    return new Promise(async (resolve, reject) => {
        const { p2pVideoPeer } = getState()

        try {
            p2pVideoPeer.instance.setRemoteDescription(offer)
            const answer = await p2pVideoPeer.instance.createAnswer()
            p2pVideoPeer.instance.setLocalDescription(answer)
            resolve(answer)
        } catch (err) {
            reject(err)
        }
    })
}

// Done
const p2pVideoConnectDone = answer => {
    const { p2pVideoPeer } = getState()
    p2pVideoPeer.instance.setRemoteDescription(answer)
}

// Set candidate
const setP2pVideoCandidate = candidate => {
    const { p2pVideoPeer } = getState()

    if (candidate) {
        p2pVideoPeer.instance.addIceCandidate(new RTCIceCandidate(candidate))
    }
}

const acceptVideoCall = async ({ localVideo, remoteVideo }) => {
    // Parameter validation
    if (!localVideo || !remoteVideo) {
        return dispatch({
            type: CALL_FAILURE,
            payload: {
                message: 'localVideo, remoteVideo(video element) parameter required'
            }
        })
    }

    dispatch({
        type: CALL_ACCEPT
    })

    const { user } = getState()
    Ktalk.sendMessage({
        eventOp: 'Invite',
        status: 'accept',
        roomId: user.room
    })

    Ktalk.sendMessage({
        eventOp: 'Join',
        status: 'accept',
        roomId: user.room,
        reqDate: createRequestDate(),
        reqNo: createRequestNo(),
        userId: user.id
    })

    try {
        /**
         * 1. init peer connection
         * 2. create video stream
         * 3. set stream to peer
         * 4. create and send offer
         */
        const peer = await initVideoPeer(localVideo, remoteVideo)
        const stream = await createVideoStream()
        peer.addStream(stream)
        localVideo.srcObject = stream
        // await setUserMedia(localVideo, remoteVideo)

        setP2pVideoPeer({
            instance: peer,
            localStream: stream
        })

        Ktalk.sendMessage({
            eventOp: 'SDP',
            reqDate: createRequestDate(),
            reqNo: createRequestNo(),
            usage: 'cam',
            roomId: user.room,
            userId: user.id,
            sdp: await createP2pVideoOffer()
        })
    } catch (err) {
        console.error(err)
    }
}
const rejectVideoCall = () => {
    dispatch({
        type: CALL_REJECT
    })

    Ktalk.sendMessage({
        eventOp: 'Invite',
        status: 'reject',
        roomId: getState().user.room
    })

    Ktalk.sendMessage({
        eventOp: 'Join',
        status: 'reject',
        roomId: getState().user.room,
        reqDate: createRequestDate(),
        reqNo: createRequestNo(),
        userId: getState().user.id
    })
}

const stopVideoCall = () => {
    const { user, p2pVideoPeer } = getState()
    setUser({
        room: ''
    })
    dispatch({
        type: CALL_STOP_REQUEST
    })
    Ktalk.sendMessage({
        eventOp: 'ExitRoom',
        roomId: user.room,
        reqDate: createRequestDate(),
        reqNo: createRequestNo(),
        userId: user.id,
        userName: user.id
    })

    clearVideoStream(p2pVideoPeer.localStream)
    clearVideoStream(p2pVideoPeer.remoteStream)
}

const clearVideoStream = stream => {
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

module.exports = {
    createP2pVideoOffer,
    createP2pVideoAnswer,
    p2pVideoConnectDone,
    setP2pVideoCandidate,
    startVideoCall,
    acceptVideoCall,
    rejectVideoCall,
    clearVideoStream,
    stopVideoCall
}
