<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4">
    <div class="text-6xl font-bold text-text-disabled">404</div>
    <p class="text-text-tertiary">页面不存在或已被移除</p>
    <a-button type="primary" @click="router.push('/dashboard')">返回工作台</a-button>
  </div>
</template>
