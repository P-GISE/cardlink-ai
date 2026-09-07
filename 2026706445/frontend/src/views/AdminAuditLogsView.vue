<script setup>
import { onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { getAdminAuditLogs } from "../services/api";
import { getAccessToken } from "../services/auth";

const logs = ref([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const token = await getAccessToken();
    const data = await getAdminAuditLogs(token);
    logs.value = data.items || [];
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
    title="운영 로그"
    description="주문, 컨택 요청, 프로젝트 참가 신청 등 주요 운영 이벤트를 시간순으로 확인합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="admin-panel">
    <div class="admin-list" aria-label="운영 로그 목록">
      <article v-for="log in logs" :key="log.id" class="admin-list-row">
        <div>
          <strong>{{ log.action }}</strong>
          <p>{{ log.actor }} → {{ log.target }}</p>
          <span v-if="log.createdAt" class="muted">{{ new Date(log.createdAt).toLocaleString() }}</span>
        </div>
        <span class="status-pill">{{ log.statusLabel }}</span>
      </article>
    </div>

    <div v-if="logs.length === 0" class="state-box">표시할 운영 로그가 없습니다.</div>
  </section>
</template>
