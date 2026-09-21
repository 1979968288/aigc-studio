<script setup lang="ts">
import { useAssetListPageContext } from '../useAssetListPage';

defineOptions({ name: 'AssetListStats' });

const { stats } = useAssetListPageContext();

const cards = [
  { key: 'total', label: '资产总量', value: () => stats.value.total },
  { key: 'notStarted', label: '未开始', value: () => stats.value.notStarted },
  { key: 'inProgress', label: '进行中', value: () => stats.value.inProgress },
  { key: 'completed', label: '已完成', value: () => stats.value.completed },
];
</script>

<template>
  <div class="al-stats">
    <div v-for="card in cards" :key="card.key" class="al-stats__card">
      <div class="al-stats__label">{{ card.label }}</div>
      <div class="al-stats__value">{{ card.value() }}</div>
    </div>
  </div>
</template>

<style scoped>
.al-stats {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-4);
}

.al-stats__card {
  background: var(--component-panel-background);
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-4);
  padding: var(--spacing-4) var(--spacing-5);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.al-stats__label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-13);
}

.al-stats__value {
  color: var(--color-text-primary);
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  line-height: 1;
}
</style>