<template>
  <PageHeader
    eyebrow="Create Card"
    title="전자명함 만들기"
    description="로그인한 사용자만 전자명함을 생성하고 저장할 수 있습니다."
  />

  <LoadingState v-if="loading" />

  <form v-else class="profile-editor" @submit.prevent="saveProfile">
    <ProfileReadinessPanel :readiness="profileReadiness" />

    <section class="form-section">
      <div class="panel-heading">
        <p class="eyebrow">Identity</p>
        <h2>기본 정보</h2>
        <p>공개 전자명함에서 가장 먼저 보이는 정보입니다.</p>
      </div>

      <div class="form-grid two">
        <label>
          공개 주소
          <input v-model="form.slug" type="text" required placeholder="my-card" />
        </label>

        <label>
          이름
          <input v-model="form.displayName" type="text" required placeholder="홍길동" />
        </label>
      </div>

      <div class="form-grid two">
        <label>
          역할
          <input v-model="form.role" type="text" placeholder="프론트엔드 개발자" />
        </label>

        <label>
          한 줄 소개
          <input v-model="form.headline" type="text" placeholder="사용자 경험을 개선하는 개발자" />
        </label>
      </div>

      <label>
        소개문
        <textarea v-model="form.bio" rows="5" placeholder="나의 경험, 기술, 협업 성향을 적어주세요." />
      </label>

      <div class="form-grid two">
        <label>
          회사/소속
          <input v-model="form.organization" type="text" placeholder="CardLink Studio" />
        </label>

        <label>
          직책/직급
          <input v-model="form.position" type="text" placeholder="Founder" />
        </label>
      </div>

      <label>
        명함용 짧은 문구
        <input v-model="form.cardTagline" type="text" placeholder="QR로 연결되는 전자명함" />
      </label>
    </section>

    <section class="form-section">
      <div class="panel-heading">
        <p class="eyebrow">Experience</p>
        <h2>개발 스택과 프로젝트 경험</h2>
        <p>전자명함에 표시할 기술과 대표 프로젝트를 입력합니다.</p>
      </div>

      <label>
        개발 스택
        <textarea
          v-model="form.skillsText"
          rows="3"
          placeholder="Vue, Node.js, Supabase처럼 쉼표 또는 줄바꿈으로 입력"
        />
      </label>

      <div class="project-experience-list">
        <div
          v-for="(project, index) in form.projects"
          :key="index"
          class="project-experience"
        >
          <div class="project-row-header">
            <strong>프로젝트 경험 {{ index + 1 }}</strong>
            <button
              v-if="form.projects.length > 1"
              type="button"
              class="text-button"
              @click="removeProjectExperience(index)"
            >
              삭제
            </button>
          </div>

          <div class="form-grid two">
            <label>
              프로젝트명
              <input v-model="project.name" type="text" placeholder="전자명함 플랫폼" />
            </label>
            <label>
              기간
              <input v-model="project.period" type="text" placeholder="2026.03 - 2026.05" />
            </label>
          </div>

          <label>
            설명
            <textarea v-model="project.description" rows="3" placeholder="담당 역할과 성과를 적어주세요." />
          </label>

          <label>
            프로젝트 URL
            <input v-model="project.projectUrl" type="url" placeholder="https://example.com/project" />
          </label>
        </div>
      </div>

      <button type="button" class="secondary add-row-button" @click="addProjectExperience">
        프로젝트 경험 추가
      </button>
    </section>

    <section class="form-section">
      <div class="panel-heading">
        <p class="eyebrow">Links</p>
        <h2>연락처와 링크</h2>
        <p>컨택 승인 후 공유할 대표 연락 수단을 입력합니다.</p>
      </div>

      <div class="form-grid three">
        <label>
          휴대폰 번호
          <input v-model="form.phone" type="tel" placeholder="010-1234-5678" />
        </label>

        <label>
          연락 이메일
          <input v-model="form.email" type="email" placeholder="me@example.com" />
        </label>

        <label>
          GitHub URL
          <input v-model="form.githubUrl" type="url" placeholder="https://github.com/username" />
        </label>

        <label>
          포트폴리오 URL
          <input v-model="form.portfolioUrl" type="url" placeholder="https://example.com" />
        </label>
      </div>

      <div class="form-grid two">
        <label>
          대표 웹사이트
          <input v-model="form.websiteUrl" type="url" placeholder="https://company.example.com" />
        </label>

        <label>
          업무 지역/주소
          <input v-model="form.businessAddress" type="text" placeholder="서울시 강남구" />
        </label>
      </div>
    </section>

    <section class="form-section compact">
      <div class="form-grid two align-end">
        <label>
          연락처 공개 방식
          <select v-model="form.contactPolicy">
            <option value="approval_required">승인 후 공개</option>
            <option value="instant">로그인 사용자에게 즉시 공개</option>
          </select>
        </label>

        <label class="inline-check">
          <input v-model="form.isPublished" type="checkbox" />
          공개 프로필로 게시
        </label>
      </div>
    </section>

    <div class="editor-footer">
      <button type="submit" class="primary" :disabled="saving">
        {{ saving ? "저장 중..." : "전자명함 저장" }}
      </button>
    </div>

    <p v-if="message" class="state-box" :class="{ error: isError }">{{ message }}</p>
  </form>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import LoadingState from "../components/LoadingState.vue";
