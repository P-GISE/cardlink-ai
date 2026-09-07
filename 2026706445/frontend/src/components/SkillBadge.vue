<script setup>
defineProps({
  label: {
    type: String,
    required: true
  }
});
</script>

<template>
  <span class="skill-badge">{{ label }}</span>
</template>

