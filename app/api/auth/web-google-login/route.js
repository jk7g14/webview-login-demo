export async function POST(req) {
  try {
    const { code, token } = await req.json()

    // 토큰이 있는 경우 (React Native에서 온 ID 토큰 또는 웹에서 온 액세스 토큰)
    if (token) {
      let userInfo
      
      try {
        // 먼저 ID 토큰으로 시도 (React Native)
        const idTokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
        if (idTokenRes.ok) {
          userInfo = await idTokenRes.json()
        } else {
          // ID 토큰이 아니면 액세스 토큰으로 사용자 정보 가져오기 (웹)
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          
          if (!userInfoRes.ok) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          
          userInfo = await userInfoRes.json()
        }
        
        const email = userInfo.email || 'no-email'
        const name = userInfo.name || 'No Name'

        const headers = new Headers()
        headers.append(
          'Set-Cookie',
          `session_email=${email}; Path=/; HttpOnly; Secure; SameSite=None`
        )
        headers.append('Content-Type', 'application/json')

        return new Response(JSON.stringify({ success: true, user: { email, name } }), {
          status: 200,
          headers,
        })
      } catch (err) {
        console.error('Token validation error:', err)
        return new Response(JSON.stringify({ success: false, error: 'Token validation failed' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // 인증 코드가 있는 경우 (웹 브라우저에서 온 경우)
    if (!code) {
      return new Response(JSON.stringify({ success: false, error: 'No authorization code or token provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/web-google-login/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to exchange code for token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const tokenData = await tokenResponse.json()
    const { access_token, id_token } = tokenData

    // Get user info using access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Failed to get user info' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userInfo = await userInfoResponse.json()
    const email = userInfo.email || 'no-email'
    const name = userInfo.name || 'No Name'

    const headers = new Headers()
    headers.append(
      'Set-Cookie',
      `session_email=${email}; Path=/; HttpOnly; Secure; SameSite=None`
    )
    headers.append('Content-Type', 'application/json')

    return new Response(JSON.stringify({ success: true, user: { email, name } }), {
      status: 200,
      headers,
    })
  } catch (err) {
    console.error('Web Google login error:', err)
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 