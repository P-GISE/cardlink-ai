# Cardlink 운영 패키지 준비

정본 앱은 `2026706445/frontend` (Vue/Vite)와 `2026706445/backend` (Express)이다.
루트의 PPT/이미지 자료는 실행 코드가 아니며 Docker context allowlist에서 제외한다.
하나의 비루트 Node 컨테이너가 빌드된 SPA와 `/api`를 함께 제공한다. 운영 브라우저 API 기본 경로는 `/api`이며 개발 프록시가 필요 없다.
SPA `/auth/callback` 경로를 Express가 제공한다. CSP는 설정된 Supabase origin에만 추가 연결을 허용한다.

## 승인 전 차단 조건

- 실제 Supabase 프로젝트, HTTPS origin/DNS, reverse proxy 및 미사용 loopback 포트는 아직 선정/연결하지 않았다.
- `SUPABASE_URL`, 공개 `SUPABASE_ANON_KEY`, 서버 전용 `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGIN`, `APP_PORT`, `IMAGE_TAG`를 `.env.production`에 입력해야 한다. 예제의 빈 값은 실행에 실패한다.
- 공개 anon/publishable 키만 빌드 인자로 사용한다. service-role/secret 키를 anon 키 칸이나 `VITE_*`에 입력하면 안 된다. 브라우저에는 공개 URL/anon 키가 포함되므로 RLS 정책 검토가 필수다.
- 승인 후 Supabase Auth Site URL을 최종 HTTPS origin으로, 허용 redirect URL을 `<origin>/auth/callback`로 설정하고 쿼리 `next` 처리 및 제공자 로그인을 확인한다. 현재 OAuth는 실제 계정으로 검증하지 않았다.
- 기존 `backend/supabase/migrations/*.sql` 순서와 RLS/권한을 별도 검토하고 백업 후 수동 적용해야 한다. 이미지 시작, CI, Compose에는 migrate/seed/schema 변경이 없다. 실운영 DB 생성/변경은 별도 승인 사항이다.

## 설치 순서 (승인 후 실행)

1. 검토된 커밋 checkout, `cp .env.example .env.production`, 권한을 소유자만 읽도록 제한한다. 서비스 키는 서버 runtime에만 전달한다.
2. `docker compose --env-file .env.production -f compose.production.yaml config --quiet`
3. `docker compose --env-file .env.production -f compose.production.yaml build`
4. `docker compose --env-file .env.production -f compose.production.yaml up -d --wait`
5. `http://127.0.0.1:<APP_PORT>/api/health` 200, `/auth/callback` SPA 200, `/api/me` 비로그인 401, `/api/unknown` JSON 404를 확인한다.
6. 승인된 HTTPS reverse proxy만 loopback 포트로 전달한다. CORS_ORIGIN은 최종 origin과 정확하게 일치시킨다. 직접 공개 포트로 바꾸지 않는다.
7. 실제 로그인/로그아웃/콜백, 사용자별 데이터 격리와 재시작 후 보존은 승인된 외부 환경에서 별도로 확인한다.

Docker health는 프로세스 응답 검사이며 Supabase 연결/스키마 준비 성공을 의미하지 않는다.
로컬 저장소는 사용하지 않는다. 데이터는 외부 Supabase에만 저장되며 컨테이너 파일시스템은 읽기 전용이다. Compose 기본 네트워크는 `cardlink_default`이고 DB 호스트 포트/공유 볼륨은 없다.
현재 메모리 기반 API rate limiter는 단일 인스턴스 기준이다. HTML/정적 자산에는 API 한도를 적용하지 않는다. proxy 뒤에서는 접속 IP가 proxy IP로 보이므로 API 공유 한도가 적용된다. 복제 운영은 별도 설계가 필요하다.

## 검증 및 롤백

`npm ci && npm test`를 backend/frontend 각각 실행한다. frontend는 공개 합성 설정으로 `npm run build`한다.
CI는 PR/준비 브랜치에서만 합성 URL과 키로 테스트·이미지 빌드·HTTP smoke·비밀 누출/환경 누락 차단을 검사한다. 배포나 외부 Supabase 호출은 수행하지 않는다.
운영 환경은 `ENABLE_LOCAL_AUTH=true` 및 필수 키 누락 시 시작을 거부한다. 개발 서버와 in-memory fallback은 운영 시작 명령에 사용하지 않는다.

