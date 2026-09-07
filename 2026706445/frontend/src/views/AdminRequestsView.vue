<script setup>
import { computed, onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { getAdminRequests } from "../services/api";
import { getAccessToken } from "../services/auth";

const requests = ref([]);
const loading = ref(true);
const error = ref("");
const statusFilter = ref("all");

const statusOptions = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "accepted", label: "참가 승인" },
  { value: "rejected", label: "거절" }
];

const filteredRequests = computed(() => {
  if (statusFilter.value === "all") return requests.value;
  return requests.value.filter((request) => request.status === statusFilter.value);
});

onMounted(async () => {
  try {
    const token = await getAccessToken();
    const data = await getAdminRequests(token);
    requests.value = data.items || [];
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
    title="전체 요청 관리"
    description="컨택 요청과 프로젝트 참가 신청을 한 화면에서 상태별로 확인합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="contact-requests-view" aria-label="전체 요청 목록">
    <div class="contact-filter-panel" aria-label="요청 상태 필터">
      <button
        v-for="option in statusOptions"
        :key="option.value"
        type="button"
        class="secondary"
        :class="{ active: statusFilter === option.value }"
        @click="statusFilter = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <article v-for="request in filteredRequests" :key="`${request.source}-${request.id}`" class="contact-request-card">
      <div class="contact-request-main">
        <div>
          <p class="eyebrow">{{ request.kind }}</p>
          <h2>{{ request.title }}</h2>
          <p class="role">{{ request.requester }} → {{ request.target }}</p>
        </div>
        <span class="status-pill">{{ request.statusLabel }}</span>
      </div>
      <p class="contact-message">{{ request.message || "메시지 없음" }}</p>
      <div class="contact-request-meta">
        <span v-if="request.createdAt">요청일 {{ new Date(request.createdAt).toLocaleDateString() }}</span>
        <span>{{ request.source }}</span>
      </div>
    </article>

    <div v-if="filteredRequests.length === 0" class="state-box">선택한 상태의 요청이 없습니다.</div>
  </section>
</template>
