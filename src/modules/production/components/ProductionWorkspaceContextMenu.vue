<script setup lang="ts">
import { computed, type Component } from 'vue';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons-vue';
import { useProductionCenter } from '../useProductionCenterPage';
import type { PCAsset, PCScene, PCTask } from '../types';

defineOptions({ name: 'ProductionWorkspaceContextMenu' });

const ctx = useProductionCenter();

const visible = computed(() => ctx.contextMenu.value.visible);
const menu = computed(() => ctx.contextMenu.value);

interface ContextMenuItem {
  key: string;
  label: string;
  icon?: Component;
  danger?: boolean;
  disabled?: boolean;
}

const items = computed<ContextMenuItem[]>(() => {
  if (menu.value.type === 'script') {
    return [{ key: 'hint', label: '剧本层暂不支持编辑', disabled: true }];
  }
  return [
    { key: 'edit', label: '编辑', icon: EditOutlined },
    { key: 'delete', label: '删除', icon: DeleteOutlined, danger: true },
  ];
});

function onAction(key: string): void {
  const item = menu.value.item as PCScene | PCTask | PCAsset;
  if (key === 'edit') {
    ctx.openEditDialog(menu.value.type, item);
  } else if (key === 'delete') {
    ctx.removeEntity(menu.value.type, item);
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="pc-context-menu__backdrop"
      @click="ctx.closeContextMenu"
      @contextmenu.prevent="ctx.closeContextMenu"
    >
      <div
        class="pc-context-menu"
        :style="{ left: `${menu.x}px`, top: `${menu.y}px` }"
        @click.stop
      >
        <button
          v-for="item in items"
          :key="item.key"
          type="button"
          class="pc-context-menu__item"
          :class="{ 'is-danger': item.danger, 'is-disabled': item.disabled }"
          :disabled="item.disabled"
          @click="onAction(item.key)"
        >
          <component :is="item.icon" v-if="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pc-context-menu__backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
}

.pc-context-menu {
  position: fixed;
  min-width: 140px;
  padding: var(--spacing-2);
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-4);
  background: var(--component-popover-background);
  box-shadow: var(--shadow-floating);
}

.pc-context-menu__item {
  width: 100%;
  min-height: 36px;
  padding: 0 var(--spacing-3);
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-14);
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.pc-context-menu__item:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.pc-context-menu__item.is-danger {
  color: var(--color-feedback-error);
}

.pc-context-menu__item.is-danger:hover:not(:disabled) {
  background: var(--color-fill-error-subtle);
}

.pc-context-menu__item.is-disabled {
  color: var(--color-text-disabled);
  cursor: not-allowed;
}
</style>