'use client'

import { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    const handler = async (event) => {
      try {
        // Handle both string and object data from WebView
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (data.type === 'LOGIN_TOKEN') {
          const res = await fetch('/api/auth/native-google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // ✅ WebView에 쿠키 저장 필수
            body: JSON.stringify({ token: data.token }),
          })

          const result = await res.json()
          if (result.success) {
            alert(`✅ 로그인 성공: ${result.user.email}`)
          } else {
            alert(`❌ 실패: ${result.error}`)
          }
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
      window.ReactNativeWebView.postMessage('GOOGLE_LOGIN_REQUEST')
    } else {
      alert('이건 앱 WebView가 아니에요.')
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
    </main>
  )
}