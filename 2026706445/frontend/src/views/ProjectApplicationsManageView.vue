<script setup>
import { computed, onMounted, ref } from "vue";
import ErrorState from "../components/ErrorState.vue";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import {
  createMyProject,
  decideProjectApplication,
  getMyProjects,
  getOwnedProjectApplications,
  updateMyProject
} from "../services/api";
import { getAccessToken } from "../services/auth";

const applications = ref([]);
const projects = ref([]);
const loading = ref(true);
const error = ref("");
const updatingId = ref("");
const savingProject = ref(false);

const emptyProjectForm = () => ({
  id: "",
  title: "",
  description: "",
  status: "recruiting",
  deadline: "",
  roles: "",
  skills: "",
  interests: "",
  isPublished: true
});

const projectForm = ref(emptyProjectForm());

const statusLabels = {
  planning: "기획",
  recruiting: "모집중",
  closed: "마감",
  pending: "대기",
  accepted: "승인",
  rejected: "거절",
  withdrawn: "철회"
};

const isEditingProject = computed(() => Boolean(projectForm.value.id));

const splitList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (values = []) => values.join(", ");

const toProjectPayload = () => ({
  title: projectForm.value.title,
  description: projectForm.value.description,
  status: projectForm.value.status,
  deadline: projectForm.value.deadline || null,
  roles: splitList(projectForm.value.roles),
  skills: splitList(projectForm.value.skills),
  interests: splitList(projectForm.value.interests),
  isPublished: projectForm.value.isPublished
});

const applyProjectToForm = (project) => {
  projectForm.value = {
    id: project.id,
    title: project.title || "",
    description: project.description || "",
    status: project.status || "recruiting",
    deadline: project.deadline || "",
    roles: joinList(project.roles),
    skills: joinList(project.skills),
    interests: joinList(project.interests),
    isPublished: Boolean(project.isPublished)
  };
};

const resetProjectForm = () => {
  projectForm.value = emptyProjectForm();
};

