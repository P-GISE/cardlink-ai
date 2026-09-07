<script setup>
import SkillBadge from "./SkillBadge.vue";

defineProps({
  user: {
    type: Object,
    required: true
  },
  contactState: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(["contact"]);
</script>

<template>
  <article class="recommendation-card">
    <div class="recommendation-head">
      <div>
        <h2>{{ user.name }}</h2>
        <p class="role">{{ user.role }}</p>
      </div>
      <div class="score">{{ user.matchScore }}%</div>
    </div>
    <p>{{ user.headline }}</p>
    <div class="badge-row">
      <SkillBadge v-for="skill in user.skills" :key="skill" :label="skill" />
    </div>
    <div class="reason-box">{{ user.reason }}</div>
    <div class="card-actions">
      <button
        class="secondary full"
        type="button"
        :disabled="contactState.loading || contactState.requested"
        @click="$emit('contact', user)"
      >
        <span v-if="contactState.loading">요청 중...</span>
        <span v-else-if="contactState.requested">요청 완료</span>
        <span v-else>컨택 요청</span>
      </button>
      <p v-if="contactState.message" class="inline-status success">
        {{ contactState.message }}
      </p>
      <RouterLink v-if="contactState.requested" to="/requests/sent" class="text-link">
        내 요청 상태 보기
      </RouterLink>
      <p v-if="contactState.error" class="inline-status error">
        {{ contactState.error }}
      </p>
    </div>
  </article>
</template>
