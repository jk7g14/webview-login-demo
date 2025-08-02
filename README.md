# WebView Google 로그인 데모

React Native WebView와 웹 브라우저 모두에서 구글 로그인을 테스트할 수 있는 Next.js 애플리케이션입니다.

## 기능

- ✅ React Native WebView에서 구글 로그인
- ✅ 웹 브라우저에서 구글 로그인 (팝업 방식)
- ✅ 실제 Google OAuth 2.0 인증
- ✅ 세션 쿠키 관리

## 설정 방법

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "APIs & Services" > "Credentials" 메뉴로 이동
4. "Create Credentials" > "OAuth 2.0 Client IDs" 클릭
5. 애플리케이션 유형 선택:
   - **Web application** (웹 브라우저용)
   - **Android** (React Native용, 패키지명 설정)

### 2. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Public Google Client ID (웹 브라우저에서 사용)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. OAuth 리디렉션 URI 설정

Google Cloud Console에서 다음 URI들을 승인된 리디렉션 URI에 추가하세요:

- `http://localhost:3000/api/auth/web-google-login/callback` (개발용)
- `https://your-domain.com/api/auth/web-google-login/callback` (배포용)

## 사용 방법

### 웹 브라우저에서 테스트

1. 개발 서버 실행:

```bash
npm run dev
```

2. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속
3. "Google 로그인 요청" 버튼 클릭
4. 팝업 창에서 구글 계정으로 로그인
5. 로그인 성공 시 알림 확인

### React Native WebView에서 테스트

1. React Native 앱에서 WebView 컴포넌트로 이 페이지 로드
2. "Google 로그인 요청" 버튼 클릭
3. 네이티브 구글 로그인 플로우 실행
4. 로그인 성공 시 WebView로 토큰 전달

## API 엔드포인트

- `POST /api/auth/native-google-login` - React Native용 토큰 처리
- `POST /api/auth/web-google-login` - 웹용 인증 코드 처리
- `GET /api/auth/web-google-login/callback` - OAuth 콜백 처리

## 배포 시 주의사항

1. **환경변수 업데이트**: 배포 환경에 맞게 `NEXTAUTH_URL` 수정
2. **HTTPS 필수**: 프로덕션에서는 HTTPS 사용 필수
3. **도메인 설정**: Google Cloud Console에서 배포 도메인 추가
4. **쿠키 설정**: `SameSite=None`과 `Secure` 플래그 확인

## 기술 스택

- **Frontend**: Next.js 14, React
- **Backend**: Next.js API Routes
- **Authentication**: Google OAuth 2.0
- **Session Management**: HTTP-only Cookies

## 문제 해결

### 팝업이 차단되는 경우

- 브라우저의 팝업 차단 설정 확인
- 도메인이 Google Cloud Console에 등록되어 있는지 확인

### 인증 실패 시

- 환경변수가 올바르게 설정되었는지 확인
- Google Cloud Console의 OAuth 설정 확인
- 콘솔 로그에서 에러 메시지 확인

## 라이센스

MIT License
