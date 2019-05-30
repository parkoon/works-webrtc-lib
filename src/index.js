// const io = require('socket.io-client')

const socket = require('./socket')()
const { state, getState, setUser, setPeer } = require('./store')
const { EVENT_NAME } = require('./constants/socket')

window.ktalk = {}

window.ktalk.getState = getState
window.ktalk.user = require('./user')
window.ktalk.socketListener = document.createElement('div')

// Handle Video
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
        const { localVideo, remoteVideo, onicecandidate, type } = option
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

                peer.onicecandidate = onicecandidate

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

        resolve()

        // Call을 날려야함!

        // el.src = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    })
}

window.ktalk.setUserMedia = setUserMedia

// Handle request data
window.ktalk.createRequestDate = require('./helpers/request').createRequestDate
window.ktalk.createRequestNo = require('./helpers/request').createRequestNo

// Password encryption
window.ktalk.encryption = require('./helpers/encryption')

// Send socket message
window.ktalk.sendMessage = message => {
    console.log('[SEND]', message)

    socket.emit('knowledgetalk', message)
}

// Create offer SDP
window.ktalk.createOffer = () => {
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
window.ktalk.createAnswer = offer => {
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
window.ktalk.p2pVideoConnectDone = answer => {
    const { peer } = getState()
    peer.instance.setRemoteDescription(answer)
}

// Set candidate
window.ktalk.setCandidate = candidate => {
    const { peer } = getState()
    if (candidate) {
        peer.instance.addIceCandidate(new RTCIceCandidate(candidate))
    }
}
