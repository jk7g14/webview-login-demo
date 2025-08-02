# WebView Google 로그인 데모

React Native WebView와 웹 브라우저 모두에서 구글 로그인을 테스트할 수 있는 Next.js 데모 애플리케이션입니다.

## 기능

- ✅ React Native WebView에서 구글 로그인 (ID 토큰 수신)
- ✅ 웹 브라우저에서 구글 로그인 (팝업 방식)
- ✅ 실제 Google OAuth 2.0 인증
- ✅ 세션 쿠키 관리
- ✅ 실시간 상태 표시

## 핵심 코드 설명

### 1. React Native에서 ID 토큰 수신

#### 메시지 수신 리스너 등록

```javascript
// app/page.js - useEffect 내부
document.addEventListener('message', handler);
```

**설명**: React Native WebView에서 보낸 메시지를 받기 위해 `document`에 이벤트 리스너를 등록합니다. `window`가 아닌 `document`를 사용해야 웹뷰에서 메시지를 받을 수 있습니다.

#### 로그인 버튼 클릭 시 React Native로 요청 전송

```javascript
// app/page.js - requestLogin 함수
const requestLogin = () => {
  if (window.ReactNativeWebView) {
    // React Native WebView에서 실행 중
    setStatus('🔄 React Native에서 구글 로그인 요청 중...');
    window.ReactNativeWebView.postMessage('GOOGLE_LOGIN_REQUEST');
  } else {
    // 웹 브라우저에서 실행 중 - 팝업으로 구글 로그인
    // ... 웹 로그인 코드
  }
};
```

#### 메시지 처리 핸들러

```javascript
// app/page.js - handler 함수
const handler = async (event) => {
  try {
    console.log('📨 메시지 받음:', event.data);
    setStatus('📨 메시지 받음: ' + JSON.stringify(event.data));

    // Handle both string and object data from WebView
    const data =
      typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    console.log('📋 파싱된 데이터:', data);
    setStatus('📋 파싱된 데이터: ' + JSON.stringify(data));

    if (data.type === 'LOGIN_TOKEN') {
      console.log('🔑 토큰 처리 시작:', data.token ? '토큰 있음' : '토큰 없음');

      // 웹과 네이티브 모두 같은 API 사용
      const res = await fetch('/api/auth/web-google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: data.token }),
      });

      const result = await res.json();
      console.log('📡 API 응답:', result);

      if (result.success) {
        setStatus(`✅ 로그인 성공: ${result.user.email}`);
      } else {
        setStatus(`❌ 실패: ${result.error}`);
      }
    }
  } catch (err) {
    console.error('토큰 처리 에러', err);
    setStatus(`❌ 에러: ${err.message}`);
  }
};
```

**설명**:

- `event.data`로 React Native에서 보낸 메시지를 받습니다
- 문자열일 수 있으므로 `JSON.parse()`로 파싱합니다
- `data.type === 'LOGIN_TOKEN'`인지 확인합니다
- `data.token`에 ID 토큰이 들어있습니다

### 2. 토큰 검증 API

```javascript
// app/api/auth/web-google-login/route.js
export async function POST(req) {
  try {
    const { code, token } = await req.json();

    // 토큰이 있는 경우 (React Native에서 온 ID 토큰 또는 웹에서 온 액세스 토큰)
    if (token) {
      let userInfo;

      try {
        // 먼저 ID 토큰으로 시도 (React Native)
        const idTokenRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
        );
        if (idTokenRes.ok) {
          userInfo = await idTokenRes.json();
        } else {
          // ID 토큰이 아니면 액세스 토큰으로 사용자 정보 가져오기 (웹)
          const userInfoRes = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!userInfoRes.ok) {
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid token' }),
              {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }

          userInfo = await userInfoRes.json();
        }

        const email = userInfo.email || 'no-email';
        const name = userInfo.name || 'No Name';

        const headers = new Headers();
        headers.append(
          'Set-Cookie',
          `session_email=${email}; Path=/; HttpOnly; Secure; SameSite=None`
        );
        headers.append('Content-Type', 'application/json');

        return new Response(
          JSON.stringify({ success: true, user: { email, name } }),
          {
            status: 200,
            headers,
          }
        );
      } catch (err) {
        console.error('Token validation error:', err);
        return new Response(
          JSON.stringify({ success: false, error: 'Token validation failed' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
```

**설명**:

- React Native에서 보낸 ID 토큰을 `token` 파라미터로 받습니다
- `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`로 Google API에 토큰 검증 요청
- 검증 성공 시 사용자 정보 추출 및 쿠키 설정

## 플로우 요약

### React Native WebView 플로우

1. **웹뷰**: 로그인 버튼 클릭 → `window.ReactNativeWebView.postMessage('GOOGLE_LOGIN_REQUEST')` 전송
2. **React Native**: 메시지 수신 → 구글 로그인 실행 → ID 토큰 받기 → `postMessage()`로 웹뷰에 전송
3. **웹뷰**: `document.addEventListener('message')`로 메시지 수신
4. **웹 페이지**: ID 토큰을 Google API로 검증 → 사용자 정보 추출 → 성공 메시지 표시

### 웹 브라우저 플로우

1. **팝업**: 구글 로그인 → 인증 코드 받기
2. **콜백**: 인증 코드를 액세스 토큰으로 교환
3. **웹 페이지**: 액세스 토큰으로 사용자 정보 가져오기 → 성공 메시지 표시
