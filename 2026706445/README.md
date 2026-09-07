# CardLink AI

AI 기반 전자명함과 커뮤니티/협업 추천 기능을 제공하는 Vue 3 + Express 웹 서비스입니다.

## 주요 기능

- AI가 정리한 소개문이 포함된 전자명함 프로필
- 프로젝트 모집 목록과 기술 스택/관심 분야 필터
- 추천 사용자 목록과 추천 이유 표시
- QR 이미지 생성, 다운로드, 링크 복사 공유 UI
- 받은 컨택 요청 승인/거절 관리 화면
- 실물 명함 미리보기, 제작 요청, 주문 내역
- Express API, CORS, Helmet, Supabase Auth/PostgreSQL 전환 기반 구조

## 프로젝트 구조

```text
2026706445/
  backend/
    src/
      app.js
      server.js
      config/env.js
      db/supabase.js
      middleware/auth.js
      routes/
      services/
      utils/
    supabase/migrations/
    test/api.test.js
  frontend/
    src/
      components/
      router/
      services/
      views/
      assets/styles.css
```

## 실행 방법

### 1. 백엔드 실행

백엔드는 로컬 개발에서 Supabase 환경변수가 없으면 demo 데이터로 실행됩니다. 실제 Supabase 연동 또는 production 실행 시에는 `backend/.env.example`을 기준으로 `backend/.env`를 만듭니다.

```env
PORT=4000
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
NODE_ENV=development
ENABLE_LOCAL_AUTH=true
REQUEST_BODY_LIMIT=32kb
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

```bash
cd backend
npm install
npm run dev
```

백엔드 기본 주소는 `http://localhost:4000`입니다.
`npm run dev`는 로컬 개발 편의를 위해 `ENABLE_LOCAL_AUTH=true`와 localhost/127.0.0.1 CORS 기본값을 자동 적용합니다. `npm start`는 배포 실행에 가깝게 동작하므로 Supabase 환경변수나 명시적인 `.env` 설정이 필요합니다.

### 2. 프론트엔드 실행

프론트엔드는 API 주소와 Supabase anon key가 필요합니다. `frontend/.env.example`을 기준으로 `frontend/.env`를 만듭니다.

```env
VITE_API_BASE_URL=http://127.0.0.1:4000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

```bash
cd frontend
npm install
npm run dev
```

프론트엔드 기본 주소는 `http://localhost:5173`입니다.

## API

- `GET /api/health`
- `GET /api/profiles`
- `GET /api/profiles/:slug`
- `GET /api/me`
- `POST /api/me/profile`
- `GET /api/projects`
- `GET /api/me/projects`
- `POST /api/me/projects`
- `PATCH /api/me/projects/:id`
- `POST /api/projects/:id/applications`
- `GET /api/me/project-applications`
- `GET /api/me/projects/applications`
- `PATCH /api/me/projects/applications/:id`
- `POST /api/profiles/:slug/contact-requests`
- `GET /api/me/contact-requests`
- `GET /api/me/sent-contact-requests`
- `PATCH /api/me/contact-requests/:id`
- `GET /api/recommendations/public`
- `POST /api/me/recommendation-runs`
- `GET /api/me/physical-card-orders`
- `POST /api/me/physical-card-orders`
- `GET /api/admin/overview`
- `GET /api/admin/members`
- `PATCH /api/admin/members/:id`
- `GET /api/admin/requests`
- `GET /api/admin/audit-logs`
- `GET /api/admin/physical-card-orders`
- `PATCH /api/admin/physical-card-orders/:id`

`GET /api/me`, `POST /api/me/profile`, 지원/컨택/추천/실물 명함 주문 API는 Supabase access token이 필요합니다. Supabase 환경변수가 없는 로컬 개발 모드에서는 `ENABLE_LOCAL_AUTH=true`를 명시해야 frontend local auth fallback이 만드는 `local-dev-token`으로 보호 API를 사용할 수 있고, 데이터는 backend in-memory fallback에 저장됩니다. 배포 환경에서는 `ENABLE_LOCAL_AUTH`를 켜지 말고 실제 Supabase 환경변수를 설정해야 합니다.
production에서는 `CORS_ORIGIN=*`과 `ENABLE_LOCAL_AUTH=true`가 서버 시작 단계에서 차단되며, API rate limit은 `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`로 조정합니다.

## Service Foundation Setup

현재 코드는 mock-only MVP에서 Supabase 기반 서비스형 구조로 전환 중입니다.

필수 서비스:

- Supabase project for Auth and PostgreSQL
- Render backend service
- Vercel frontend project

Supabase에 먼저 적용할 SQL:

```text
backend/supabase/migrations/202605210001_service_foundation.sql
```

1차 foundation에 포함된 기능:

- Supabase Auth SDK 설치
- Google/GitHub/이메일 로그인을 위한 프론트 auth helper
- Supabase PostgreSQL schema/RLS migration 초안
- 공개 프로필/프로젝트 조회 API
- 로그인 사용자용 `/api/me` 프로필 조회/저장 API 기반
- 프로젝트 지원, 컨택 요청/승인, DB 기반 추천 생성 API
- 받은 컨택 요청 목록 조회와 승인/거절 관리 UI
- 실물 명함 주문 생성/조회 API
- token-aware frontend API helper와 interaction helper

## 테스트와 빌드

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
npm run build
```

프론트엔드 build script는 현재 Windows/Node 로컬 환경에서 Vite의 기본 `emptyOutDir` 정리 단계가 native crash를 일으키는 문제를 피하기 위해 `vite build --emptyOutDir false`를 사용합니다.

## 배포 메모

- 백엔드 환경변수는 `backend/.env.example`을 기준으로 설정합니다.
- 프론트엔드 API 주소와 Supabase anon key는 `frontend/.env.example`을 기준으로 설정합니다.
- 정적 배포는 `frontend/dist`를 Vercel에 올리는 구성을 우선합니다.
- `frontend/vercel.json`은 SPA rewrite와 CSP, frame 차단, MIME sniffing 차단, referrer/permissions policy를 포함합니다.
- 백엔드는 Render Node.js Web Service 배포를 우선합니다.
- Auth와 DB는 Supabase를 사용합니다.
