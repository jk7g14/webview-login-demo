'use client'

import { useEffect, useState } from 'react'

export default function Page() {
  const [isWebView, setIsWebView] = useState(false)

  useEffect(() => {
    // 클라이언트 사이드에서만 window 객체 접근
    setIsWebView(!!window.ReactNativeWebView)

    const handler = async (event) => {
      try {
        console.log('📨 메시지 받음:', event.data)
        alert('📨 메시지 받음: ' + JSON.stringify(event.data))
        
        // Handle both string and object data from WebView
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        console.log('📋 파싱된 데이터:', data)
        alert('📋 파싱된 데이터: ' + JSON.stringify(data))
        
        if (data.type === 'LOGIN_TOKEN') {
          console.log('🔑 토큰 처리 시작:', data.token ? '토큰 있음' : '토큰 없음')
          
          // 웹과 네이티브 모두 같은 API 사용
          const res = await fetch('/api/auth/web-google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token: data.token }),
          })

          const result = await res.json()
          console.log('📡 API 응답:', result)
          
          if (result.success) {
            alert(`✅ 로그인 성공: ${result.user.email}`)
          } else {
            alert(`❌ 실패: ${result.error}`)
          }
        } else if (data.type === 'LOGIN_ERROR') {
          alert(`❌ 로그인 실패: ${data.error}`)
        } else {
          console.log('❓ 알 수 없는 메시지 타입:', data.type)
        }
      } catch (err) {
        console.error('토큰 처리 에러', err)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const requestLogin = () => {
    if (window.ReactNativeWebView) {
      // React Native WebView에서 실행 중
      window.ReactNativeWebView.postMessage('GOOGLE_LOGIN_REQUEST')
    } else {
      // 웹 브라우저에서 실행 중
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      if (!googleClientId) {
        alert('Google OAuth 클라이언트 ID가 설정되지 않았습니다.')
        return
      }

      const redirectUri = `${window.location.origin}/api/auth/web-google-login/callback`
      const scope = 'email profile'
      const responseType = 'code'
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${googleClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=${responseType}&` +
        `access_type=offline`

      // 팝업 창으로 구글 로그인 열기
      const popup = window.open(
        googleAuthUrl,
        'google-login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
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
    </main>
  )
}