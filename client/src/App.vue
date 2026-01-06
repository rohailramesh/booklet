<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navigation from '@/components/Navigation.vue'
</script>

<template>
  <div>
    <navigation />
    <router-view></router-view>
  </div>
</template>

<style scoped></style>
