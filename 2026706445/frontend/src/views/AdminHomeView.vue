<script setup>
import { onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { getAdminOverview } from "../services/api";
import { getAccessToken } from "../services/auth";

const overview = ref(null);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const token = await getAccessToken();
    overview.value = await getAdminOverview(token);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    eyebrow="Admin"
    title="관리자"
    description="실물 명함 제작 요청과 운영 처리가 필요한 항목을 관리합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <template v-else>
    <section class="summary-cards admin-summary" aria-label="관리자 운영 요약">
      <div v-for="card in overview?.cards || []" :key="card.key" class="summary-card">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </div>
    </section>

    <section class="admin-dashboard-grid" aria-label="관리자 메뉴">
      <RouterLink class="feature-card" to="/admin/members">
        <span class="card-index">01</span>
        <h3>회원 관리</h3>
        <p>가입자와 공개 전자명함 상태를 확인하고 운영 이슈를 빠르게 파악합니다.</p>
      </RouterLink>
      <RouterLink class="feature-card" to="/admin/requests">
        <span class="card-index">02</span>
        <h3>전체 요청 관리</h3>
        <p>컨택 요청과 프로젝트 참가 신청을 한 화면에서 모니터링합니다.</p>
      </RouterLink>
      <RouterLink class="feature-card" to="/admin/audit-logs">
        <span class="card-index">03</span>
        <h3>운영 로그</h3>
        <p>주문, 컨택, 참가 신청 등 주요 운영 이벤트를 시간순으로 확인합니다.</p>
      </RouterLink>
      <RouterLink class="feature-card" to="/admin/physical-card-orders">
        <span class="card-index">04</span>
        <h3>실물 명함 주문 관리</h3>
        <p>전체 주문을 확인하고 제작, 배송, 완료 상태로 변경합니다.</p>
      </RouterLink>
    </section>

    <section class="admin-panel" aria-label="최근 운영 활동">
      <div class="panel-heading">
        <p class="eyebrow">Recent Activity</p>
        <h2>최근 운영 활동</h2>
        <p>관리자가 먼저 확인해야 할 주문과 요청을 최신순으로 보여줍니다.</p>
      </div>
      <div class="admin-list">
        <article v-for="activity in overview?.recentActivity || []" :key="activity.id" class="admin-list-row">
          <div>
            <strong>{{ activity.action }}</strong>
            <p>{{ activity.actor }} → {{ activity.target }}</p>
          </div>
          <span class="status-pill">{{ activity.statusLabel }}</span>
        </article>
        <div v-if="!overview?.recentActivity?.length" class="state-box">최근 운영 활동이 없습니다.</div>
      </div>
    </section>
  </template>
</template>
