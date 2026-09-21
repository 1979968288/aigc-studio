<script setup lang="ts">
defineProps<{
  /** 内容宽度：normal 限制最大宽度，wide 铺满 */
  width?: 'normal' | 'wide';
}>();
</script>

<script lang="ts">
export default { name: 'PageContent' };
</script>

<template>
  <div class="page-content" :class="{ 'page-content--wide': width === 'wide' }">
    <slot />
  </div>
</template>

<style scoped>
.page-content {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 var(--spacing-6) var(--spacing-6);
}

.page-content--wide {
  max-width: none;
}
</style>
