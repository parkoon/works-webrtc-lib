export const EVENT_NAME = 'knowledgepoint'
export const endpoint = 'https://knowledgetalk.co.kr:7511/SignalServer'
export const option = {
    secure: true,
    reconnect: true,
    rejectUnauthorized: false,
    transports: ['websocket']
}
