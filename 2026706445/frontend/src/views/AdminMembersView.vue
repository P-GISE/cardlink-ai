<script setup>
import { computed, onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import { getAdminMembers, updateAdminMemberPublication } from "../services/api";
import { getAccessToken } from "../services/auth";

const members = ref([]);
const loading = ref(true);
const error = ref("");
const search = ref("");
const savingMemberId = ref("");

const filteredMembers = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return members.value;

  return members.value.filter((member) =>
    [member.displayName, member.email, member.role, member.slug]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword))
  );
});

onMounted(async () => {
  try {
    const token = await getAccessToken();
    const data = await getAdminMembers(token);
    members.value = data.items || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const togglePublication = async (member) => {
  savingMemberId.value = member.id;
  error.value = "";

  try {
    const token = await getAccessToken();
    const updated = await updateAdminMemberPublication(token, member.id, {
      isPublished: !member.isPublished
    });
    members.value = members.value.map((item) => (item.id === updated.id ? updated : item));
  } catch (err) {
    error.value = err.message;
  } finally {
    savingMemberId.value = "";
  }
};
</script>

<template>
  <PageHeader
    eyebrow="Admin"
    title="회원 관리"
    description="가입자와 공개 전자명함 상태를 검색하고 운영 상태를 확인합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="admin-panel">
    <div class="filter-panel admin-filter" aria-label="회원 검색">
      <label>
        회원 검색
        <input v-model="search" type="search" placeholder="이름, 이메일, 역할, 공개 주소" />
      </label>
      <strong class="result-count">{{ filteredMembers.length }}명</strong>
    </div>

    <div class="admin-table" role="table" aria-label="회원 목록">
      <div class="admin-table-row admin-table-head" role="row">
        <span>회원</span>
        <span>역할</span>
        <span>상태</span>
        <span>가입일</span>
        <span>관리</span>
      </div>
      <article v-for="member in filteredMembers" :key="member.id" class="admin-table-row" role="row">
        <div>
          <strong>{{ member.displayName || "이름 없음" }}</strong>
          <p>{{ member.email || member.slug }}</p>
        </div>
        <span>{{ member.role || "역할 없음" }}</span>
        <span class="status-pill">{{ member.isPublished ? "공개" : "비공개" }}</span>
        <span>{{ member.createdAt ? new Date(member.createdAt).toLocaleDateString() : "-" }}</span>
        <div class="member-actions">
          <button
            class="secondary compact"
            type="button"
            :disabled="savingMemberId === member.id"
            @click="togglePublication(member)"
          >
            {{ savingMemberId === member.id ? "저장 중" : member.isPublished ? "숨김" : "공개" }}
          </button>
        </div>
      </article>
    </div>

    <div v-if="filteredMembers.length === 0" class="state-box">검색 조건에 맞는 회원이 없습니다.</div>
  </section>
</template>
