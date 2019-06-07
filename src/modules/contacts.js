const { createRequestDate, createRequestNo } = require('../helpers/request')

export const get = () => {
    Ktalk.sendMessage({
        eventOp: 'MemberList',
        reqNo: createRequestNo(),
        reqDate: createRequestDate(),
        type: 'friend',
        status: 'all',
        option: {
            limit: 8,
            offset: 1
        }
    })
}
