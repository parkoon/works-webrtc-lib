let requestNo = 1
function createRequestNo() {
    return requestNo++
}

function createRequestDate() {
    var today = new Date()
    var yyyy = today.getFullYear()
    var mm = today.getMonth() + 1
    var dd = today.getDate()

    if (mm < 10) {
        mm = '0' + mm
    }
    if (dd < 10) {
        dd = '0' + dd
    }

    return '' + yyyy + mm + dd
}

module.exports = {
    createRequestNo,
    createRequestDate
}
