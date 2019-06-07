import { calculateAspectRatioFit } from '../helpers/canvas'

const axios = require('axios')

const { UPLOAD_API } = require('../constants/file')
const dispatch = require('../helpers/event')
const { getState } = require('../store')
const { createRequestDate, createRequestNo } = require('../helpers/request')
const pdfjs = require('../helpers/pdf')

const {
    FILE_SHARE_REQUEST,
    FILE_SHARE_SUCCESS,
    FILE_SHARE_FAILURE,
    FILE_UPLOAD_SUCCESS,
    FILE_UPLOAD_FAILURE
} = require('../constants/actions')

const pdfRegExp = /([a-zA-Z0-9\s_\\.\-\(\):])+(.pdf)$/i
const vaildFileRegExp = /([a-zA-Z0-9\s_\\.\-\(\):])+(.jpg|.gif|.png|.pdf|.jpeg)$/i

const handleClick = el => {
    el.value = ''
}

const isVaildFile = ext => {
    return vaildFileRegExp.test(ext)
}

const isPDF = ext => {
    return pdfRegExp.test(ext)
}

const uploadPDF = pdf => {
    return new Promise(async (resolve, reject) => {
        try {
            const formData = new FormData()
            formData.append('kpupload', pdf)
            const { data } = await axios.post(UPLOAD_API, formData, {
                header: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            const pdfPath = data[0].url

            resolve(pdfPath)
        } catch (err) {
            reject(err)
        }
    })
}

const changePdfToImage = pdf => {
    return new Promise(async (resolve, reject) => {
        try {
            const PDFJs = new pdfjs()
            let result = await PDFJs.pdfToBlob(pdf)
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}

const handleChange = async ({ target }) => {
    dispatch({
        type: FILE_SHARE_REQUEST
    })

    try {
        const formData = new FormData()

        for (let i = 0; i < target.files.length; i++) {
            if (!isVaildFile(target.files[i].type)) {
                return dispatch({
                    type: FILE_SHARE_FAILURE,
                    payload: {
                        message: 'invaild file, valid file extention: .jpg .gif .png .jpeg .pdf'
                    }
                })
            }
            console.log('target.files[i].type', target.files[i].type)
            if (isPDF(target.files[i].type)) {
                /**
                 * 1. pdf를 서버에 업로드 한다.
                 * 2. upload한 file을 pdfjs 라이브러리를 이용해 이미지로 변환한다
                 * 3. 변환된 이미지를 다시 서버에 업로드 한다.
                 */
                try {
                    const pdf = await uploadPDF(target.files[i])
                    const result = await changePdfToImage(pdf)
                    result.data.forEach(pdf => {
                        formData.append('kpupload', pdf)
                    })
                } catch (err) {
                    console.error(err)
                }
            } else {
                formData.append('kpupload', target.files[i])
            }
        }

        const { data } = await axios.post(UPLOAD_API, formData, {
            header: {
                'Content-Type': 'multipart/form-data'
            }
        })
        console.log('========= LOG START =======')
        console.log(data)
        console.log('========= LOG END =========')

        dispatch({
            type: FILE_UPLOAD_SUCCESS,
            payload: {
                files: data
            }
        })

        dispatch({
            type: FILE_SHARE_REQUEST
        })

        const { user } = getState()

        Ktalk.sendMessage({
            eventOp: 'FileShareStart',
            userId: user.id,
            reqDate: createRequestDate(),
            reqNo: createRequestNo(),
            fileInfoList: [...data],
            roomId: user.room
        })
    } catch (err) {
        dispatch({
            type: FILE_UPLOAD_FAILURE,
            payload: {
                message: 'file server error'
            }
        })

        dispatch({
            type: FILE_SHARE_FAILURE,
            payload: {
                message: 'file server error'
            }
        })
    }
}

export const fileShareHandler = url => {
    if (!url) {
        return dispatch({
            type: FILE_SHARE_FAILURE,
            payload: {
                message: 'bind image element and pass url parameter'
            }
        })
    }

    Ktalk.sendMessage({
        eventOp: 'FileShare',
        reqDate: createRequestDate(),
        reqNo: createRequestNo(),
        roomId: getState().user.room,
        userId: getState().user.id,
        fileUrl: url
    })
}

export const createInput = () => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('name', 'kpupload')
    input.setAttribute('multiple', true)

    input.onclick = handleClick.bind(this, input)
    input.onchange = handleChange

    return input
}

export const imageMapping = (url, div, options) => {
    return new Promise(resolve => {
        const img = document.createElement('img')
        const { width = 1280, height = 720, fit = false } = options
        const canvas = document.createElement('canvas')

        canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            z-index: -999;
        `
        console.log('========= LOG START =======')
        console.log(width, height)
        console.log('========= LOG END =========')

        img.src = url
        img.addEventListener('load', () => {
            let ratio = calculateAspectRatioFit(img.naturalWidth, img.naturalHeight, width, height)

            let calculatedW = img.naturalWidth * ratio
            let calculatedH = img.naturalHeight * ratio

            const context = canvas.getContext('2d')

            canvas.width = calculatedW
            canvas.height = calculatedH

            // 이미지 캔버스와 드로잉 캔버스의 크기를 맞춤
            if (fit) {
                div.firstChild.width = calculatedW
                div.firstChild.height = calculatedH

                div.firstChild.getContext('2d').lineCap = 'round'
                div.firstChild.getContext('2d').lineJoin = 'round'
            }

            context.drawImage(img, 0, 0, calculatedW, calculatedH)

            div.appendChild(canvas)

            resolve(canvas)
        })
    })
}
