# CardLink AI

AI 기반 전자명함과 커뮤니티/협업 추천 기능을 제공하는 Vue 3 + Express 웹 서비스입니다.

## 문서 범위

이 README는 실제 앱 소스가 있는 `2026706445/` 폴더 기준입니다. GitHub 저장소 루트의 README는 포트폴리오용 요약이고, 이 문서는 개발자가 로컬에서 실행하고 구조를 파악하는 데 필요한 세부 정보를 담습니다.

## 소스 검토 기준

이 문서는 `backend/src`, `backend/test`, `backend/supabase/migrations`, `frontend/src`, `frontend/src/**/*.test.js`, `backend/package.json`, `frontend/package.json`, `.env.example` 파일을 기준으로 정리했습니다. 실제 `.env`, 의존성 폴더, 빌드 산출물, 발표 이미지 자료는 실행/구조 설명의 근거에서 제외했습니다.

검토 결과 CardLink AI는 전자명함 화면만 있는 프로젝트가 아니라 공개 프로필, 프로젝트 모집, 지원/컨택 요청, 추천, 실물 명함 주문, 관리자 화면, Supabase 전환 가능한 DB 스키마를 포함한 풀스택 MVP입니다.

## 사용 시나리오

1. 개발자가 회원가입 후 전자명함 프로필을 작성합니다.
2. 서비스는 이름, 소개, 기술 스택, 관심 분야, 링크 정보를 기반으로 공개 프로필을 구성합니다.
3. 사용자는 QR 코드나 공개 링크로 자신의 전자명함을 공유합니다.
4. 다른 사용자는 프로젝트 모집 글을 탐색하고 지원하거나, 프로필 페이지에서 컨택 요청을 보냅니다.
5. 프로필 소유자는 받은 컨택 요청과 프로젝트 지원자를 승인/거절합니다.
6. 관리자는 회원 상태, 요청 현황, 실물 명함 주문과 감사 로그를 확인합니다.

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
    test/
  frontend/
    src/
      components/
      router/
      services/
      views/
      assets/styles.css
    src/**/*.test.js
```

## 구현 기준 파일

| 영역 | 파일 | 확인할 내용 |
| --- | --- | --- |
| API 조립 | `backend/src/app.js` | Helmet, CORS, rate limit, 인증 middleware, route mount 순서 |
| 환경설정 | `backend/src/config/env.js`, `backend/.env.example` | 로컬 인증, 요청 크기, rate limit, Supabase 연결값 |
| 인증 | `backend/src/middleware/auth.js` | Supabase token 인증과 로컬 개발 사용자 처리 |
| 도메인 API | `backend/src/routes/*.js` | 프로필, 프로젝트, 지원, 컨택 요청, 추천, 실물 카드, 관리자 API |
| DB migration | `backend/supabase/migrations/*.sql` | 테이블, 인덱스, RLS policy, 관리자 감사 로그 |
| 로컬 fallback | `backend/src/db/localSupabase.js` | Supabase 없이 demo 데이터로 API 흐름 확인 |
| 화면 라우팅 | `frontend/src/router/index.js` | 공개/로그인/관리자/주문/프로젝트 관리 화면 URL |
| API 호출 | `frontend/src/services/api.js` | 프론트엔드에서 백엔드 API를 호출하는 공통 함수 |
| 테스트 | `backend/test`, `frontend/src/**/*.test.js` | 백엔드 API와 프론트엔드 화면/서비스 단위 검증 |

## 주요 API 지도

| 범위 | 엔드포인트 예시 | 설명 |
| --- | --- | --- |
| 상태 | `GET /api/health` | API 서버 상태 확인 |
| 내 정보 | `GET /api/me`, `PUT /api/me/profile` | 로그인 사용자와 프로필 저장 |
| 공개 프로필 | `GET /api/profiles`, `GET /api/profiles/:slug` | 전자명함 목록/상세 조회 |
| 프로젝트 | `GET /api/projects`, `POST /api/me/projects` | 프로젝트 모집 조회와 생성 |
| 지원/컨택 | `POST /api/projects/:id/applications`, `POST /api/profiles/:slug/contact-requests` | 프로젝트 지원과 프로필 컨택 요청 |
| 추천 | `GET /api/recommendations/public`, `GET /api/me/recommendation-runs` | 추천 결과와 추천 실행 기록 |
| 실물 카드 | `POST /api/me/physical-card-orders`, `GET /api/admin/physical-card-orders` | 실물 명함 주문과 관리자 처리 |
| 관리자 | `GET /api/admin/overview`, `GET /api/admin/members`, `GET /api/admin/audit-logs` | 운영 대시보드, 회원, 감사 로그 |

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

## 로컬 데모 모드

Supabase 프로젝트를 아직 만들지 않아도 기본 흐름은 확인할 수 있습니다.

1. 백엔드에서 `ENABLE_LOCAL_AUTH=true`를 사용합니다.
2. 프론트엔드에서 회원가입/로그인을 진행합니다.
3. 프론트엔드 local auth fallback이 만든 `local-dev-token`으로 보호 API를 호출합니다.
4. 백엔드는 in-memory fallback 저장소에 프로필, 프로젝트, 컨택 요청, 주문 데이터를 저장합니다.

이 모드는 기능 시연과 UI 확인을 위한 개발 편의 기능입니다. 배포 환경에서는 사용하지 않습니다.

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

## 화면 구성

- 홈: 서비스 소개와 주요 진입점
- 프로필 작성/관리: 전자명함 정보, 기술 스택, 링크, 공개 slug 관리
- 공개 프로필: 외부 사용자가 확인하는 전자명함 페이지
- QR/실물 명함: QR 이미지 생성, 다운로드, 인쇄용 미리보기, 제작 요청
- 프로젝트: 모집 글 목록, 내 프로젝트, 지원자 관리
- 커뮤니티/추천: 공개 추천 사용자와 추천 이유 확인
- 컨택 요청: 받은 요청, 보낸 요청, 승인/거절 상태 확인
- 관리자: 회원, 요청, 감사 로그, 실물 명함 주문 관리

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

## 운영 전 확인할 것

- Supabase RLS 정책이 실제 서비스 권한 모델과 맞는지 확인합니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 프론트엔드에 절대 노출하지 않습니다.
- production에서는 `ENABLE_LOCAL_AUTH=false` 또는 미설정 상태를 유지합니다.
- CORS는 실제 프론트엔드 도메인만 허용합니다.
- 실물 명함 주문 기능을 운영 결제/제작 프로세스와 연결하려면 주문 상태 전환 권한을 관리자 API로 제한합니다.
