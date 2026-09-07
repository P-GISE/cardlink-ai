# CardLink AI

AI 기반 전자명함, 프로젝트 모집, 개발자 협업 매칭을 한 흐름으로 묶은 풀스택 웹 서비스입니다.

이 저장소의 실제 애플리케이션 소스는 `2026706445/` 안에 있습니다. 상위 폴더에는 발표/후보 이미지 자료가 함께 있고, GitHub에서는 이 README를 첫 진입점으로 사용합니다.

## 한눈에 보기

| 항목 | 내용 |
| --- | --- |
| 한국어 프로젝트명 | 카드링크 AI |
| 저장소 성격 | 전자명함 + 프로젝트 모집 + 개발자 협업 매칭 MVP |
| 실제 앱 위치 | `2026706445/backend`, `2026706445/frontend` |
| 실행 형태 | Express API 서버와 Vite/Vue 클라이언트를 각각 실행 |
| 외부 서비스 | Supabase Auth, Supabase PostgreSQL |
| 로컬 대체 흐름 | Supabase 설정이 없을 때 demo/in-memory 데이터로 기능 확인 가능 |

## 이 프로젝트로 확인할 수 있는 것

- 사용자가 자기소개, 기술 스택, 관심 분야를 등록해 공개 전자명함을 만들 수 있습니다.
- 전자명함은 URL과 QR 코드로 공유할 수 있고, 외부 사용자는 프로필을 보고 컨택 요청을 보낼 수 있습니다.
- 프로젝트 모집자는 모집 글을 만들고, 다른 사용자는 프로젝트에 지원할 수 있습니다.
- 관리자는 회원, 요청, 실물 명함 주문, 감사 로그를 확인해 서비스 운영 흐름을 살펴볼 수 있습니다.
- Supabase를 붙이면 실제 Auth/PostgreSQL 기반 서비스로 확장할 수 있고, 설정이 없을 때는 로컬 데모 모드로 화면과 API 흐름을 먼저 확인할 수 있습니다.

## 주요 기능

- 전자명함 프로필 생성과 공개 프로필 조회
- 기술 스택, 관심 분야, 프로젝트 모집 조건 기반 사용자/프로젝트 탐색
- QR 이미지 생성, 다운로드, 링크 복사 공유 UI
- 프로젝트 지원, 컨택 요청, 승인/거절 관리
- 실물 명함 미리보기, 제작 요청, 주문 내역 관리
- 관리자용 회원, 요청, 감사 로그, 실물 명함 주문 관리
- Supabase Auth/PostgreSQL 연동을 염두에 둔 Express API 구조

## 기술 스택

- Frontend: Vue 3, Vite
- Backend: Node.js, Express
- Database/Auth: Supabase Auth, Supabase PostgreSQL
- Security/Operations: Helmet, CORS, rate limit, 환경변수 기반 설정
- Test/Build: npm scripts, frontend/backend 분리 검증

## 프로젝트 구조

```text
2026706445_dev/
  2026706445/
    backend/       Express API, Supabase 연동, API 테스트
    frontend/      Vue 3 클라이언트
    README.md      세부 실행법과 API 목록
  cardlink_candidate_screenshots.png
  ppt_original_export/
```

## 처음 써보는 순서

1. 백엔드를 먼저 실행합니다.
2. 프론트엔드를 실행합니다.
3. 브라우저에서 `http://localhost:5173`에 접속합니다.
4. 로컬 데모 모드에서는 회원가입/로그인 후 프로필을 작성합니다.
5. 프로필 공개 페이지, QR 다운로드, 프로젝트 모집/지원, 컨택 요청 흐름을 차례로 확인합니다.
6. 관리자 화면은 데모 데이터와 API 응답을 통해 운영 화면 구성을 확인하는 용도로 사용합니다.

## 실행 방법

백엔드:

```bash
cd 2026706445/backend
npm install
npm run dev
```

프론트엔드:

```bash
cd 2026706445/frontend
npm install
npm run dev
```

기본 개발 주소:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`

환경변수는 `2026706445/backend/.env.example`, `2026706445/frontend/.env.example`을 기준으로 생성합니다. 실제 `.env`와 API 키는 GitHub에 올리지 않습니다.

## 환경변수 요약

백엔드 `2026706445/backend/.env`:

| 변수 | 설명 |
| --- | --- |
| `PORT` | API 서버 포트입니다. 기본값은 `4000`입니다. |
| `CORS_ORIGIN` | 프론트엔드 접속 주소를 쉼표로 지정합니다. |
| `ENABLE_LOCAL_AUTH` | Supabase 없이 로컬 fallback 인증을 사용할 때 `true`로 둡니다. |
| `SUPABASE_URL` | Supabase 프로젝트 URL입니다. 실제 연동 시 필요합니다. |
| `SUPABASE_ANON_KEY` | 브라우저/일반 요청용 Supabase anon key입니다. |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버에서 DB 작업을 수행할 때 쓰는 service role key입니다. 공개 금지입니다. |

프론트엔드 `2026706445/frontend/.env`:

| 변수 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | 백엔드 API base URL입니다. 예: `http://127.0.0.1:4000/api` |
| `VITE_SUPABASE_URL` | Supabase Auth를 사용할 때 필요한 프로젝트 URL입니다. |
| `VITE_SUPABASE_ANON_KEY` | Supabase Auth 클라이언트용 anon key입니다. |

## 구현 포인트

- Supabase 환경변수가 없는 로컬 개발에서는 demo/in-memory 흐름으로 실행되도록 분리했습니다.
- 인증이 필요한 API와 공개 조회 API를 나누고, 배포 환경에서는 위험한 CORS/Auth 조합을 서버 시작 단계에서 차단합니다.
- 프론트엔드는 토큰 보유 여부에 따라 local auth fallback과 실제 Supabase 인증 흐름을 분리합니다.
- QR, 컨택 요청, 프로젝트 지원, 실물 명함 주문처럼 사용자의 행동 흐름이 이어지는 화면을 한 서비스 안에서 연결했습니다.

## 검증

세부 테스트 명령은 `2026706445/README.md`를 기준으로 실행합니다.

```bash
cd 2026706445/backend
npm test
```

```bash
cd 2026706445/frontend
npm test
npm run build
```

## 문제 해결 메모

- 프론트엔드에서 API 호출이 실패하면 `VITE_API_BASE_URL`이 백엔드 주소와 맞는지 먼저 확인합니다.
- 보호 API가 401을 반환하면 로컬 데모 모드에서는 백엔드의 `ENABLE_LOCAL_AUTH=true` 설정이 필요합니다.
- Supabase를 실제로 붙일 때는 migration SQL을 먼저 적용하고, service role key는 서버 `.env`에만 둡니다.
- 프론트엔드 build는 `2026706445/frontend/dist`에 생성되며, 이 폴더는 소스 커밋 대상이 아닙니다.

## GitHub 업로드 전 주의

- `.env`, `.local-logs`, `.playwright-cli`, `node_modules`, `dist`는 업로드 대상에서 제외합니다.
- 발표 자료 이미지는 필요할 때만 README 스크린샷으로 연결하고, 임시 검증 로그는 커밋하지 않습니다.
