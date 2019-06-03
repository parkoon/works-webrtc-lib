const dispatch = action => {
    const event = new CustomEvent('ktalkevent', {
        detail: {
            type: action.type,
            payload: action.payload
        }
    })
    window.ktalk.listener.dispatchEvent(event)
}

module.exports = dispatch
