<script setup lang="ts">
import { InboxOutlined } from '@ant-design/icons-vue';

defineProps<{
  title: string;
  description: string;
}>();
</script>

<script lang="ts">
export default { name: 'DashboardEmptyState' };
</script>

<template>
  <div class="db1-empty">
    <InboxOutlined class="db1-empty__icon" />
    <div class="db1-empty__title">{{ title }}</div>
    <div class="db1-empty__description">{{ description }}</div>
  </div>
</template>
