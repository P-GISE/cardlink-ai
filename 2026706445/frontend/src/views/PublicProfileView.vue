<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import ProfileCard from "../components/ProfileCard.vue";
import SharePanel from "../components/SharePanel.vue";
import { getProfileBySlug } from "../services/api";

const route = useRoute();
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
    shareUrl: `${window.location.origin}/profiles/${profile.value.slug}`
  };
});

onMounted(async () => {
  try {
    profile.value = await getProfileBySlug(route.params.slug);
  } catch (err) {
    error.value = "공개 전자명함을 찾을 수 없습니다.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    eyebrow="Public Card"
    title="공개 전자명함"
    description="QR 링크로 공유된 전자명함입니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else-if="profileForCard" class="profile-layout">
    <ProfileCard :profile="profileForCard" />
    <SharePanel :share-url="profileForCard.shareUrl" />
  </section>
</template>