const loadDashboard = async () => {
  loading.value = true;
  error.value = "";

  try {
    const token = await getAccessToken();
    const [applicationData, projectData] = await Promise.all([
      getOwnedProjectApplications(token),
      getMyProjects(token)
    ]);
    applications.value = applicationData.items || [];
    projects.value = projectData.items || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const saveProject = async () => {
  savingProject.value = true;
  error.value = "";

  try {
    const token = await getAccessToken();
    const payload = toProjectPayload();
    const saved = isEditingProject.value
      ? await updateMyProject(token, projectForm.value.id, payload)
      : await createMyProject(token, payload);

    const exists = projects.value.some((project) => project.id === saved.id);
    projects.value = exists
      ? projects.value.map((project) => (project.id === saved.id ? saved : project))
      : [saved, ...projects.value];
    resetProjectForm();
  } catch (err) {
    error.value = err.message;
  } finally {
    savingProject.value = false;
  }
};

const handleDecision = async (application, status) => {
  updatingId.value = application.id;
  error.value = "";

  try {
    const token = await getAccessToken();
    const updated = await decideProjectApplication(token, application.id, { status });
    applications.value = applications.value.map((item) =>
      item.id === application.id
        ? {
            ...item,
            status: updated.status,
            updatedAt: updated.updatedAt
          }
        : item
    );
  } catch (err) {
    error.value = err.message;
  } finally {
    updatingId.value = "";
  }
};

onMounted(loadDashboard);
</script>

<template>
  <PageHeader
    eyebrow="Projects"
    title="프로젝트 관리"
    description="모집글을 작성하고 공개 여부를 조정한 뒤 들어온 참가 신청을 처리합니다."
  />

  <LoadingState v-if="loading" />
  <ErrorState v-else-if="error" :message="error" />

  <div v-else class="project-manager">
    <section class="admin-panel" aria-label="프로젝트 모집글 작성">
      <div class="panel-heading">
        <p class="eyebrow">{{ isEditingProject ? "Edit Project" : "New Project" }}</p>
        <h2>{{ isEditingProject ? "모집글 수정" : "모집글 작성" }}</h2>
        <p>역할, 기술, 관심사는 쉼표로 구분해 입력합니다.</p>
      </div>

      <form class="form-grid" @submit.prevent="saveProject">
        <div class="form-grid two">
          <label>
            제목
            <input v-model="projectForm.title" type="text" maxlength="120" required />
          </label>
          <label>
            마감일
            <input v-model="projectForm.deadline" type="date" />
          </label>
        </div>

        <label>
          설명
          <textarea v-model="projectForm.description" rows="5" maxlength="2000" required />
        </label>

        <div class="form-grid three">
          <label>
            상태
            <select v-model="projectForm.status">
              <option value="planning">기획</option>
              <option value="recruiting">모집중</option>
              <option value="closed">마감</option>
            </select>
          </label>
          <label>
            역할
            <input v-model="projectForm.roles" type="text" placeholder="백엔드, 디자이너" />
          </label>
          <label>
            기술
            <input v-model="projectForm.skills" type="text" placeholder="Vue, Node.js" />
          </label>
        </div>

        <div class="form-grid two align-end">
          <label>
            관심사
            <input v-model="projectForm.interests" type="text" placeholder="AI 서비스, 운영" />
          </label>
          <label class="inline-check">
            <input v-model="projectForm.isPublished" type="checkbox" />
            커뮤니티에 공개
          </label>
        </div>

        <div class="card-actions">
          <button type="submit" class="primary" :disabled="savingProject">
            {{ savingProject ? "저장 중..." : isEditingProject ? "수정 저장" : "모집글 등록" }}
          </button>
          <button type="button" class="secondary" :disabled="savingProject" @click="resetProjectForm">
            새 글 작성
          </button>
        </div>
      </form>
    </section>

    <section class="project-management-grid" aria-label="내 프로젝트 목록">
      <article v-for="project in projects" :key="project.id" class="contact-request-card">
        <div class="contact-request-main">
          <div>
            <p class="eyebrow">{{ statusLabels[project.status] || project.status }}</p>
            <h2>{{ project.title }}</h2>
            <p class="role">{{ project.deadline ? `${project.deadline} 마감` : "마감일 없음" }}</p>
          </div>
          <span class="status-pill">{{ project.isPublished ? "공개" : "비공개" }}</span>
        </div>
        <p class="contact-message">{{ project.description }}</p>
        <div class="tag-list compact-tags">
          <span v-for="skill in project.skills" :key="skill">{{ skill }}</span>
          <span v-for="role in project.roles" :key="role">{{ role }}</span>
        </div>
        <div class="card-actions">
          <button type="button" class="secondary" @click="applyProjectToForm(project)">수정</button>
        </div>
      </article>

      <div v-if="projects.length === 0" class="state-box">아직 작성한 프로젝트 모집글이 없습니다.</div>
    </section>

    <section class="contact-requests-view" aria-label="프로젝트 참가 신청 목록">
      <div class="panel-heading">
        <p class="eyebrow">Applications</p>
        <h2>참가 신청</h2>
        <p>내 프로젝트에 들어온 참가 신청을 승인하거나 거절합니다.</p>
      </div>

      <div v-if="applications.length === 0" class="state-box">
        아직 내 프로젝트에 들어온 참가 신청이 없습니다.
      </div>

      <article v-for="application in applications" :key="application.id" class="contact-request-card">
        <div class="contact-request-main">
          <div>
            <p class="eyebrow">{{ application.project?.title || "프로젝트" }}</p>
            <h2>{{ application.applicant?.displayName || "알 수 없는 지원자" }}</h2>
            <p class="role">{{ application.applicant?.role || "역할 정보 없음" }}</p>
          </div>
          <span class="status-pill">{{ statusLabels[application.status] || application.status }}</span>
        </div>

        <p v-if="application.applicant?.headline" class="muted">{{ application.applicant.headline }}</p>
        <p class="contact-message">{{ application.message || "메시지 없이 참가를 신청했습니다." }}</p>

        <div class="contact-request-meta">
          <span v-if="application.createdAt">신청일 {{ new Date(application.createdAt).toLocaleDateString() }}</span>
          <span>ID {{ application.id }}</span>
        </div>

        <div v-if="application.status === 'pending'" class="card-actions contact-decision-actions">
          <button
            type="button"
            class="primary"
            :disabled="updatingId === application.id"
            @click="handleDecision(application, 'accepted')"
          >
            {{ updatingId === application.id ? "처리 중..." : "승인" }}
          </button>
          <button
            type="button"
            class="secondary"
            :disabled="updatingId === application.id"
            @click="handleDecision(application, 'rejected')"
          >
            거절
          </button>
        </div>
      </article>
    </section>
  </div>
</template>
