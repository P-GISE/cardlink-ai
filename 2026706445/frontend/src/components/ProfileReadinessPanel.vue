<script setup>
defineProps({
  readiness: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <aside class="profile-readiness-panel" aria-label="프로필 공개 준비도">
    <div class="readiness-score">
      <p class="eyebrow">Publish Check</p>
      <strong>{{ readiness.score }}%</strong>
      <span>{{ readiness.completed }}/{{ readiness.total }} 완료</span>
    </div>

    <div class="readiness-copy">
      <h2>공개 준비도</h2>
      <p>{{ readiness.isPublished ? "현재 공개 상태입니다." : "아직 비공개 상태입니다." }}</p>
    </div>

    <ul class="readiness-checklist">
      <li
        v-for="item in readiness.items"
        :key="item.key"
        class="checklist-item"
        :class="{ complete: item.complete }"
      >
        <span aria-hidden="true">{{ item.complete ? "✓" : "!" }}</span>
        <div>
          <strong>{{ item.label }}</strong>
          <small>{{ item.complete ? "완료" : item.detail }}</small>
        </div>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.profile-readiness-panel {
  display: grid;
  grid-template-columns: minmax(150px, 0.3fr) minmax(180px, 0.35fr) minmax(0, 1fr);
  gap: 18px;
  align-items: center;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease,
    transform 150ms ease;
}

.readiness-score {
  display: grid;
  gap: 4px;
}

.readiness-score strong {
  color: var(--heading);
  font-size: 2rem;
  font-weight: 750;
  line-height: 1.05;
}

.readiness-score span,
.readiness-copy p,
.checklist-item small {
  color: var(--muted);
  font-size: 0.9rem;
}

.readiness-copy h2 {
  margin: 0 0 6px;
  color: var(--heading);
  font-size: 1.24rem;
  font-weight: 700;
  line-height: 1.3;
}

.readiness-copy p {
  margin: 0;
}

.readiness-checklist {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.checklist-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  min-height: 58px;
  padding: 10px;
  background: var(--amber-soft);
  border: 1px solid #fed7aa;
  border-radius: var(--radius);
}

.checklist-item.complete {
  background: var(--teal-soft);
  border-color: #c7f1df;
}

.checklist-item > span {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: var(--amber);
  font-weight: 800;
  background: #ffffff;
  border: 1px solid #fed7aa;
  border-radius: 999px;
}

.checklist-item.complete > span {
  color: var(--teal);
  border-color: #c7f1df;
}

.checklist-item strong {
  display: block;
  color: var(--heading);
  font-size: 0.92rem;
  line-height: 1.35;
}

.checklist-item small {
  display: block;
  margin-top: 3px;
  line-height: 1.35;
}

@media (max-width: 980px) {
  .profile-readiness-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .readiness-checklist {
    grid-template-columns: 1fr;
  }
}
</style>
