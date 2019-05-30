const io = require('socket.io-client')
const CustomEvent = require('custom-event')
const { setUser } = require('../store')

module.exports = () => {
    const endpoint = 'https://knowledgetalk.co.kr:9000/SignalServer'
    const option = {
        secure: true,
        reconnect: true,
        rejectUnauthorized: false,
        transports: ['websocket']
    }

    socket = io(endpoint, option)

    socket.on('connect', () => {
        console.log('소켓 연결 성공')
    })

    socket.on('error', err => {
        console.log('소켓 연결 실패', err)
    })
    socket.on('disconnect', () => {
        console.log('소켓 연결 끊킴', socket)
    })

    socket.on('knowledgetalk', message => {
        console.log('[RECEIVE]', message)
        const { eventOp, code } = message

        switch (eventOp) {
            case 'Login': {
                if (code === '200') {
                    setUser({
                        id: message.userId,
                        name: message.userName
                    })
                    break
                }
            }

            case 'Call': {
                if (code === '200') {
                    setUser({
                        room: message.roomId
                    })

                    break
                }
            }

            case 'Invite': {
                if (message.roomId) {
                    setUser({
                        room: message.roomId
                    })
                }

                if (message.userId) {
                    setUser({
                        target: message.userId
                    })
                }
            }
        }
        const event = new CustomEvent('ktalksocketevent', {
            detail: {
                message: {
                    ...message
                }
            }
        })
        window.ktalk.listener.dispatchEvent(event)
    })

    return socket
}
