export async function POST(req) {
  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'No token provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
    if (!googleRes.ok) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userInfo = await googleRes.json()
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
    return new Response(JSON.stringify({ success: false, error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}