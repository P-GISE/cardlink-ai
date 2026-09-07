<template>
  <section class="hero-section product-hero">
    <div class="hero-copy">
      <p class="eyebrow">Business Card Workspace</p>
      <h1>전자명함을 만들고, 협업 기회를 바로 연결하세요</h1>
      <p>
        CardLink AI는 로그인 기반 전자명함 제작, 커뮤니티 탐색, 추천 프로필 확인을
        하나의 흐름으로 묶은 네트워킹 서비스입니다.
      </p>
      <div class="hero-actions">
        <RouterLink to="/profile/edit" class="primary">전자명함 만들기</RouterLink>
        <RouterLink to="/community" class="secondary">프로젝트 찾기</RouterLink>
      </div>
      <dl class="metric-strip">
        <div>
          <dt>공개 탐색</dt>
          <dd>비회원 가능</dd>
        </div>
        <div>
          <dt>명함 제작</dt>
          <dd>로그인 필요</dd>
        </div>
        <div>
          <dt>컨택 요청</dt>
          <dd>승인 기반</dd>
        </div>
      </dl>
    </div>

    <div class="dashboard-preview" aria-label="서비스 미리보기">
      <div class="preview-toolbar">
        <span></span>
        <span></span>
        <span></span>
        <strong>Card Studio</strong>
      </div>
      <div class="preview-profile">
        <div class="avatar small">C</div>
        <div>
          <p class="eyebrow">Published Card</p>
          <strong>프론트엔드 개발자</strong>
          <span>Vue · Node.js · Product UI</span>
        </div>
      </div>
      <div class="preview-list">
        <div>
          <span>추천 매칭</span>
          <strong>94%</strong>
        </div>
        <div>
          <span>컨택 요청</span>
          <strong>승인 대기</strong>
        </div>
        <div>
          <span>공개 링크</span>
          <strong>/profiles/cardlink</strong>
        </div>
      </div>
    </div>
  </section>

  <section class="content-section">
    <div class="section-title">
      <p class="eyebrow">Quick Start</p>
      <h2>빠른 시작</h2>
    </div>
    <div class="home-quick-start">
      <RouterLink to="/profile/edit" class="quick-start-card">
        <span class="card-index">01</span>
        <strong>전자명함 만들기</strong>
        <p>이름, 역할, 연락처, 프로젝트 경험을 입력해 공개 가능한 전자명함을 만듭니다.</p>
      </RouterLink>
      <RouterLink to="/community" class="quick-start-card">
        <span class="card-index">02</span>
        <strong>프로젝트 찾기</strong>
        <p>기술 스택과 관심 분야로 협업 모집 글을 좁혀보고 바로 참가 요청을 보냅니다.</p>
      </RouterLink>
      <RouterLink to="/requests/sent" class="quick-start-card">
        <span class="card-index">03</span>
        <strong>내 요청 확인</strong>
        <p>내가 보낸 컨택 요청과 프로젝트 참가 신청의 접수, 승인, 거절 상태를 확인합니다.</p>
      </RouterLink>
    </div>
  </section>
</template>
