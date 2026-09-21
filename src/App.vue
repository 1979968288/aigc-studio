<script setup lang="ts">
import { computed } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import { useAppStore } from '@/stores/app';
import { getAntdThemeConfig } from '@/shared/theme/antdTheme';

const appStore = useAppStore();
const antdThemeConfig = computed(() => getAntdThemeConfig(appStore.theme));
</script>

<template>
  <a-config-provider :locale="zhCN" :theme="antdThemeConfig">
    <router-view />
  </a-config-provider>
</template>
