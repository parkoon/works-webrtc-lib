## Handler

Ktalk.listener.addEventListener('ktalk', 핸들러)

1. CALL_RECEIVE

## 로그인

Ktalk.login(user)
user
{
id, // 사용자 아이디
passowrd // 사용자 비밀번호
}

## 로그아웃

Ktalk.logout()

## 1:1 연결 (로그인 선행 필요)

// caller
Ktalk.startVideoCall(options)
options
{
target // 상대방 아이디
localVideo // 내 영상 화면
remoteVideo // 상대방 영상 화면
}

// callee
ktalk 이벤트에서
CALL_RECEIVE
Ktalk.acceptVideoCall(options)
{
localVideo // 내 영상 화면
remoteVideo // 상대방 영상 화면
}
Ktalk.rejectVideoCall()
