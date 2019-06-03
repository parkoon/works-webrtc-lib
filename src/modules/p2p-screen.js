const { getState, setP2pScreenPeer } = require('../store')
const { createRequestDate, createRequestNo } = require('../helpers/request')

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

const stopScreenShare = () => {}

module.exports = {
    startScreenShare,
    stopScreenShare,
    captureScreen
}
