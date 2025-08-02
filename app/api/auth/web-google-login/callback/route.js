export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return new Response(
      `<html><body><script>window.opener.postMessage({ type: 'LOGIN_ERROR', error: '${error}' }, '*'); window.close();</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (!code) {
    return new Response(
      `<html><body><script>window.opener.postMessage({ type: 'LOGIN_ERROR', error: 'No authorization code' }, '*'); window.close();</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  try {
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
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', tokenResponse.status, errorText)
      return new Response(
        `<html><body><script>window.opener.postMessage({ type: 'LOGIN_ERROR', error: 'Failed to exchange code for token: ${tokenResponse.status}' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token } = tokenData

    // Get user info using access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      return new Response(
        `<html><body><script>window.opener.postMessage({ type: 'LOGIN_ERROR', error: 'Failed to get user info' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      )
    }

    const userInfo = await userInfoResponse.json()
    const email = userInfo.email || 'no-email'
    const name = userInfo.name || 'No Name'

    // Send success message back to opener window (토큰만 전달)
    return new Response(
      `<html><body><script>window.opener.postMessage({ type: 'LOGIN_TOKEN', token: '${access_token}' }, '*'); window.close();</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  } catch (err) {
    console.error('Callback error:', err)
    return new Response(
      `<html><body><script>window.opener.postMessage({ type: 'LOGIN_ERROR', error: 'Server error' }, '*'); window.close();</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
} 