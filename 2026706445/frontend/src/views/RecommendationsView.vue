<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import RecommendationCard from "../components/RecommendationCard.vue";
import { createRecommendationRun, getRecommendations, requestContact } from "../services/api";
import { getAccessToken } from "../services/auth";

const users = ref([]);
const loading = ref(true);
const error = ref("");
const recommendationRun = ref(null);
const runLoading = ref(false);
const runError = ref("");
const runMessage = ref("");
const contactStates = ref({});
const route = useRoute();
const router = useRouter();

const redirectToLogin = () =>
  router.push({
    name: "login",
    query: { redirect: route.fullPath }
  });

const setContactState = (userId, nextState) => {
  contactStates.value = {
    ...contactStates.value,
    [userId]: {
      ...contactStates.value[userId],
      ...nextState
    }
  };
};

const getContactState = (user) => contactStates.value[user.id] || {};

const handleRecommendationRun = async () => {
  const token = await getAccessToken();

  if (!token) {
    await redirectToLogin();
    return;
  }

  runLoading.value = true;
  runError.value = "";
  runMessage.value = "";

  try {
    const data = await createRecommendationRun(token);
    recommendationRun.value = data;
    runMessage.value = `${data.recommendations.length}개 추천 결과가 저장되었습니다.`;
  } catch (err) {
    runError.value = err.message;
  } finally {
    runLoading.value = false;
  }
};

const handleContact = async (user) => {
  const token = await getAccessToken();

  if (!token) {
    await redirectToLogin();
    return;
  }

  const targetSlug = user.slug || user.profileSlug;

  if (!targetSlug) {
    setContactState(user.id, {
      error: "컨택 요청 대상 공개 주소가 없습니다."
    });
    return;
  }

  setContactState(user.id, {
    loading: true,
    error: "",
    message: ""
  });

  try {
    const result = await requestContact(token, targetSlug, {
      message: `${user.name}님과 협업 이야기를 나누고 싶습니다.`
    });
    setContactState(user.id, {
      loading: false,
      requested: true,
      message:
        result.status === "approved"
          ? "연락처가 공개되었습니다."
          : "컨택 요청이 접수되었습니다."
    });
  } catch (err) {
    setContactState(user.id, {
      loading: false,
      requested: false,
      error: err.message
    });
  }
};

onMounted(async () => {
  try {
    const data = await getRecommendations();
    users.value = data.items;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    eyebrow="AI Matching"
    title="추천 프로필"
    description="기술 스택, 관심 분야, 협업 가능성을 바탕으로 추천 이유를 함께 제공합니다."
  />

  <section class="action-panel" aria-label="내 프로필 추천 실행">
    <div>
      <strong>내 전자명함 기준 추천</strong>
      <p>로그인 후 내 프로필을 기준으로 추천 실행 기록을 저장합니다.</p>
    </div>
    <button class="primary" type="button" :disabled="runLoading" @click="handleRecommendationRun">
      {{ runLoading ? "추천 실행 중..." : "내 프로필로 추천 실행" }}
    </button>
  </section>

  <p v-if="runMessage" class="inline-status success">{{ runMessage }}</p>
  <p v-if="runError" class="inline-status error">{{ runError }}</p>

  <section v-if="recommendationRun" class="state-box run-result">
    <h2>최근 추천 실행</h2>
    <p>실행 ID: {{ recommendationRun.run.id }}</p>
    <ul v-if="recommendationRun.recommendations.length">
      <li v-for="item in recommendationRun.recommendations" :key="item.id">
        {{ item.recommendedProfileId }} · {{ item.score }}점 · {{ item.reason }}
      </li>
    </ul>
    <p v-else>조건에 맞는 추천 후보가 없습니다.</p>
  </section>

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="recommendation-grid" aria-label="추천 프로필 목록">
    <RecommendationCard
      v-for="user in users"
      :key="user.id"
      :user="user"
      :contact-state="getContactState(user)"
      @contact="handleContact"
    />
    <div v-if="users.length === 0" class="state-box">
      아직 표시할 추천 프로필이 없습니다.
    </div>
  </section>
</template>
