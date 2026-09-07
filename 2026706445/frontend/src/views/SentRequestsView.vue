<script setup>
import { computed, onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { getSentContactRequests, getSentProjectApplications } from "../services/api";
import { getAccessToken } from "../services/auth";

const contactRequests = ref([]);
const projectApplications = ref([]);
const loading = ref(true);
const error = ref("");
const statusFilter = ref("all");

const statusLabels = {
  pending: "대기",
  approved: "승인",
  accepted: "승인",
  rejected: "거절",
  withdrawn: "철회"
};

const statusOptions = [
  { value: "all", label: "전체" },
  { value: "pending", label: "대기" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "거절" }
];

const normalizeStatus = (status) => (status === "accepted" ? "approved" : status);

const combinedRequests = computed(() => {
  const contacts = contactRequests.value.map((request) => ({
    id: `contact-${request.id}`,
    sourceId: request.id,
    kind: "컨택",
    title: request.target?.displayName || "알 수 없는 프로필",
    subtitle: request.target?.role || "추천 프로필",
    message: request.message || "메시지 없이 컨택을 요청했습니다.",
    status: normalizeStatus(request.status),
    rawStatus: request.status,
    createdAt: request.createdAt,
    contact: request.target?.contact
  }));

  const applications = projectApplications.value.map((application) => ({
    id: `project-${application.id}`,
    sourceId: application.id,
    kind: "참가",
    title: application.project?.title || "알 수 없는 프로젝트",
    subtitle: "커뮤니티 프로젝트 지원",
    message: application.message || "메시지 없이 참가를 요청했습니다.",
    status: normalizeStatus(application.status),
    rawStatus: application.status,
    createdAt: application.createdAt
  }));

  return [...contacts, ...applications].sort((left, right) =>
    String(right.createdAt || "").localeCompare(String(left.createdAt || ""))
  );
});

const filteredRequests = computed(() => {
  if (statusFilter.value === "all") return combinedRequests.value;
  return combinedRequests.value.filter((request) => request.status === statusFilter.value);
});

const requestSummary = computed(() => [
  { label: "전체 요청", value: combinedRequests.value.length },
  { label: "처리 대기", value: combinedRequests.value.filter((request) => request.status === "pending").length },
  { label: "승인", value: combinedRequests.value.filter((request) => request.status === "approved").length },
  { label: "거절", value: combinedRequests.value.filter((request) => request.status === "rejected").length }
]);

const loadRequests = async () => {
  loading.value = true;
  error.value = "";

  try {
    const token = await getAccessToken();
    const [contacts, applications] = await Promise.all([
      getSentContactRequests(token),
      getSentProjectApplications(token)
    ]);
    contactRequests.value = contacts.items || [];
    projectApplications.value = applications.items || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(loadRequests);
</script>

<template>
  <PageHeader
    eyebrow="Requests"
    title="내 요청 상태"
    description="컨택 요청과 프로젝트 참가 신청이 접수, 승인, 거절 중 어디까지 진행됐는지 확인합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="contact-requests-view" aria-label="내가 보낸 요청 목록">
    <div class="summary-cards" aria-label="내 요청 요약">
      <div v-for="item in requestSummary" :key="item.label" class="summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

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

    <div v-if="filteredRequests.length === 0" class="state-box">
      선택한 상태의 요청이 없습니다.
    </div>

    <article v-for="request in filteredRequests" :key="request.id" class="contact-request-card">
      <div class="contact-request-main">
        <div>
          <p class="eyebrow">{{ request.kind }}</p>
          <h2>{{ request.title }}</h2>
          <p class="role">{{ request.subtitle }}</p>
        </div>
        <span class="status-pill">{{ statusLabels[request.rawStatus] || request.rawStatus }}</span>
      </div>

      <p class="contact-message">{{ request.message }}</p>

      <div class="contact-request-meta">
        <span v-if="request.createdAt">요청일 {{ new Date(request.createdAt).toLocaleDateString() }}</span>
        <span>ID {{ request.sourceId }}</span>
      </div>

      <div v-if="request.contact" class="state-box">
        <strong>공개된 연락처</strong>
        <p v-if="request.contact.email">이메일: {{ request.contact.email }}</p>
        <p v-if="request.contact.githubUrl">GitHub: {{ request.contact.githubUrl }}</p>
        <p v-if="request.contact.portfolioUrl">포트폴리오: {{ request.contact.portfolioUrl }}</p>
      </div>
    </article>
  </section>
</template>
