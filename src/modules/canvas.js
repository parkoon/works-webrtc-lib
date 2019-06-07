import { CHANGE_TOOL_TYPE, CHANGE_ERASER_SIZE, ERASERING } from '../constants/actions'

const dispatch = require('../helpers/event')
const { DRAWING, CHANGE_PEN_COLOR, CHANGE_PEN_THICKNESS } = require('../constants/actions')

let __kp__canvas = ''
let __kp__context = ''
let __kp__state__isMouseDown = false
let __kp__posX
let __kp__posY
let __kp__color = '#212121'
let __kp__thickness = 7
let __kp__eraser__size = 7
let __kp__tool = 'pen'

const initCanvasContext = () => {}

const useErase = () => {}

const handleMouseDown = e => {
    __kp__state__isMouseDown = true
    __kp__context.beginPath()

    const { width, height } = __kp__canvas

    if (__kp__tool === 'pen') {
        Ktalk.sendMessage({
            signalOp: 'Draw',
            axisX: __kp__posX / width,
            axisY: __kp__posY / height,
            type: 'document',
            status: 'start'
        })
    } else if (__kp__tool === 'eraser') {
        Ktalk.sendMessage({
            signalOp: 'Erase',
            axisX: __kp__posX / width,
            axisY: __kp__posY / height,
            type: 'document',
            status: 'start'
        })
    }
}
const handleMouseUp = e => {
    // __kp__context.closePath()

    if (__kp__state__isMouseDown) {
        __kp__state__isMouseDown = false
        const { width, height } = __kp__canvas

        if (__kp__tool === 'pen') {
            Ktalk.sendMessage({
                signalOp: 'Draw',
                axisX: __kp__posX / width,
                axisY: __kp__posY / height,
                type: 'document',
                status: 'end'
            })
        } else if (__kp__tool === 'eraser') {
            Ktalk.sendMessage({
                signalOp: 'Erase',
                axisX: __kp__posX / width,
                axisY: __kp__posY / height,
                type: 'document',
                status: 'end'
            })
        }
    }
}

export const drawing = option => {
    // 받는 사람은 마우스 이벤트 상관 없이 그려야해
    const { x, y, status } = option
    const { width, height } = __kp__canvas

    __kp__context.strokeStyle = __kp__color
    __kp__context.lineWidth = __kp__thickness
    __kp__context.globalCompositeOperation = 'source-over'

    if (status === 'start') {
        return __kp__context.beginPath()
    }

    if (status === 'move') {
        __kp__context.lineTo(x * width, y * height)
        __kp__context.stroke()
        return
    }

    if (status === 'end') {
        return __kp__context.closePath()
    }
}

export const erasing = option => {
    const { x, y, status } = option
    const { width, height } = __kp__canvas

    __kp__context.globalCompositeOperation = 'destination-out'
    __kp__context.lineWidth = __kp__eraser__size

    if (status === 'start') {
        __kp__context.beginPath()
    }

    if (status === 'move') {
        __kp__context.lineTo(x * width, y * height)
        __kp__context.stroke()
    }

    if (status === 'end') {
        return __kp__context.closePath()
    }
}

export const setEraserSize = (size, receiver) => {
    __kp__eraser__size = size
    dispatch({
        type: CHANGE_ERASER_SIZE,
        payload: {
            size
        }
    })

    if (receiver) return

    Ktalk.sendMessage({
        signalOp: 'EraserSize',
        reqNo: 12,
        eraserSize: size
    })
}

export const setWhiteboardTool = type => {
    dispatch({
        type: CHANGE_TOOL_TYPE,
        payload: {
            type
        }
    })

    if (type === 'pen') {
        __kp__tool = 'pen'
    }

    if (type === 'eraser') {
        __kp__tool = 'eraser'
    }
}

export const setPenColor = (color, receiver) => {
    dispatch({
        type: CHANGE_PEN_COLOR,
        payload: {
            color
        }
    })

    __kp__color = color

    if (receiver) return

    Ktalk.sendMessage({
        signalOp: 'Color',
        reqNo: 12,
        color
    })
}

export const setPenThickness = (thickness, receiver) => {
    dispatch({
        type: CHANGE_PEN_THICKNESS,
        payload: {
            thickness
        }
    })

    __kp__thickness = thickness

    if (receiver) return

    Ktalk.sendMessage({
        signalOp: 'LineSize',
        reqNo: 12,
        lineSize: thickness
    })
}

export const handleMouseMove = ({ clientX, clientY }) => {
    // 받는 사람은 마우스 이벤트 상관 없이 그려야해

    if (!__kp__state__isMouseDown) return

    const { x, y } = __kp__canvas.getBoundingClientRect()
    __kp__posX = clientX - x
    __kp__posY = clientY - y

    const { width, height } = __kp__canvas

    if (__kp__tool === 'pen') {
        __kp__context.strokeStyle = __kp__color
        __kp__context.lineWidth = __kp__thickness
        __kp__context.globalCompositeOperation = 'source-over'
        __kp__context.lineTo(__kp__posX, __kp__posY)
        __kp__context.stroke()

        dispatch({
            type: DRAWING,
            payload: {
                pos: {
                    x: __kp__posX,
                    y: __kp__posY
                }
            }
        })

        Ktalk.sendMessage({
            signalOp: 'Draw',
            axisX: __kp__posX / width,
            axisY: __kp__posY / height,
            type: 'document',
            status: 'move'
        })
    } else if (__kp__tool === 'eraser') {
        __kp__context.globalCompositeOperation = 'destination-out'
        __kp__context.lineWidth = __kp__eraser__size
        __kp__context.lineTo(__kp__posX, __kp__posY)
        __kp__context.stroke()

        dispatch({
            type: ERASERING,
            payload: {
                pos: {
                    x: __kp__posX,
                    y: __kp__posY
                }
            }
        })

        Ktalk.sendMessage({
            signalOp: 'Erase',
            axisX: __kp__posX / width,
            axisY: __kp__posY / height,
            type: 'document',
            status: 'move'
        })
    }
}

export const blockDrawing = () => {
    __kp__canvas.removeEventListener('mousedown', handleMouseDown)
    __kp__canvas.removeEventListener('mousemove', handleMouseMove)
    __kp__canvas.removeEventListener('mouseup', handleMouseUp)
    __kp__canvas.removeEventListener('mouseout', handleMouseUp)
}

export const releaseDrawing = () => {
    __kp__canvas.addEventListener('mousedown', handleMouseDown)
    __kp__canvas.addEventListener('mousemove', handleMouseMove)
    __kp__canvas.addEventListener('mouseup', handleMouseUp)
    __kp__canvas.addEventListener('mouseout', handleMouseUp)
}

export const createCanvas = (w, h) => {
    const canvas = document.createElement('canvas')
    const div = document.createElement('div')

    div.setAttribute('class', 'ktalk-whiteboard')
    div.style.cssText = `
        position: relative;
    `

    __kp__canvas = canvas

    canvas.style.cssText = `
        background: transparent;
        border: 1px solid #dbdbdb
    `

    canvas.width = w || 1280
    canvas.height = h || 720

    __kp__context = canvas.getContext('2d')
    __kp__context.lineJoin = 'round'
    __kp__context.lineCap = 'round'

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseout', handleMouseUp)

    div.appendChild(canvas)

    return div
}
