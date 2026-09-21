<script setup lang="ts">
defineProps<{
  moduleTitle?: string;
  title: string;
  description?: string;
}>();
</script>

<script lang="ts">
export default { name: 'PageHeader' };
</script>

<template>
  <div class="page-header">
    <div class="page-header__main">
      <div v-if="moduleTitle" class="page-header__module">{{ moduleTitle }}</div>
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.extra" class="page-header__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
  padding: var(--spacing-5) var(--spacing-6) var(--spacing-4);
}

.page-header__module {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-bottom: 2px;
}

.page-header__title {
  margin: 0;
  font-size: var(--font-size-20);
  font-weight: 600;
  color: var(--color-text-primary);
}

.page-header__description {
  margin: var(--spacing-2) 0 0;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.page-header__extra {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-shrink: 0;
}
</style>
