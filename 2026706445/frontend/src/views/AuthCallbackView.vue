<template>
  <section class="auth-page">
    <section class="state-box" :class="{ error: isError }">
      {{ message }}
    </section>
  </section>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { completeAuthCallback } from "../services/auth.js";

const router = useRouter();
const message = ref("인증 링크를 확인하고 있습니다.");
const isError = ref(false);

onMounted(async () => {
  const result = await completeAuthCallback();

  if (result.error) {
    isError.value = true;
    message.value = result.error.message || "인증 링크를 확인하지 못했습니다. 다시 로그인해주세요.";
    return;
  }

  await router.replace(result.redirectPath);
});
</script>
