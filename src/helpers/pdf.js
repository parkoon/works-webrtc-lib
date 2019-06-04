const pdfLib = require('pdfjs-dist')

class PdfJS {
    constructor() {
        pdfLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.943/pdf.worker.js'

        this.scale = 1.4
    }

    pdfToBlob(file) {
        return new Promise(async (resolve, reject) => {
            try {
                const pdf = await pdfLib.getDocument(file)

                const pages = pdf.numPages

                let idx = 1
                const chunks = []

                for (; idx <= pages; idx++) {
                    const page = await pdf.getPage(idx)
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    const viewport = page.getViewport(this.scale)

                    canvas.height = viewport.height
                    canvas.width = viewport.width

                    const renderContext = {
                        canvasContext: ctx,
                        viewport
                    }
                    const renderTask = page.render(renderContext)

                    renderTask.promise.then(() => {
                        canvas.toBlob(blob => {
                            chunks.push(blob)

                            if (chunks.length === pages) {
                                resolve({
                                    data: chunks,
                                    pageNum: pages
                                })
                            }
                        }, 'image/jpeg')
                    })
                }
            } catch (err) {
                reject(err)
            }
        })
    }
}

module.exports = PdfJS
