<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import ProjectCard from "../components/ProjectCard.vue";
import { applyToProject, getProjects } from "../services/api";
import { getAccessToken } from "../services/auth";

const projects = ref([]);
const selectedSkill = ref("");
const selectedInterest = ref("");
const loading = ref(true);
const error = ref("");
const applicationStates = ref({});
const route = useRoute();
const router = useRouter();

const skills = ["Vue", "Node.js", "Express", "Figma", "JavaScript"];
const interests = ["AI 서비스", "커뮤니티", "협업", "취업 포트폴리오", "네트워킹"];

const loadProjects = async () => {
  loading.value = true;
  error.value = "";

  try {
    const data = await getProjects({
      skill: selectedSkill.value,
      interest: selectedInterest.value
    });
    projects.value = data.items;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const resultLabel = computed(() => `${projects.value.length}개 프로젝트`);
const hasActiveFilters = computed(() => Boolean(selectedSkill.value || selectedInterest.value));
const getApplicationState = (project) => applicationStates.value[project.id] || {};

const clearFilters = () => {
  selectedSkill.value = "";
  selectedInterest.value = "";
};

const setApplicationState = (projectId, nextState) => {
  applicationStates.value = {
    ...applicationStates.value,
    [projectId]: {
      ...applicationStates.value[projectId],
      ...nextState
    }
  };
};

const redirectToLogin = () =>
  router.push({
    name: "login",
    query: { redirect: route.fullPath }
  });

const handleApply = async (project) => {
  const token = await getAccessToken();

  if (!token) {
    await redirectToLogin();
    return;
  }

  setApplicationState(project.id, {
    loading: true,
    error: "",
    message: ""
  });

  try {
    await applyToProject(token, project.id, {
      message: `${project.title} 프로젝트에 참여하고 싶습니다.`
    });
    setApplicationState(project.id, {
      loading: false,
      applied: true,
      message: "지원 요청이 접수되었습니다."
    });
  } catch (err) {
    setApplicationState(project.id, {
      loading: false,
      applied: false,
      error: err.message
    });
  }
};

onMounted(loadProjects);
watch([selectedSkill, selectedInterest], loadProjects);
</script>

<template>
  <PageHeader
    eyebrow="Community"
    title="커뮤니티/협업 모집"
    description="관심 분야와 기술 스택을 기준으로 프로젝트 모집 글을 탐색합니다."
  />

  <section class="filter-panel" aria-label="프로젝트 필터">
    <label>
      기술 스택
      <select v-model="selectedSkill">
        <option value="">전체</option>
        <option v-for="skill in skills" :key="skill" :value="skill">{{ skill }}</option>
      </select>
    </label>

    <label>
      관심 분야
      <select v-model="selectedInterest">
        <option value="">전체</option>
        <option v-for="interest in interests" :key="interest" :value="interest">
          {{ interest }}
        </option>
      </select>
    </label>

    <strong class="result-count">{{ resultLabel }}</strong>
    <button type="button" class="secondary filter-reset" :disabled="!hasActiveFilters" @click="clearFilters">
      필터 초기화
    </button>
  </section>

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <section v-else class="project-grid" aria-label="프로젝트 목록">
    <ProjectCard
      v-for="project in projects"
      :key="project.id"
      :project="project"
      :application-state="getApplicationState(project)"
      @apply="handleApply"
    />
    <div v-if="projects.length === 0" class="state-box">
      조건에 맞는 프로젝트가 없습니다. 필터를 변경해보세요.
    </div>
  </section>
</template>
