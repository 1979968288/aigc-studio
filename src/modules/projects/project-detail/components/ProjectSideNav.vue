<script setup lang="ts">
import type { Component } from 'vue';
import type { ProjectDetailMenuKey } from '../types';

defineOptions({ name: 'ProjectSideNav' });

defineProps<{
  items: Array<{ key: ProjectDetailMenuKey; label: string; icon: Component }>;
  bottomItems: Array<{ key: ProjectDetailMenuKey; label: string; icon: Component }>;
  activeKey: ProjectDetailMenuKey;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  (event: 'select', key: ProjectDetailMenuKey): void;
  (event: 'toggle-collapse'): void;
}>();
</script>

<template>
  <nav class="project-side-nav" :class="{ 'project-side-nav--collapsed': collapsed }">
    <div class="side-nav__top">
      <a-tooltip v-for="item in items" :key="item.key" placement="right" :title="collapsed ? item.label : ''">
        <button
          type="button"
          class="side-nav__item"
          :class="{ 'side-nav__item--active': activeKey === item.key }"
          :aria-label="item.label"
          @click="emit('select', item.key)"
        >
          <component :is="item.icon" class="side-nav__icon" />
          <span v-if="!collapsed" class="side-nav__label">{{ item.label }}</span>
        </button>
      </a-tooltip>
    </div>

    <div class="side-nav__bottom">
      <a-tooltip v-for="item in bottomItems" :key="item.key" placement="right" :title="collapsed ? item.label : ''">
        <button
          type="button"
          class="side-nav__item"
          :class="{ 'side-nav__item--active': activeKey === item.key }"
          :aria-label="item.label"
          @click="emit('select', item.key)"
        >
          <component :is="item.icon" class="side-nav__icon" />
          <span v-if="!collapsed" class="side-nav__label">{{ item.label }}</span>
        </button>
      </a-tooltip>

      <a-tooltip placement="right" :title="collapsed ? '展开导航' : '收起导航'">
        <button
          type="button"
          class="side-nav__item side-nav__collapse-toggle"
          :aria-label="collapsed ? '展开导航' : '收起导航'"
          @click="emit('toggle-collapse')"
        >
          <span class="side-nav__icon-wrap">
            <svg class="side-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </span>
          <span v-if="!collapsed" class="side-nav__label">收起导航</span>
        </button>
      </a-tooltip>
    </div>
  </nav>
</template>

<style scoped>
.project-side-nav {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-2);
  border-right: 1px solid var(--color-border-divider);
  background: var(--component-panel-background);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.project-side-nav--collapsed {
  width: 56px;
}

.side-nav__top,
.side-nav__bottom {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.side-nav__bottom {
  border-top: 1px solid var(--color-border-divider);
  padding-top: var(--spacing-2);
}

.side-nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.project-side-nav--collapsed .side-nav__item {
  justify-content: center;
  padding: 0;
}

.side-nav__item:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.side-nav__item--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 600;
}

.side-nav__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.side-nav__collapse-toggle {
  margin-top: 4px;
  color: var(--color-text-tertiary);
}

.side-nav__icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
}

.side-nav__label {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
