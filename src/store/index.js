export let state = {
    user: {
        id: '',
        name: '',
        room: '',
        target: ''
    },
    peer: {
        instance: '',
        localStream: '',
        remoteStream: ''
    }
}

export const setUser = user => {
    state = {
        user: {
            ...state.user,
            ...user
        },
        peer: {
            ...state.peer
        }
    }
    console.log('[STATE UPDATE]', state)
}

export const setPeer = peer => {
    state = {
        user: {
            ...state.user
        },
        peer: {
            ...state.peer,
            ...peer
        }
    }
    console.log('[STATE UPDATE]', state)
}

export const getState = () => {
    return state
}
