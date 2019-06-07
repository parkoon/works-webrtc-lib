const io = require('socket.io-client')
const CustomEvent = require('custom-event')
const { setUser, getState, setP2pScreenPeer, setLoading, setP2pVideoPeer } = require('../store')
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

const { drawing, setPenColor, setPenThickness, erasing, setEraserSize } = require('../modules/canvas')

const {
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    CALL_FAILURE,
    CALL_RECEIVE,
    CALL_REJECT,
    CALL_ACCEPT,
    CALL_STOP_SUCCESS,
    CALL_STOP_FAILURE,
    SCREEN_REQUEST,
    SHARE_FAILURE,
    SCREEN_RECEIVE,
    SCREEN_STOP_SUCCESS,
    SCREEN_STOP_FAILURE,
    FILE_SHARE_FAILURE,
    FILE_SHARE_SUCCESS,
    FILE_SHARE_RECEIVE,
    DRAWING,
    ERASERING
} = require('../constants/actions')

const { endpoint, option } = require('../constants/socket')

module.exports = () => {
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
                // call success
                if (code === '200') {
                    return setUser({
                        room: data.roomId
                    })
                }

                // target을 찾을 수 없음
                if (code === '561') {
                    /**
                     * 1. call loading 풀어주기
                     * 2. local stream 제거
                     * 3. p2p video peer state 초기화
                     * 4. target 초기화
                     */
                    const { user } = getState()
                    setUser({ target: '' })
                    clearVideoStream(getState().p2pVideoPeer.localStream)
                    setP2pVideoPeer({
                        instance: '',
                        localStream: '',
                        remoteStream: ''
                    })
                    return dispatch({
                        type: CALL_FAILURE,
                        payload: {
                            message: `cannot find tartget(${user.target})`
                        }
                    })
                }

                return
            }

            case 'Presence': {
                const { action } = data
                if (action === 'join') {
                    return dispatch({
                        type: CALL_ACCEPT,
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

                if (action === 'end' || action === 'exit') {
                    const { p2pVideoPeer, user } = getState()
                    clearVideoStream(p2pVideoPeer.localStream)
                    clearVideoStream(p2pVideoPeer.remoteStream)

                    setUser({
                        room: ''
                    })

                    return Ktalk.sendMessage({
                        eventOp: 'ExitRoom',
                        roomId: user.room,
                        reqDate: createRequestDate(),
                        reqNo: createRequestNo(),
                        userId: user.id,
                        userName: user.id
                    })
                }

                return
            }

            case 'Invite': {
                /**
                 * 1. set state
                 * 2. CALL_RECEIVE 액션을 보내고, 라이브러리 사용자는 수락(acceptVideoCall) 또는 거절(rejectVideoCall)
                 */
                setUser({
                    target: data.userId,
                    room: data.roomId
                })
                return dispatch({
                    type: CALL_RECEIVE,
                    payload: {
                        target: data.userId
                    }
                })
            }

            case 'SDP': {
                const { sdp, usage } = data
                const { user } = getState()

                if (usage === 'cam' && sdp && sdp.type === 'offer') {
                    Ktalk.sendMessage({
                        eventOp: 'SDP',
                        reqDate: createRequestDate(),
                        reqNo: createRequestNo(),
                        usage: 'cam',
                        roomId: user.room,
                        userId: user.id,
                        sdp: await createP2pVideoAnswer(sdp)
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
                        type: SCREEN_RECEIVE,
                        payload: {
                            tartget: user.target
                        }
                    })

                    // offer를 처리하는 시점이 맞지 않아, window 객체에 임시로 할당
                    // 사용하고 지움
                    window.__screen__offer = sdp
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
                if (code === '440') {
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
                        const { user } = getState()

                        // create peer
                        const peer = await setScreenPeerConnection(stream)
                        setP2pScreenPeer({
                            instance: peer,
                            stream
                        })

                        // create offer
                        const offer = await createP2pScreenOffer()

                        // send offer
                        return Ktalk.sendMessage({
                            eventOp: 'SDP',
                            reqDate: createRequestDate(),
                            reqNo: createRequestNo(),
                            usage: 'screen',
                            roomId: user.room,
                            userId: user.id,
                            sdp: offer
                        })
                    } catch (err) {
                        console.error(err)
                    }
                }
                return
            }

            case 'ScreenShareConferenceEnd': {
                if (code === '200') {
                    dispatch({
                        type: SCREEN_STOP_SUCCESS
                    })
                } else {
                    dispatch({
                        type: SCREEN_STOP_FAILURE
                    })
                }
                return
            }

            case 'ScreenShareConferenceEndSvr': {
                dispatch({
                    type: SCREEN_STOP_SUCCESS,
                    target: data.userId
                })
                clearScreenStream(getState().p2pScreenPeer.stream)
                return
            }

            case 'ExitRoom': {
                if (code === '200') {
                    setP2pVideoPeer({
                        instance: '',
                        localStream: '',
                        remoteStream: ''
                    })
                    return dispatch({
                        type: CALL_STOP_SUCCESS
                    })
                } else {
                    return dispatch({
                        type: CALL_STOP_FAILURE,
                        payload: {
                            message: 'start video call first'
                        }
                    })
                }
            }
            case 'FileShareStart': {
                if (code === '200') {
                    return dispatch({
                        type: FILE_SHARE_SUCCESS
                    })
                }
                if (code === '481') {
                    // TODO: 인증되지 않은 사용자가 파일 업로드를 하면, 업로드 된 파일을 지워야 할텐데...
                    return dispatch({
                        type: FILE_SHARE_FAILURE,
                        payload: {
                            message: 'Unrecognized user, login first'
                        }
                    })
                }

                return
            }

            // case 'FileShareStartSvr': {
            //     return dispatch({
            //         type: FILE_SHARE_RECEIVE,
            //         payload: {
            //             sender: data.urserId,
            //             files: data.fileInfoList
            //         }
            //     })

            //     return
            // }

            case 'Draw': {
                const { axisX, axisY, status } = data
                return drawing({ x: axisX, y: axisY, status })
            }

            case 'Erase': {
                const { axisX, axisY, status } = data
                return erasing({ x: axisX, y: axisY, status })
            }

            case 'EraserSize': {
                const { eraserSize } = data
                return setEraserSize(eraserSize, true)
            }

            case 'Color': {
                const { color } = data
                return setPenColor(color, true)
            }

            case 'LineSize': {
                const { lineSize } = data
                return setPenThickness(lineSize, true)
            }

            case 'FileShare': {
                if (code === '481') {
                    return dispatch({
                        type: FILE_SHARE_FAILURE,
                        payload: {
                            message: 'Unrecognized user, login first'
                        }
                    })
                }
            }

            case 'FileShareSvr': {
                return dispatch({
                    type: FILE_SHARE_RECEIVE,
                    payload: {
                        sender: data.urserId,
                        url: data.fileUrl
                    }
                })
            }
        }

        // const event = new CustomEvent('ktalkevent', {
        //     detail: {
        //         data: {
        //             ...data
        //         }
        //     }
        // })
        // window.Ktalk.listener.dispatchEvent(event)
    })

    return socket
}
