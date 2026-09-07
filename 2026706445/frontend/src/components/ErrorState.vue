<script setup>
defineProps({
  message: {
    type: String,
    default: "데이터를 불러오지 못했습니다."
  }
});
</script>

<template>
  <div class="state-box error">{{ message }}</div>
</template>