import PageHeader from "../components/PageHeader.vue";
import ProfileReadinessPanel from "../components/ProfileReadinessPanel.vue";
import { getMe, saveMyProfile } from "../services/api";
import { getAccessToken, getCurrentUser } from "../services/auth";
import {
  buildProfileReadiness,
  emptyProjectExperience,
  formatListInput,
  normalizeProjects,
  parseListInput
} from "../services/profileForm";

const router = useRouter();

const loading = ref(true);
const saving = ref(false);
const message = ref("");
const isError = ref(false);

const form = reactive({
  slug: "",
  displayName: "",
  role: "",
  headline: "",
  bio: "",
  organization: "",
  position: "",
  phone: "",
  websiteUrl: "",
  businessAddress: "",
  cardTagline: "",
  email: "",
  githubUrl: "",
  portfolioUrl: "",
  skillsText: "",
  projects: [emptyProjectExperience()],
  contactPolicy: "approval_required",
  isPublished: true
});

const buildDefaultSlug = (email = "") =>
  String(email)
    .split("@")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "";

const applyAccountDefaults = (user) => {
  if (!user) return;

  const fullName = user.user_metadata?.full_name || "";
  if (!form.displayName && fullName) form.displayName = fullName;
  if (!form.email && user.email) form.email = user.email;
  if (!form.slug && user.email) form.slug = buildDefaultSlug(user.email);
};

const fillForm = (profile) => {
  if (!profile) return;

  form.slug = profile.slug || "";
  form.displayName = profile.displayName || profile.name || "";
  form.role = profile.role || "";
  form.headline = profile.headline || "";
  form.bio = profile.bio || profile.aiSummary || "";
  form.organization = profile.organization || "";
  form.position = profile.position || "";
  form.phone = profile.phone || "";
  form.websiteUrl = profile.websiteUrl || "";
  form.businessAddress = profile.businessAddress || "";
  form.cardTagline = profile.cardTagline || "";
  form.email = profile.email || profile.contact?.email || "";
  form.githubUrl = profile.githubUrl || profile.contact?.github || "";
  form.portfolioUrl = profile.portfolioUrl || profile.contact?.portfolio || "";
  form.skillsText = formatListInput(profile.skills || []);
  form.projects =
    profile.projects?.length > 0
      ? profile.projects.map((project) => ({
          name: project.name || "",
          period: project.period || "",
          description: project.description || "",
          projectUrl: project.projectUrl || project.project_url || ""
        }))
      : [emptyProjectExperience()];
  form.contactPolicy = profile.contactPolicy || "approval_required";
  form.isPublished = Boolean(profile.isPublished);
};

const addProjectExperience = () => {
  form.projects.push(emptyProjectExperience());
};

const removeProjectExperience = (index) => {
  form.projects.splice(index, 1);

  if (form.projects.length === 0) {
    form.projects.push(emptyProjectExperience());
  }
};

const profileReadiness = computed(() => buildProfileReadiness(form));

const buildProfilePayload = () => ({
  ...form,
  skills: parseListInput(form.skillsText),
  projects: normalizeProjects(form.projects)
});

const redirectToLogin = () =>
  router.replace({
    name: "login",
    query: { redirect: "/profile/edit" }
  });

const isUnauthorizedError = (error) => error?.message?.includes("401");

const getRequiredToken = async () => {
  const token = await getAccessToken();

  if (!token) {
    await redirectToLogin();
    return null;
  }

  return token;
};

onMounted(async () => {
  try {
    const token = await getRequiredToken();
    if (!token) return;

    const user = await getCurrentUser();
    const data = await getMe(token);
    fillForm(data.profile);
    applyAccountDefaults(user);
  } catch (error) {
    if (isUnauthorizedError(error)) {
      await redirectToLogin();
      return;
    }

    message.value = "프로필 정보를 불러오지 못했습니다. 새 전자명함을 작성하세요.";
  } finally {
    loading.value = false;
  }
});

const saveProfile = async () => {
  saving.value = true;
  message.value = "";
  isError.value = false;

  try {
    const token = await getRequiredToken();
    if (!token) return;

    await saveMyProfile(token, buildProfilePayload());
    await router.replace("/profile");
  } catch (error) {
    if (isUnauthorizedError(error)) {
      await redirectToLogin();
      return;
    }

    isError.value = true;
    message.value = error.message;
  } finally {
    saving.value = false;
  }
};
</script>
