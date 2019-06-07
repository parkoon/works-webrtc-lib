// 라이브러리 사용자에게 메세지 보내는 용도
const dispatch = action => {
    const event = new CustomEvent('ktalk', {
        detail: {
            type: action.type,
            payload: action.payload || ''
        }
    })
    Ktalk.IO.dispatchEvent(event)
}

module.exports = dispatch
