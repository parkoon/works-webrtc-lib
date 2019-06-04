const io = require('socket.io-client')
const CustomEvent = require('custom-event')
const { setUser, getState, setP2pScreenPeer } = require('../store')
const dispatch = require('../helpers/event')
const { createRequestNo, createRequestDate } = require('../helpers/request')
const {
    createP2pVideoAnswer,
    p2pVideoConnectDone,
    setP2pVideoCandidate,
    clearVideoStream
} = require('../modules/p2p-video')
const {
    captureScreen,
    setScreenPeerConnection,
    createP2pScreenAnswer,
    createP2pScreenOffer,
    p2pScreenConnectDone,
    setP2pScreenCandidate,
    clearScreenStream
} = require('../modules/p2p-screen')

// actions
const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
const LOGIN_FAILURE = 'LOGIN_FAILURE'

const CALL_FAILURE = 'CALL_FAILURE'
const CALL_SUCCESS = 'CALL_SUCCESS'
const CALL_RECEIVE = 'CALL_RECEIVE'
const CALL_REJECT = 'CALL_REJECT'
const CALL_STOP = 'CALL_STOP'

const SESSION_RESERVED = 'SESSION_RESERVED'
const SHARE_FAILURE = 'SHARE_FAILURE'

const SCREEN_SHARE_START = 'SCREEN_SHARE_START'
const SCREEN_SHARE_STOP = 'SCREEN_SHARE_STOP'

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
        // console.log('[SEND]', data)
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
        // console.log('[RECEIVE]', data)
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

                if (action === 'end') {
                    const { p2pVideoPeer } = getState()
                    clearVideoStream(p2pVideoPeer.localStream)
                    clearVideoStream(p2pVideoPeer.remoteStream)
                    return dispatch({
                        type: CALL_STOP
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

                if (data.usage === 'screen' && sdp && sdp.type === 'offer') {
                    // create peer (receiver)
                    dispatch({
                        type: SCREEN_SHARE_START,
                        payload: {
                            tartget: getState().user.target
                        }
                    })

                    try {
                        const peer = await setScreenPeerConnection()

                        setP2pScreenPeer({
                            instance: peer
                        })

                        // set offer sdp (receiver)
                        // create and send answer sdp (receiver)
                        const answer = await createP2pScreenAnswer(sdp)

                        return ktalk.sendMessage({
                            eventOp: 'SDP',
                            reqDate: createRequestDate(),
                            reqNo: createRequestNo(),
                            usage: 'screen',
                            roomId: getState().user.room,
                            sdp: answer
                        })
                    } catch (err) {
                        console.error(err)
                    }
                    return
                }

                if (usage === 'screen' && sdp && sdp.type === 'answer') {
                    p2pScreenConnectDone(sdp) // Answer를 보내라
                    return
                }
            }

            case 'Candidate': {
                const { candidate, usage } = data
                if (usage === 'cam' && candidate) {
                    setP2pVideoCandidate(candidate)
                } else if (usage === 'screen' && candidate) {
                    setP2pScreenCandidate(candidate)
                }
                return
            }

            case 'SessionReserve': {
                // 비디오 먼저 연결되어야 함
                if (code === '481') {
                    return dispatch({
                        type: SHARE_FAILURE,
                        payload: {
                            message: 'connect video p2p first'
                        }
                    })
                }
                // 상대방이 공유 자원을 사용하고 있음
                if (code === '441') {
                    return dispatch({
                        type: SHARE_FAILURE,
                        payload: {
                            message: 'share session already reserved'
                        }
                    })
                }

                // 세션 사용할 수 있음
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
                     * 9. exchange candidate (sender & receiver)
                     */

                    try {
                        // capture screen stream
                        const stream = await captureScreen()

                        // create peer
                        const peer = await setScreenPeerConnection(stream)
                        setP2pScreenPeer({
                            instance: peer,
                            stream
                        })

                        // create offer
                        const offer = await createP2pScreenOffer()

                        // send offer
                        return ktalk.sendMessage({
                            eventOp: 'SDP',
                            reqDate: createRequestDate(),
                            reqNo: createRequestNo(),
                            usage: 'screen',
                            roomId: getState().user.room,
                            sdp: offer
                        })
                    } catch (err) {
                        console.error(err)
                    }
                }
                return
            }
            case 'ScreenShareConferenceEndSvr': {
                dispatch({
                    type: 'SCREEN_SHARE_STOP',
                    target: data.userId
                })
                clearScreenStream(getState().p2pScreenPeer.stream)
                return
            }

            case 'ExitRoom': {
                return
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
