<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import ProfileCard from "../components/ProfileCard.vue";
import SharePanel from "../components/SharePanel.vue";
import { getMe } from "../services/api";
import { getAccessToken } from "../services/auth";

const profile = ref(null);
const loading = ref(true);
const error = ref("");

const profileForCard = computed(() => {
  if (!profile.value) return null;

  return {
    ...profile.value,
    name: profile.value.name || profile.value.displayName,
    aiSummary: profile.value.aiSummary || profile.value.bio || "아직 소개문이 없습니다.",
    skills: profile.value.skills || [],
    interests: profile.value.interests || [],
    projects: profile.value.projects || [],
    contact: profile.value.contact || {
      phone: profile.value.phone || "",
      email: profile.value.email || "",
      website: profile.value.websiteUrl || "",
      github: profile.value.githubUrl || "",
      portfolio: profile.value.portfolioUrl || ""
    },
    shareUrl: profile.value.shareUrl || `${window.location.origin}/profiles/${profile.value.slug}`
  };
});

onMounted(async () => {
  try {
    const token = await getAccessToken();
    const data = await getMe(token);
    profile.value = data.profile;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    eyebrow="My Business Card"
    title="내 전자명함"
    description="회원가입 또는 로그인 후 직접 만든 전자명함만 이 화면에 표시됩니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else-if="!profile" class="state-box">
    <h2>아직 생성한 전자명함이 없습니다.</h2>
    <p>기본 모델을 보여주지 않습니다. 먼저 내 이름, 역할, 소개, 연락처 공개 방식을 입력해 전자명함을 생성하세요.</p>
    <RouterLink to="/profile/edit" class="primary">전자명함 생성하기</RouterLink>
  </section>

  <section v-else class="profile-layout">
    <ProfileCard :profile="profileForCard" />
    <div class="profile-side-panel">
      <SharePanel :share-url="profileForCard.shareUrl" />
      <RouterLink to="/profile/edit" class="secondary full">전자명함 수정</RouterLink>
    </div>
  </section>
</template>
