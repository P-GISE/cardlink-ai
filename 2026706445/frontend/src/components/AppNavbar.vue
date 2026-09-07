<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getAccessToken, getCurrentUser, isAdminUser, signOut } from "../services/auth.js";

const route = useRoute();
const router = useRouter();
const isAuthenticated = ref(false);
const isAdmin = ref(false);
const isMenuOpen = ref(false);
const accountMenu = ref(null);

const publicLinks = [
  { label: "홈", to: "/" },
  { label: "커뮤니티", to: "/community" },
  { label: "추천", to: "/recommendations" }
];

const workLinks = [
  { label: "내 전자명함", to: "/profile" },
  { label: "컨택 요청", to: "/contacts" },
  { label: "내 요청", to: "/requests/sent" },
  { label: "프로젝트 관리", to: "/projects/manage" },
  { label: "주문 내역", to: "/print-cards/orders" }
];

const adminLinks = [{ label: "관리자", to: "/admin" }];

const isWorkRouteActive = computed(() =>
  [...workLinks, ...adminLinks].some((link) => route.path === link.to || route.path.startsWith(`${link.to}/`))
);

const refreshAuthState = async () => {
  const token = await getAccessToken();
  isAuthenticated.value = Boolean(token);
  isAdmin.value = token ? isAdminUser(await getCurrentUser()) : false;
};

const closeMenu = () => {
  isMenuOpen.value = false;
  accountMenu.value?.removeAttribute("open");
};

const handleSignOut = async () => {
  await signOut();
  isAuthenticated.value = false;
  isAdmin.value = false;
  closeMenu();

  if (route.meta?.requiresAuth) {
    await router.replace({
      name: "login",
      query: { redirect: route.fullPath }
    });
    return;
  }

  await router.replace("/");
};

onMounted(refreshAuthState);
watch(
  () => route.fullPath,
  () => {
    closeMenu();
    refreshAuthState();
  }
);
</script>

<template>
  <header class="topbar">
    <RouterLink to="/" class="brand">
      <span class="brand-mark">CL</span>
      <span class="brand-copy">
        <strong>CardLink AI</strong>
        <small>전자명함 네트워크</small>
      </span>
    </RouterLink>

    <button
      type="button"
      class="nav-menu-toggle"
      :aria-expanded="isMenuOpen"
      aria-controls="primary-navigation"
      @click="isMenuOpen = !isMenuOpen"
    >
      메뉴
      <span aria-hidden="true">{{ isMenuOpen ? "닫기" : "열기" }}</span>
    </button>

    <nav
      id="primary-navigation"
      class="nav-links"
      :class="{ open: isMenuOpen }"
      aria-label="주요 메뉴"
    >
      <div class="nav-primary" aria-label="탐색 메뉴">
        <RouterLink
          v-for="link in publicLinks"
          :key="link.label"
          :to="link.to"
          @click="closeMenu"
        >
          {{ link.label }}
        </RouterLink>
      </div>

      <div class="nav-actions">
        <RouterLink
          v-if="isAuthenticated"
          to="/print-cards/new"
          class="nav-cta"
          @click="closeMenu"
        >
          실물 명함 만들기
        </RouterLink>
        <RouterLink
          v-else
          :to="{ name: 'login', query: { redirect: '/profile/edit' } }"
          class="nav-cta"
          @click="closeMenu"
        >
          전자명함 만들기
        </RouterLink>

        <details v-if="isAuthenticated" ref="accountMenu" class="nav-account-menu">
          <summary :class="{ active: isWorkRouteActive }">내 작업</summary>
          <div class="nav-menu-panel">
            <RouterLink
              v-for="link in workLinks"
              :key="link.label"
              :to="link.to"
              @click="closeMenu"
            >
              {{ link.label }}
            </RouterLink>
            <RouterLink
              v-for="link in isAdmin ? adminLinks : []"
              :key="link.label"
              :to="link.to"
              @click="closeMenu"
            >
              {{ link.label }}
            </RouterLink>
          </div>
        </details>

        <button v-if="isAuthenticated" type="button" class="nav-button" @click="handleSignOut">
          로그아웃
        </button>
        <RouterLink v-else to="/login" class="nav-login" @click="closeMenu">로그인</RouterLink>
      </div>
    </nav>
  </header>
</template>
