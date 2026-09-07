<template>
  <section class="auth-page">
    <PageHeader
      eyebrow="Login"
      title="회원가입 또는 로그인"
      description="전자명함 제작, 프로젝트 지원, 컨택 요청은 로그인한 사용자만 사용할 수 있습니다."
    />

    <div class="auth-layout">
      <section class="auth-panel">
        <div class="panel-heading">
          <p class="eyebrow">Social</p>
          <h2>소셜 계정으로 시작</h2>
          <p>Google 또는 GitHub 계정으로 빠르게 로그인합니다.</p>
        </div>

        <div class="stack">
          <button type="button" class="secondary full" @click="loginWith('google')">
            Google로 계속하기
          </button>
          <button type="button" class="secondary full" @click="loginWith('github')">
            GitHub로 계속하기
          </button>
        </div>
      </section>

      <section class="auth-panel">
        <div class="auth-mode-switch" role="tablist" aria-label="이메일 인증 방식">
          <button
            type="button"
            role="tab"
            :aria-selected="authMode === 'login'"
            :class="{ active: authMode === 'login' }"
            @click="setAuthMode('login')"
          >
            로그인
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="authMode === 'signup'"
            :class="{ active: authMode === 'signup' }"
            @click='setAuthMode("signup")'
          >
            회원가입
          </button>
        </div>

        <template v-if='authMode === "login"'>
          <div class="panel-heading">
            <p class="eyebrow">Email</p>
            <h2>이메일로 로그인</h2>
            <p>가입한 이메일과 비밀번호로 전자명함 작업 공간에 들어갑니다.</p>
          </div>

          <form class="auth-form" @submit.prevent="handleLoginSubmit">
            <label>
              이메일
              <input v-model="loginEmail" type="email" autocomplete="email" required />
            </label>
            <label>
              비밀번호
              <input v-model="loginPassword" type="password" autocomplete="current-password" required minlength="6" />
            </label>
            <div class="form-actions">
              <button type="submit" class="primary">로그인</button>
              <button type="button" class="secondary" @click='setAuthMode("signup")'>회원가입</button>
            </div>
          </form>
        </template>

        <template v-else>
          <div class="panel-heading">
            <p class="eyebrow">Signup</p>
            <h2>회원가입</h2>
            <p>새 계정을 만든 뒤 바로 전자명함을 생성할 수 있습니다.</p>
          </div>

          <form class="auth-form" @submit.prevent="handleSignupSubmit">
            <label>
              본명
              <input v-model="signupFullName" type="text" autocomplete="name" required minlength="2" placeholder="홍길동" />
            </label>
            <label>
              이메일
              <input v-model="signupEmail" type="email" autocomplete="email" required />
            </label>
            <label>
              비밀번호
              <input v-model="signupPassword" type="password" autocomplete="new-password" required minlength="8" />
            </label>
            <label>
              비밀번호 확인
              <input
                v-model="signupPasswordConfirm"
                type="password"
                autocomplete="new-password"
                required
                minlength="8"
              />
            </label>
            <label class="inline-check">
              <input v-model="termsAccepted" type="checkbox" required />
              서비스 이용약관에 동의합니다.
            </label>
            <label class="inline-check">
              <input v-model="privacyAccepted" type="checkbox" required />
              개인정보 수집 및 이메일 인증 처리에 동의합니다.
            </label>
            <div class="form-actions">
              <button type="submit" class="primary">가입하기</button>
              <button type="button" class="secondary" @click="setAuthMode('login')">로그인으로 돌아가기</button>
            </div>
          </form>
        </template>
      </section>
    </div>

    <p v-if="message" class="state-box auth-message" :class="{ error: isError }">{{ message }}</p>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import PageHeader from "../components/PageHeader.vue";
import {
  sanitizeRedirectPath,
  signInWithPassword,
  signInWithProvider,
  signUpWithPassword
} from "../services/auth.js";

const route = useRoute();
const router = useRouter();

const authMode = ref("login");
const loginEmail = ref("");
const loginPassword = ref("");
const signupFullName = ref("");
const signupEmail = ref("");
const signupPassword = ref("");
const signupPasswordConfirm = ref("");
const termsAccepted = ref(false);
const privacyAccepted = ref(false);
const message = ref("");
const isError = ref(false);

const redirectPath = () => sanitizeRedirectPath(route.query.redirect);

const finishAuth = async (result, fallbackMessage) => {
  if (result?.error) {
    isError.value = true;
    message.value = result.error.message || "인증에 실패했습니다.";
    return;
  }

  if (result?.local || result?.data?.session) {
    await router.replace(redirectPath());
    return;
  }

  isError.value = false;
  message.value = fallbackMessage;
};

const runAuth = async (action) => {
  message.value = "";
  isError.value = false;

  try {
    await action();
  } catch (error) {
    isError.value = true;
    message.value = error.message;
  }
};

const setAuthMode = (mode) => {
  authMode.value = mode;
  message.value = "";
  isError.value = false;
};

const loginWith = (provider) =>
  runAuth(async () => {
    const result = await signInWithProvider(undefined, provider, {
      redirectPath: redirectPath()
    });
    await finishAuth(result, "소셜 로그인 페이지로 이동합니다.");
  });

const handleLoginSubmit = () =>
  runAuth(async () => {
    const result = await signInWithPassword(undefined, loginEmail.value, loginPassword.value);
    await finishAuth(result, "로그인되었습니다.");
  });

const validateSignupForm = () => {
  if (signupFullName.value.trim().length < 2) {
    throw new Error("본명을 2자 이상 입력해주세요.");
  }

  if (signupPassword.value.length < 8) {
    throw new Error("비밀번호는 8자 이상이어야 합니다.");
  }

  if (signupPassword.value !== signupPasswordConfirm.value) {
    throw new Error("비밀번호 확인이 일치하지 않습니다.");
  }

  if (!termsAccepted.value || !privacyAccepted.value) {
    throw new Error("약관과 개인정보 처리에 동의해야 가입할 수 있습니다.");
  }
};

const handleSignupSubmit = () =>
  runAuth(async () => {
    validateSignupForm();
    const acceptedAt = new Date().toISOString();
    const result = await signUpWithPassword(undefined, signupEmail.value, signupPassword.value, {
      fullName: signupFullName.value,
      redirectPath: redirectPath(),
      termsAcceptedAt: acceptedAt,
      privacyAcceptedAt: acceptedAt
    });
    await finishAuth(result, "인증 메일을 보냈습니다. 이메일의 인증 링크를 누르면 가입이 완료됩니다.");
  });
</script>
