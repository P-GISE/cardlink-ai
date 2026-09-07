<script setup>
import { computed } from "vue";
import SkillBadge from "./SkillBadge.vue";
import { normalizeExternalUrl } from "../services/profileForm";

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
});

const contactLinks = computed(() => ({
  website: normalizeExternalUrl(props.profile.contact?.website),
  github: normalizeExternalUrl(props.profile.contact?.github),
  portfolio: normalizeExternalUrl(props.profile.contact?.portfolio)
}));
</script>

<template>
  <article class="profile-card">
    <div class="profile-hero">
      <div class="avatar" aria-hidden="true">{{ profile.name?.slice(0, 1) || "C" }}</div>
      <div>
        <p class="eyebrow">{{ profile.position || profile.role }}</p>
        <h2>{{ profile.name }}</h2>
        <p>{{ profile.organization || profile.headline }}</p>
      </div>
    </div>

    <div class="business-card-line">
      <strong>{{ profile.cardTagline || profile.headline }}</strong>
      <span v-if="profile.businessAddress">{{ profile.businessAddress }}</span>
    </div>

    <div class="ai-summary">{{ profile.aiSummary }}</div>

    <section>
      <h3>기술 스택</h3>
      <div class="badge-row">
        <SkillBadge v-for="skill in profile.skills" :key="skill" :label="skill" />
        <span v-if="profile.skills.length === 0" class="muted">등록된 기술 스택이 없습니다.</span>
      </div>
    </section>

    <section>
      <h3>프로젝트 경험</h3>
      <div class="timeline">
        <div v-for="project in profile.projects" :key="project.name" class="timeline-item">
          <strong>{{ project.name }}</strong>
          <span>{{ project.period }}</span>
          <p>{{ project.description }}</p>
        </div>
        <p v-if="profile.projects.length === 0" class="muted">등록된 프로젝트 경험이 없습니다.</p>
      </div>
    </section>

    <section>
      <h3>관심 분야</h3>
      <div class="badge-row">
        <SkillBadge v-for="interest in profile.interests" :key="interest" :label="interest" />
        <span v-if="profile.interests.length === 0" class="muted">등록된 관심 분야가 없습니다.</span>
      </div>
    </section>

    <section class="contact-grid" aria-label="연락처">
      <a v-if="profile.contact.phone" :href="`tel:${profile.contact.phone}`">{{ profile.contact.phone }}</a>
      <a v-if="profile.contact.email" :href="`mailto:${profile.contact.email}`">{{ profile.contact.email }}</a>
      <a v-if="contactLinks.website" :href="contactLinks.website" target="_blank" rel="noreferrer">Website</a>
      <a v-if="contactLinks.github" :href="contactLinks.github" target="_blank" rel="noreferrer">GitHub</a>
      <a v-if="contactLinks.portfolio" :href="contactLinks.portfolio" target="_blank" rel="noreferrer">Portfolio</a>
      <span v-if="!profile.contact.phone && !profile.contact.email && !contactLinks.website && !contactLinks.github && !contactLinks.portfolio" class="muted">
        공개된 연락처가 없습니다.
      </span>
    </section>
  </article>
</template>
