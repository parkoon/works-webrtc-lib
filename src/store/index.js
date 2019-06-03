export let state = {
    user: {
        id: '',
        name: '',
        room: '',
        target: ''
    },
    p2pVideoPeer: {
        instance: '',
        localStream: '',
        remoteStream: ''
    },
    p2pScreenPeer: {
        instance: '',
        stream: ''
    }
}

export const setUser = user => {
    state = {
        user: {
            ...state.user,
            ...user
        },
        p2pVideoPeer: {
            ...state.p2pVideoPeer
        },
        p2pScreenPeer: {
            ...state.p2pScreenPeer
        }
    }
    console.log('[STATE UPDATE]', state)
}

export const setP2pVideoPeer = peer => {
    state = {
        user: {
            ...state.user
        },
        p2pVideoPeer: {
            ...state.p2pVideoPeer,
            ...peer
        },
        p2pScreenPeer: {
            ...state.p2pScreenPeer
        }
    }
    console.log('[STATE UPDATE]', state)
}

export const setP2pScreenPeer = peer => {
    state = {
        user: {
            ...state.user
        },
        p2pScreenPeer: {
            ...state.p2pScreenPeer,
            ...peer
        },
        p2pVideoPeer: {
            ...state.p2pVideoPeer
        }
    }
    console.log('[STATE UPDATE]', state)
}

export const getState = () => {
    return state
}
