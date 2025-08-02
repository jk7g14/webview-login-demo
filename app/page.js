'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [isWebView, setIsWebView] = useState(false)
  const [status, setStatus] = useState('대기 중...')

  useEffect(() => {
    setIsWebView(!!window.ReactNativeWebView)

    setStatus('🔄 메시지 리스너 등록됨')
    console.log('🔄 메시지 리스너 등록됨')

    const handler = async (event) => {
      try {
        console.log('📨 메시지 받음:', event.data)
        setStatus('📨 메시지 받음: ' + JSON.stringify(event.data))

        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        console.log('📋 파싱된 데이터:', data)
        setStatus('📋 파싱된 데이터: ' + JSON.stringify(data))

        if (data.type === 'LOGIN_TOKEN') {
          console.log('🔑 토큰 처리 시작:', data.token ? '토큰 있음' : '토큰 없음')

          const res = await fetch('/api/auth/web-google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token: data.token }),
          })

          const result = await res.json()
          console.log('📡 API 응답:', result)

          if (result.success) {
            setStatus(`✅ 로그인 성공: ${result.user.email}`)
          } else {
            setStatus(`❌ 실패: ${result.error}`)
          }
        } else if (data.type === 'LOGIN_ERROR') {
          setStatus(`❌ 로그인 실패: ${data.error}`)
        } else if (data.type && data.type !== 'LOGIN_TOKEN' && data.type !== 'LOGIN_ERROR') {
          // LOGIN_TOKEN이나 LOGIN_ERROR가 아닌 다른 메시지는 무시하고 상태 유지
          console.log('❓ 무시된 메시지 타입:', data.type)
        }
      } catch (err) {
        console.error('토큰 처리 에러', err)
        setStatus(`❌ 에러: ${err.message}`)
      }
    }

    // 웹뷰와 웹 브라우저 모두에서 메시지 수신
    document.addEventListener('message', handler) // 웹뷰용
    window.addEventListener('message', handler)   // 웹 브라우저용

    setTimeout(() => {
      setStatus('✅ 메시지 리스너 등록 완료 - 메시지 대기 중...')
      console.log('✅ 메시지 리스너 등록 완료')
    }, 1000)

    return () => {
      document.removeEventListener('message', handler)
      window.removeEventListener('message', handler)
    }
  }, [])

  const requestLogin = () => {
    if (window.ReactNativeWebView) {
      setStatus('🔄 React Native에서 구글 로그인 요청 중...')
      window.ReactNativeWebView.postMessage('GOOGLE_LOGIN_REQUEST')
    } else {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!googleClientId) {
        setStatus('❌ Google OAuth 클라이언트 ID가 설정되지 않았습니다.')
        return
      }

      const redirectUri = `${window.location.origin}/api/auth/web-google-login/callback`
      const scope = 'email profile'
      const responseType = 'code'

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${googleClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=${responseType}&` +
        `access_type=offline`

      setStatus('🔄 구글 로그인 팝업 열기 중...')
      const popup = window.open(
        googleAuthUrl,
        'google-login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        setStatus('❌ 팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      }
    }
  }

  return (
    <main style={{ gap: 20, padding: 40, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1>WebView Google</h1>
      <h1>로그인 데모</h1>
      <button
        style={{ fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid black', cursor: 'pointer' }}
        onClick={requestLogin}
      >
        Google 로그인 요청
      </button>
      <p style={{ fontSize: 14, color: '#666', textAlign: 'center', maxWidth: 300 }}>
        {isWebView ? 'React Native WebView에서 실행 중' : '웹 브라우저에서 실행 중'}
      </p>
      <div style={{ 
        fontSize: 12, 
        color: '#333', 
        textAlign: 'center', 
        maxWidth: 400, 
        padding: 10, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 8,
        border: '1px solid #ddd',
        minHeight: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {status}
      </div>
    </main>
  )
}