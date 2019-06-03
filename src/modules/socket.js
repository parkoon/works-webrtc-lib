const io = require('socket.io-client')
const CustomEvent = require('custom-event')
const { setUser } = require('../store')
const dispatch = require('../helpers/event')

// actions
const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
const LOGIN_FAILURE = 'LOGIN_FAILURE'

module.exports = () => {
    const endpoint = 'https://knowledgetalk.co.kr:9000/SignalServer'
    const option = {
        secure: true,
        reconnect: true,
        rejectUnauthorized: false,
        transports: ['websocket']
    }

    socket = io(endpoint, option)

    socket.sendMessage = data => {
        console.log('[SEND]', data)
        socket.emit('knowledgetalk', data)
    }

    socket.on('connect', () => {
        console.log('소켓 연결 성공')
    })

    socket.on('error', err => {
        console.log('소켓 연결 실패', err)
    })
    socket.on('disconnect', () => {
        console.log('소켓 연결 끊킴', socket)
    })

    socket.on('knowledgetalk', async data => {
        console.log('[RECEIVE]', data)
        const { eventOp, code, message } = data
        switch (eventOp) {
            case 'Login': {
                if (code === '200') {
                    const user = {
                        id: data.userId,
                        name: data.userName
                    }
                    setUser(user)

                    return dispatch({
                        type: LOGIN_SUCCESS,
                        payload: {
                            user
                        }
                    })
                } else {
                    return dispatch({
                        type: LOGIN_FAILURE,
                        payload: {
                            message
                        }
                    })
                }
            }

            case 'Call': {
                if (code === '200') {
                    setUser({
                        room: data.roomId
                    })

                    break
                }
            }

            case 'Invite': {
                if (data.roomId) {
                    setUser({
                        room: data.roomId
                    })
                }

                if (data.userId) {
                    setUser({
                        target: data.userId
                    })
                }

                ktalk.sendMessage({
                    eventOp: 'Invite',
                    status: 'accept',
                    roomId: ktalk.getState().user.room
                })
                ktalk.sendMessage({
                    eventOp: 'Join',
                    status: 'accept',
                    roomId: ktalk.getState().user.room,
                    reqDate: ktalk.createRequestDate(),
                    reqNo: ktalk.createRequestNo(),
                    userId: ktalk.getState().user.id
                })

                await ktalk.setUserMedia({
                    type: 'caller',
                    localVideo: document.querySelector('#local'),
                    remoteVideo: document.querySelector('#remote')
                })

                const offer = await ktalk.createOffer()
                ktalk.sendMessage({
                    eventOp: 'SDP',
                    reqDate: ktalk.createRequestDate(),
                    reqNo: ktalk.createRequestNo(),
                    usage: 'cam',
                    roomId: ktalk.getState().user.room,
                    sdp: offer
                })
            }

            case 'SDP': {
                if (data.sdp && data.sdp.type === 'offer') {
                    const answer = await ktalk.createAnswer(data.sdp) // offer 전달
                    ktalk.sendMessage({
                        eventOp: 'SDP',
                        reqDate: ktalk.createRequestDate(),
                        reqNo: ktalk.createRequestNo(),
                        usage: 'cam',
                        roomId: ktalk.getState().user.room,
                        sdp: answer
                    })
                } else if (data.sdp && data.sdp.type === 'answer') {
                    ktalk.p2pVideoConnectDone(data.sdp) // Answer를 보내라
                }
            }

            case 'Candidate': {
                if (data.candidate) {
                    ktalk.setCandidate(data.candidate)
                }
            }
        }
        // const event = new CustomEvent('ktalkevent', {
        //     detail: {
        //         data: {
        //             ...data
        //         }
        //     }
        // })
        // window.ktalk.listener.dispatchEvent(event)
    })

    return socket
}
