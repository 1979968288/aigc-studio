<script setup lang="ts">
import { inject } from 'vue';
import { CheckSquareOutlined, SettingOutlined } from '@ant-design/icons-vue';
import { APPROVAL_CATEGORIES } from '../constants';
import type { ApprovalCategory } from '../types';
import { approvalCenterPageKey } from '../injection';

defineOptions({ name: 'ApprovalSidebar' });

const page = inject(approvalCenterPageKey)!;
</script>

<template>
  <aside class="ap-sidebar">
    <div class="ap-sidebar__group-title">审批</div>
    <button
      v-for="item in APPROVAL_CATEGORIES"
      :key="item.key"
      type="button"
      class="ap-sidebar__item"
      :class="{ 'ap-sidebar__item--active': page.category === item.key }"
      @click="page.switchCategory(item.key as ApprovalCategory)"
    >
      <CheckSquareOutlined v-if="item.key === 'task'" class="ap-sidebar__item-icon" />
      <SettingOutlined v-else class="ap-sidebar__item-icon" />
      <span class="ap-sidebar__item-label">{{ item.label }}</span>
      <span class="ap-sidebar__item-count">{{ page.summaries[item.key] ?? 0 }}</span>
    </button>
  </aside>
</template>

<style scoped>
.ap-sidebar {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-3);
  border-right: 1px solid var(--color-border-divider);
  overflow-y: auto;
}

.ap-sidebar__group-title {
  padding: 0 var(--spacing-2);
  font-size: var(--font-size-12);
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.ap-sidebar__item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  font-size: var(--font-size-13);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-align: left;
}

.ap-sidebar__item:hover {
  background: var(--color-bg-hover);
}

.ap-sidebar__item--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 500;
}

.ap-sidebar__item-icon {
  font-size: var(--font-size-14);
}

.ap-sidebar__item-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ap-sidebar__item-count {
  min-width: 20px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  background: var(--color-bg-hover);
  font-size: var(--font-size-11);
  text-align: center;
}
</style>
