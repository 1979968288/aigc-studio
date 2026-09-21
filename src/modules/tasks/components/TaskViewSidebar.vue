<script setup lang="ts">
import { computed, inject } from 'vue';
import {
  AppstoreOutlined,
  BgColorsOutlined,
  FileTextOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons-vue';
import { LINE_VIEW_GROUP, SYSTEM_VIEW_GROUP, TASK_VIEWS } from '../constants';
import type { TaskViewDef } from '../types';
import { taskListPageKey } from '../injection';

defineOptions({ name: 'TaskViewSidebar' });

const page = inject(taskListPageKey)!;

const groups = computed(() => {
  const system = TASK_VIEWS.filter((view) => view.group === SYSTEM_VIEW_GROUP);
  const lines = TASK_VIEWS.filter((view) => view.group === LINE_VIEW_GROUP);
  return [
    { title: '任务', items: system },
    { title: '生产线', items: lines },
  ];
});

function viewIcon(view: TaskViewDef): string {
  return view.icon;
}
</script>

<template>
  <aside class="tl-sidebar">
    <div v-for="group in groups" :key="group.title" class="tl-sidebar__group">
      <div class="tl-sidebar__group-title">{{ group.title }}</div>
      <button
        v-for="view in group.items"
        :key="view.id"
        type="button"
        class="tl-sidebar__item"
        :class="{ 'tl-sidebar__item--active': page.activeViewId === view.id }"
        @click="page.switchView(view.id)"
      >
        <AppstoreOutlined v-if="viewIcon(view) === 'board'" class="tl-sidebar__item-icon" />
        <UnorderedListOutlined v-else-if="viewIcon(view) === 'all'" class="tl-sidebar__item-icon" />
        <BgColorsOutlined v-else-if="viewIcon(view) === 'art'" class="tl-sidebar__item-icon" />
        <VideoCameraOutlined v-else-if="viewIcon(view) === 'video'" class="tl-sidebar__item-icon" />
        <FileTextOutlined v-else class="tl-sidebar__item-icon" />
        <span class="tl-sidebar__item-label">{{ view.label }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.tl-sidebar {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4) var(--spacing-3);
  border-right: 1px solid var(--color-border-divider);
  overflow-y: auto;
}

.tl-sidebar__group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tl-sidebar__group-title {
  padding: 0 var(--spacing-2);
  margin-bottom: var(--spacing-1);
  font-size: var(--font-size-12);
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.tl-sidebar__item {
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

.tl-sidebar__item:hover {
  background: var(--color-bg-hover);
}

.tl-sidebar__item--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 500;
}

.tl-sidebar__item-icon {
  font-size: var(--font-size-14);
}

.tl-sidebar__item-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
