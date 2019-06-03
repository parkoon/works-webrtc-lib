const { setP2pVideoPeer, getState, setUser } = require('../store')
const { createRequestDate, createRequestNo } = require('../helpers/request')

/**
 *
 * @param {Object} option
 * @param {Element} option.localVideo // required
 * @param {Element} option.remoteVideo // required
 * @param {String} option.type // required
 * @param {Function} option.onicecnadidate // required
 */
const sendVideoCall = async option => {
    const { localVideo, remoteVideo } = option

    try {
        await setUserMedia(localVideo, remoteVideo)

        setUser({
            target: 't2'
        })

        ktalk.sendMessage({
            eventOp: 'Call',
            userId: 't1',
            targetId: ['t2'],
            serviceType: 'multi',
            reqDeviceType: 'pc',
            reqDate: createRequestDate(),
            reqNo: createRequestNo()
        })
    } catch (err) {
        console.error(err)
    }
}

const setUserMedia = (localVideo, remoteVideo) => {
    return new Promise(async (resolve, reject) => {
        const configuration = {
            iceServers: [{ url: 'stun:stun2.1.google.com:19302' }]
        }

        // Handle caller
        try {
            const peer = new RTCPeerConnection(configuration)

            peer.onaddstream = ({ stream }) => {
                remoteVideo.srcObject = stream
            }

            peer.onicecandidate = e => {
                if (e.candidate) {
                    ktalk.sendMessage({
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

            const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            peer.addStream(localStream)
            localVideo.srcObject = localStream

            setP2pVideoPeer({
                instance: peer,
                localStream
            })

            resolve()
        } catch (err) {
            console.log('Error in sendVideoCall', err)

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
    ktalk.sendMessage({
        eventOp: 'Invite',
        status: 'accept',
        roomId: getState().user.room
    })

    ktalk.sendMessage({
        eventOp: 'Join',
        status: 'accept',
        roomId: getState().user.room,
        reqDate: createRequestDate(),
        reqNo: createRequestNo(),
        userId: getState().user.id
    })

    try {
        await setUserMedia(localVideo, remoteVideo)
    } catch (err) {
        console.error(err)
    }

    const offer = await createP2pVideoOffer()
    ktalk.sendMessage({
        eventOp: 'SDP',
        reqDate: createRequestDate(),
        reqNo: createRequestNo(),
        usage: 'cam',
        roomId: getState().user.room,
        sdp: offer
    })
}
const rejectVideoCall = () => {
    ktalk.sendMessage({
        eventOp: 'Invite',
        status: 'reject',
        roomId: getState().user.room
    })

    ktalk.sendMessage({
        eventOp: 'Join',
        status: 'reject',
        roomId: getState().user.room,
        reqDate: createRequestDate(),
        reqNo: createRequestNo(),
        userId: getState().user.id
    })
}

module.exports = {
    createP2pVideoOffer,
    createP2pVideoAnswer,
    p2pVideoConnectDone,
    setP2pVideoCandidate,
    sendVideoCall,
    acceptVideoCall,
    rejectVideoCall
}
