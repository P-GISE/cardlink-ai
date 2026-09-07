<script setup>
import AppNavbar from "./components/AppNavbar.vue";
</script>

<template>
  <div class="app-shell">
    <AppNavbar />
    <main>
      <RouterView />
    </main>
  </div>
</template>

