const io = require('socket.io-client')
const CustomEvent = require('custom-event')
const { setUser, getState } = require('../store')
const dispatch = require('../helpers/event')
const { createRequestNo, createRequestDate } = require('../helpers/request')
const { createP2pVideoAnswer, p2pVideoConnectDone, setP2pVideoCandidate } = require('../modules/p2p-video')
const { captureScreen } = require('../modules/p2p-screen')

// actions
const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
const LOGIN_FAILURE = 'LOGIN_FAILURE'

const CALL_FAILURE = 'CALL_FAILURE'
const CALL_SUCCESS = 'CALL_SUCCESS'
const CALL_RECEIVE = 'CALL_RECEIVE'
const CALL_REJECT = 'CALL_REJECT'

const SESSION_RESERVED = 'SESSION_RESERVED'
const SHARE_FAILURE = 'SHARE_FAILURE'

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
        const { eventOp, signalOp, code, message } = data
        switch (eventOp || signalOp) {
            /**
             * 로그인 처리
             * 성공 / 실패
             */
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

            /**
             * P2P 비디오
             */
            case 'Call': {
                if (code === '200') {
                    return setUser({
                        room: data.roomId
                    })
                } else {
                    return dispatch({
                        type: CALL_FAILURE,
                        payload: {
                            message
                        }
                    })
                }
            }

            case 'Presence': {
                const { action } = data
                if (action === 'join') {
                    return dispatch({
                        type: CALL_SUCCESS,
                        payload: {
                            target: data.userId
                        }
                    })
                }

                if (action === 'reject') {
                    return dispatch({
                        type: CALL_REJECT,
                        payload: {
                            target: data.userId
                        }
                    })
                }

                return
            }

            case 'Invite': {
                setUser({
                    target: data.userId,
                    room: data.roomId
                })
                return dispatch({
                    type: CALL_RECEIVE,
                    payload: {
                        target: data.userId,
                        room: data.roomId
                    }
                })
            }

            case 'SDP': {
                const { sdp, usage } = data
                if (usage === 'cam' && sdp && sdp.type === 'offer') {
                    const answer = await createP2pVideoAnswer(sdp) // offer 전달
                    ktalk.sendMessage({
                        eventOp: 'SDP',
                        reqDate: createRequestDate(),
                        reqNo: createRequestNo(),
                        usage: 'cam',
                        roomId: getState().user.room,
                        sdp: answer
                    })
                    return
                }
                if (usage === 'cam' && sdp && sdp.type === 'answer') {
                    p2pVideoConnectDone(sdp) // Answer를 보내라
                    return
                }

                if (data.usage === 'screen') {
                    return
                }
            }

            case 'Candidate': {
                if (data.candidate) {
                    setP2pVideoCandidate(data.candidate)
                }
                return
            }

            case 'SessionReserve': {
                if (code === '481') {
                    return dispatch({
                        type: SHARE_FAILURE,
                        payload: {
                            message: 'connect video p2p first'
                        }
                    })
                }

                CQR

                if (code === '200') {
                    /**
                     * 1. session reserve ok (sender)
                     * 2. capture screen stream (sender)
                     * 3. create peer (sender)
                     * 4. add stream to peer (sender)
                     * 5. create and send offer sdp (sender)
                     * 6. create peer (receiver)
                     * 7. set offer sdp (receiver)
                     * 8. create and send answer sdp (receiver)
                     */
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
