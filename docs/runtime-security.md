# 런타임 OS·Node library 보안 게이트 (2026-10-27)

확인한 실행 이미지에서 brace-expansion5.0.9·undici6.28.0·http-cache-semantics4.2.0은 global npm 소유였으며 앱 node_modules에는 없었다. 같은 Debian/glibc ABI를 유지하고 공식 `node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205`를 고정한다. 이미지 빌드 중 APT 갱신을 적용하고, 설치·빌드가 끝난 **최종 앱 runtime에만** 불필요한 global npm/npx/yarn/corepack을 제거한다. 앱 node_modules와 Node 실행 파일·USER·포트·환경 주입은 유지한다.

APT 갱신 결과는 빌드 시점 저장소 상태에 따라 달라진다. 실제 CI 전에는 OS 경고가 없어졌다고 판정하지 않는다. CVE-2023-45853 등 vendor 비영향 후보도 이 변경에서 ignore/VEX로 제외하지 않는다. [Debian vendor 기록](https://security-tracker.debian.org/tracker/CVE-2023-45853)의 조건과 패키지 provenance는 별도 근거로 보존하며 raw 경고가 남으면 게이트는 계속 차단한다.

Shop의 small image 게이트를 재사용해 실제 built image ID를 Trivy0.76.1로 검사한다. archive SHA256 `c7cbe3137fb8a48a17574bede3dd6beb16742d1e9772929940fc90082c39d9c0`을 확인하고, vuln-only·OS+library·모든 severity·텔레메트리 OFF·격리된 cwd/HOME·빈 config/ignore 입력을 사용한다. 알려진 Debian OS inventory와 Node library inventory가 각각 양수여야 한다. CRITICAL/HIGH·scanner 오류·미검사/불완전 요약은 차단한다. OS-only 결과를 Node library까지 검사한 것으로 세지 않는다.

허용된 template/요약에는 OS/Node package 수와 scope별/전체 severity 수량만 포함한다. raw image config/env/target·scanner/container 로그·원문 보고서 artifact는 출력하거나 업로드하지 않는다. 기존 immutable image 배포 artifact와 기존 source security gate는 유지한다.

로컬 합성 회귀는 OS와 library 각각의 C/H 거부, 양쪽 inventory 필수, scanner 오류, 잘못된 자료형/중복 scope, 비밀 합성 marker 미출력을 검사한다. 실제 image 빌드/패키지 상태/서비스 기능 회귀는 정확한 GitHub CI에서 확인해야 한다. 변경 전 immutable image로 app만 되돌리는 기존 배포 rollback을 유지하며 운영 DB·schema·DNS·접근 정책은 바꾸지 않는다.

Cardlink frontend build와 backend npm ci는 npm이 있는 단계에서 수행한다. 최종 CMD `node src/server.js`, USER node, port4000 및 health·SPA/auth callback·401/404·필수설정 거부·SQL privacy/초기상태 권한 회귀를 유지한다. synthetic image를 검사하고, push에서 public Supabase 설정으로 실제 release image를 재빌드한 **뒤에도 실제 image ID를 다시 검사**해야 배포 artifact를 만들 수 있다. 앞선 synthetic pass를 최종 release 결과로 재사용하지 않는다. 원문 container.log 수집/upload는 제거한다. 운영 Supabase·메일·RLS를 변경하거나 실제 고객 요청을 보내지 않는다.