배포 전 이전 이미지 태그 및 환경 파일을 보관한다. 롤백은 이전 `IMAGE_TAG`와 대응하는 공개 Supabase 설정으로 복원한 뒤 `docker compose --env-file .env.production -f compose.production.yaml up -d --no-build --wait`를 실행한다.
앱 롤백은 DB 스키마를 되돌리지 않는다. DB 복원은 별도 백업/호환성 검토 후 수행한다. `down -v`나 자동 초기화를 실행하지 않는다.

## 공개 인증 제공자 상태

현재 Cardlink 주소는 `https://cardlink.pigs0516.com`이며 이메일 인증은
`/auth/callback?next=%2Fprofile%2Fedit`로 돌아온다. 전용 Supabase 프로젝트의
URL 설정에서 이 callback을 허용해야 한다.

로그인 화면은 프로젝트의 공개 Auth 설정을 조회한 뒤 실제 활성화된 Google·GitHub
버튼만 켠다. 미구성 제공자나 설정 조회 실패 시 버튼을 비활성화하고 이메일 가입·로그인은
유지한다. OAuth 앱을 등록하거나 Supabase 제공자 설정을 변경하는 기능은 아니다.
2026-10-25 실제 설정 확인 시 소셜 제공자 두 개는 꺼져 있었고 이메일 인증은 별도 검증했다.

## GitHub 이벤트 배포 (2026-10-29)

.github/workflows/deploy-event.yml은 main push의 'Build and deployment checks' 완료 이벤트와 수동 recovery를 받는다. 두 경로 모두 GitHub REST에서 정확한 run ID를 다시 읽어 고정 저장소·head repository·main·push·ci.yml·완료·성공·SHA를 검증한다. PR 또는 다른 branch의 run은 배포 대상이 아니다. 특권 job은 소스를 checkout하지 않는다.

프로젝트 전용 CARDLINK_DEPLOY_SSH_KEY, CARDLINK_DEPLOY_KNOWN_HOSTS, CARDLINK_DEPLOY_TARGET 세 repository secret과 S2 제한 SSH entry 설치가 필요하다. 고정 command는 'event-deploy-cardlink <SHA40> <run ID>'이며 strict host pinning과 일시 key 파일 0600/종료 정리를 사용한다. 같은 프로젝트 실행은 취소 없이 queue에 쌓이고 원격 lock timeout(exit 75 및 정확한 오류)만 최대 20분 재시도한다. 성공 receipt의 요청 SHA/run, 실제 배포 run/artifact run 및 image digest를 검사한다. 수동 recovery에는 성공한 main push CI의 정확한 run ID와 SHA를 입력한다.

프로젝트 전용 제한키·secret3개와 고정 진입점을 설치했다. 임의 명령은 exit64로 거절된다. 최초 보호 tree의 정확 네 파일 변경을 검토하고 `0074ca9dae6b818dc6ce7ba0211b9465f12bd629` / CI40822120638 / image44047a0f…를 승격했다. 첫 잠금 경합은 앱 변경 전에 차단됐고, 같은 inode를 최대60초 기다리는 검토된 별도 승격본으로 처리했다. 독립 후속22항목과 수동 recovery40824688891이 성공한 뒤 `five-sites-deploy@cardlink.timer`를 disabled/inactive로 전환했다. 처음 후속 관측의 다른 컨테이너 전체 해시 차이는 기록했으며, 추가 앱 변경 없이 다음 관측에서 원래 해시와 일치했다. 정확한 원인은 미확정이다.

이후 배포는 main의 성공 CI 완료 이벤트를 사용한다. 이 문서 변경의 실제 신규 자동배포 결과는 별도 운영 증거로 확인하며 앞선 수동 recovery와 구분한다. 기존 보안·runtime gate 및 앱·DB·SMTP·Supabase 정책은 유지한다. 운영 브랜치가 바뀌면 고정 receiver·서버 설정을 함께 검토해야 한다.

이벤트 연결에 문제가 생기면 기존 timer를 다시 켜는 방안과 해당 프로젝트의 제한키·secret만 회수하는 방안을 구분한다. 앱 문제는 이전 앱 이미지로 복구하고, DB·Supabase 정책은 앱 롤백에 포함하지 않는다. 보호 경로 변경은 일반 이벤트가 자동 승인하지 않는다.
