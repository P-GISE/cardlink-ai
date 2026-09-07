<script setup>
import { computed, onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { decideContactRequest, getContactRequests } from "../services/api";
import { getAccessToken } from "../services/auth";

const requests = ref([]);
const loading = ref(true);
const error = ref("");
const updatingId = ref("");
const statusFilter = ref("all");

const statusOptions = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" }
];

const statusLabels = {
  pending: "대기",
  approved: "승인",
  rejected: "거절"
};

const filteredRequests = computed(() => {
  if (statusFilter.value === "all") return requests.value;
  return requests.value.filter((item) => item.status === statusFilter.value);
});

const requestSummary = computed(() => [
  { label: "전체 요청", value: requests.value.length },
  { label: "처리 대기", value: requests.value.filter((item) => item.status === "pending").length },
  { label: "승인 완료", value: requests.value.filter((item) => item.status === "approved").length },
  { label: "거절", value: requests.value.filter((item) => item.status === "rejected").length }
]);

const loadContactRequests = async () => {
  loading.value = true;
  error.value = "";

  try {
    const token = await getAccessToken();
    const data = await getContactRequests(token);
    requests.value = data.items || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleDecision = async (requestId, status) => {
  updatingId.value = requestId;
  error.value = "";

  try {
    const token = await getAccessToken();
    const updated = await decideContactRequest(token, requestId, { status });
    requests.value = requests.value.map((request) =>
      request.id === requestId
        ? {
            ...request,
            status: updated.status,
            decidedAt: updated.decidedAt
          }
        : request
    );
  } catch (err) {
    error.value = err.message;
  } finally {
    updatingId.value = "";
  }
};

onMounted(loadContactRequests);
</script>

<template>
  <PageHeader
    eyebrow="Contacts"
    title="받은 컨택 요청"
    description="내 전자명함으로 들어온 협업 요청을 확인하고 승인 또는 거절합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="contact-requests-view" aria-label="받은 컨택 요청 목록">
    <div class="summary-cards" aria-label="컨택 요청 요약">
      <div v-for="item in requestSummary" :key="item.label" class="summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <div class="contact-filter-panel" aria-label="컨택 요청 상태 필터">
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

    <div v-if="filteredRequests.length === 0" class="state-box">
      선택한 상태의 컨택 요청이 없습니다.
    </div>

    <article v-for="request in filteredRequests" :key="request.id" class="contact-request-card">
      <div class="contact-request-main">
        <div>
          <p class="eyebrow">Request</p>
          <h2>{{ request.requester?.displayName || "알 수 없는 요청자" }}</h2>
          <p class="role">
            {{ request.requester?.role || "역할 정보 없음" }}
          </p>
        </div>
        <span class="status-pill">{{ statusLabels[request.status] || request.status }}</span>
      </div>

      <p v-if="request.requester?.headline" class="muted">{{ request.requester.headline }}</p>
      <p class="contact-message">{{ request.message || "메시지 없이 컨택을 요청했습니다." }}</p>

      <div class="contact-request-meta">
        <span>요청 유형: {{ request.requestType }}</span>
        <span v-if="request.createdAt">요청일: {{ new Date(request.createdAt).toLocaleDateString() }}</span>
      </div>

      <div v-if="request.status === 'pending'" class="card-actions contact-decision-actions">
        <button
          type="button"
          class="primary"
          :disabled="updatingId === request.id"
          @click="handleDecision(request.id, 'approved')"
        >
          {{ updatingId === request.id ? "처리 중..." : "승인" }}
        </button>
        <button
          type="button"
          class="secondary"
          :disabled="updatingId === request.id"
          @click="handleDecision(request.id, 'rejected')"
        >
          거절
        </button>
      </div>
    </article>
  </section>
</template>
