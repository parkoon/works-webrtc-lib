export const EVENT_NAME = 'knowledgepoint'
export const endpoint = 'https://knowledgetalk.co.kr:9000/SignalServer'
export const option = {
    secure: true,
    reconnect: true,
    rejectUnauthorized: false,
    transports: ['websocket']
}
