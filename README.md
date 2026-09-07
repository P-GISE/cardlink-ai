# CardLink AI

AI 기반 전자명함, 프로젝트 모집, 개발자 협업 매칭을 한 흐름으로 묶은 풀스택 웹 서비스입니다.

이 저장소의 실제 애플리케이션 소스는 `2026706445/` 안에 있습니다. 상위 폴더에는 발표/후보 이미지 자료가 함께 있고, GitHub에서는 이 README를 첫 진입점으로 사용합니다.

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

## GitHub 업로드 전 주의

- `.env`, `.local-logs`, `.playwright-cli`, `node_modules`, `dist`는 업로드 대상에서 제외합니다.
- 발표 자료 이미지는 필요할 때만 README 스크린샷으로 연결하고, 임시 검증 로그는 커밋하지 않습니다.
