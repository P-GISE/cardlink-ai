<script setup>
import SkillBadge from "./SkillBadge.vue";

defineProps({
  project: {
    type: Object,
    required: true
  },
  applicationState: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(["apply"]);
</script>

<template>
  <article class="project-card">
    <div class="card-topline">
      <span class="status-pill">{{ project.status }}</span>
      <span>{{ project.deadline }} 마감</span>
    </div>
    <h2>{{ project.title }}</h2>
    <p>{{ project.description }}</p>

    <div class="meta-block">
      <strong>모집 역할</strong>
      <div class="badge-row">
        <SkillBadge v-for="role in project.roles" :key="role" :label="role" />
      </div>
    </div>

    <div class="meta-block">
      <strong>기술 스택</strong>
      <div class="badge-row">
        <SkillBadge v-for="skill in project.skills" :key="skill" :label="skill" />
      </div>
    </div>

    <div class="card-actions">
      <button
        class="primary full"
        type="button"
        :disabled="applicationState.loading || applicationState.applied"
        @click="$emit('apply', project)"
      >
        <span v-if="applicationState.loading">지원 중...</span>
        <span v-else-if="applicationState.applied">지원 완료</span>
        <span v-else>참가/지원하기</span>
      </button>
      <p v-if="applicationState.message" class="inline-status success">
        {{ applicationState.message }}
      </p>
      <RouterLink v-if="applicationState.applied" to="/requests/sent" class="text-link">
        내 요청 상태 보기
      </RouterLink>
      <p v-if="applicationState.error" class="inline-status error">
        {{ applicationState.error }}
      </p>
    </div>
  </article>
</template>
