const { setPeer, getState } = require('../store')

/**
 *
 * @param {Object} option
 * @param {Element} option.localVideo // required
 * @param {Element} option.remoteVideo // required
 * @param {String} option.type // required
 * @param {Function} option.onicecnadidate // required
 */
function setUserMedia(option) {
    return new Promise(async (resolve, reject) => {
        const { localVideo, remoteVideo, type } = option
        const configuration = {
            iceServers: [{ url: 'stun:stun2.1.google.com:19302' }]
        }
        console.log(`Call type is... ${type}`)
        console.log(`Call option is... ${option}`)

        // Handle caller
        if (type === 'caller') {
            try {
                const peer = new RTCPeerConnection(this.configuration)

                peer.onaddstream = ({ stream }) => {
                    remoteVideo.srcObject = stream
                    // alert('!!')
                }

                peer.onicecandidate = e => {
                    if (e.candidate) {
                        ktalk.sendMessage({
                            eventOp: 'Candidate',
                            reqDate: ktalk.createRequestDate(),
                            reqNo: ktalk.createRequestNo(),
                            usage: 'cam',
                            roomId: ktalk.getState().user.room,
                            userId: ktalk.getState().user.id,
                            candidate: e.candidate
                        })
                    }
                }

                const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                peer.addStream(localStream)
                localVideo.srcObject = localStream

                setPeer({
                    instance: peer,
                    localStream
                })
            } catch (err) {
                console.log('Error in setUserMedia', err)
                reject(err)
            }
        }
        // Handle callee
        else if (type === 'callee') {
        } else {
            reject('type field required')
        }

        ktalk.sendMessage({
            eventOp: 'Call',
            userId: 't1',
            targetId: ['t2'],
            serviceType: 'multi',
            reqDeviceType: 'pc',
            reqDate: ktalk.createRequestDate(),
            reqNo: ktalk.createRequestNo()
        })
        resolve()

        // Call을 날려야함!

        // el.src = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    })
}

// Create offer SDP
const createOffer = () => {
    return new Promise(async (resolve, reject) => {
        const { peer } = getState()
        try {
            const offer = await peer.instance.createOffer()
            peer.instance.setLocalDescription(offer)

            resolve(offer)
        } catch (err) {
            reject(err)
        }
    })
}

// Crate answer SDP
const createAnswer = offer => {
    return new Promise(async (resolve, reject) => {
        const { peer } = getState()

        try {
            peer.instance.setRemoteDescription(offer)
            const answer = await peer.instance.createAnswer()
            peer.instance.setLocalDescription(answer)
            resolve(answer)
        } catch (err) {
            reject(err)
        }
    })
}

// Done
const p2pVideoConnectDone = answer => {
    const { peer } = getState()
    peer.instance.setRemoteDescription(answer)
}

// Set candidate
const setCandidate = candidate => {
    const { peer } = getState()
    if (candidate) {
        peer.instance.addIceCandidate(new RTCIceCandidate(candidate))
    }
}

module.exports = {
    createOffer,
    createAnswer,
    p2pVideoConnectDone,
    setCandidate,
    setUserMedia
}
