<script setup lang="ts">
import { computed } from 'vue';
import {
  Dropdown as ADropdown,
  Menu as AMenu,
  MenuItem as AMenuItem,
  MenuDivider as AMenuDivider,
} from 'ant-design-vue';
import {
  ReloadOutlined,
  CopyOutlined,
  CloseOutlined,
  StarOutlined,
  MoreOutlined,
  EllipsisOutlined,
} from '@ant-design/icons-vue';
import type { WorkbenchTabItem } from '@/app/workbench/workbenchTabUtils';

const props = defineProps<{
  tabs: WorkbenchTabItem[];
  activeTabKey: string;
}>();

const emit = defineEmits<{
  (e: 'navigate', fullPath: string): void;
  (e: 'close', fullPath: string): void;
  (e: 'close-left', fullPath: string): void;
  (e: 'close-right', fullPath: string): void;
  (e: 'close-others', fullPath: string): void;
  (e: 'close-all'): void;
  (e: 'reload', fullPath: string): void;
  (e: 'copy-link', fullPath: string): void;
  (e: 'favorite', fullPath: string): void;
}>();

const activeTab = computed(() =>
  props.tabs.find((tab) => tab.fullPath === props.activeTabKey)
);

/** KK 分组规则：home/global-fixed 为 primary 组，项目/普通为非 primary */
const PRIMARY_GROUPS: WorkbenchTabItem['group'][] = ['home', 'global-fixed'];

function isPrimaryGroup(group: WorkbenchTabItem['group']): boolean {
  return PRIMARY_GROUPS.includes(group);
}

/** 当前标签是否需要在前面渲染分组分隔线（primary → 非 primary 的边界） */
function shouldRenderDividerBeforeTab(index: number): boolean {
  if (index <= 0) return false;
  const prev = props.tabs[index - 1];
  const current = props.tabs[index];
  if (!prev || !current) return false;
  return isPrimaryGroup(prev.group) && !isPrimaryGroup(current.group);
}

function handleMenuClick(key: string, fullPath: string): void {
  switch (key) {
    case 'reload':
      emit('reload', fullPath);
      break;
    case 'copy':
      emit('copy-link', fullPath);
      break;
    case 'favorite':
      emit('favorite', fullPath);
      break;
    case 'close-left':
      emit('close-left', fullPath);
      break;
    case 'close-right':
      emit('close-right', fullPath);
      break;
    case 'close-others':
      emit('close-others', fullPath);
      break;
    case 'close-all':
      emit('close-all');
      break;
    case 'close':
      emit('close', fullPath);
      break;
  }
}
</script>

<script lang="ts">
export default { name: 'WorkbenchTabsBar' };
</script>

<template>
  <div class="tabs-bar">
    <div class="tabs-bar__scroll">
      <ADropdown
        v-for="(tab, index) in tabs"
        :key="tab.tabKey"
        trigger="contextmenu"
        placement="bottomLeft"
      >
        <button
          class="tab-item"
          :class="{
            'tab-item--active': tab.fullPath === activeTabKey,
            'tab-item--group-divider': shouldRenderDividerBeforeTab(index),
          }"
          :title="tab.title"
          @click="emit('navigate', tab.fullPath)"
        >
          <span v-if="tab.affix" class="tab-item__pin"></span>
          <span class="tab-item__title">{{ tab.title }}</span>
          <CloseOutlined
            v-if="!tab.affix"
            class="tab-item__close"
            @click.stop="emit('close', tab.fullPath)"
          />
        </button>
        <template #overlay>
          <AMenu @click="({ key }) => handleMenuClick(String(key), tab.fullPath)">
            <AMenuItem key="reload"><ReloadOutlined /> 重新加载</AMenuItem>
            <AMenuItem key="copy"><CopyOutlined /> 复制标签页链接</AMenuItem>
            <AMenuItem key="favorite"><StarOutlined /> 收藏标签页</AMenuItem>
            <AMenuDivider v-if="!tab.affix" />
            <AMenuItem v-if="!tab.affix" key="close"><CloseOutlined /> 关闭此标签</AMenuItem>
            <AMenuItem v-if="!tab.affix" key="close-left">关闭左侧</AMenuItem>
            <AMenuItem v-if="!tab.affix" key="close-right">关闭右侧</AMenuItem>
            <AMenuItem v-if="!tab.affix" key="close-others">关闭其他</AMenuItem>
            <AMenuItem key="close-all">关闭全部标签</AMenuItem>
          </AMenu>
        </template>
      </ADropdown>
    </div>

    <!-- KK 标签条右端动作组 -->
    <div class="tabs-bar__actions">
      <a-tooltip title="刷新当前标签">
        <button
          type="button"
          class="tabs-action-btn"
          :disabled="!activeTab"
          aria-label="刷新当前标签"
          @click="activeTab && emit('reload', activeTab.fullPath)"
        >
          <ReloadOutlined />
        </button>
      </a-tooltip>

      <a-tooltip title="复制当前标签页链接">
        <button
          type="button"
          class="tabs-action-btn"
          :disabled="!activeTab"
          aria-label="复制当前标签页链接"
          @click="activeTab && emit('copy-link', activeTab.fullPath)"
        >
          <CopyOutlined />
        </button>
      </a-tooltip>

      <a-dropdown :disabled="!activeTab">
        <button
          type="button"
          class="tabs-action-btn"
          aria-label="标签操作"
          :disabled="!activeTab"
        >
          <MoreOutlined />
        </button>
        <template v-if="activeTab" #overlay>
          <AMenu @click="({ key }) => handleMenuClick(String(key), activeTab!.fullPath)">
            <AMenuItem key="reload"><ReloadOutlined /> 重新加载</AMenuItem>
            <AMenuItem key="copy"><CopyOutlined /> 复制标签页链接</AMenuItem>
            <AMenuItem key="favorite"><StarOutlined /> 收藏标签页</AMenuItem>
            <AMenuDivider />
            <AMenuItem key="close-all">关闭全部标签</AMenuItem>
          </AMenu>
        </template>
      </a-dropdown>

      <a-dropdown v-if="tabs.length > 8">
        <button type="button" class="tabs-action-btn" aria-label="更多标签">
          <EllipsisOutlined />
        </button>
        <template #overlay>
          <AMenu @click="({ key }) => emit('navigate', String(key))">
            <AMenuItem v-for="tab in tabs" :key="tab.fullPath">
              {{ tab.title }}
            </AMenuItem>
          </AMenu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<style scoped>
.tabs-bar {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex: 1;
  min-width: 0;
  min-height: 40px;
}

.tabs-bar__scroll {
  display: flex;
  align-items: stretch;
  gap: 2px;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.tabs-bar__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.tabs-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 13px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.tabs-action-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.tabs-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.tab-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  margin: 5px 0;
  height: 28px;
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.tab-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.tab-item--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  border-color: var(--color-border-accent);
  font-weight: 500;
}

.tab-item__pin {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-action-primary);
  flex-shrink: 0;
}

.tab-item__title {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* KK 分组分隔线：primary 组与普通/项目组之间加大间距并画竖线 */
.tab-item--group-divider {
  margin-left: 16px;
}

.tab-item--group-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -8px;
  transform: translateY(-50%);
  width: 1px;
  height: 16px;
  border-radius: var(--radius-full);
  background: var(--color-border-strong);
  pointer-events: none;
}

.tab-item__close {
  font-size: 10px;
  color: var(--color-text-tertiary);
  border-radius: var(--radius-1);
  padding: 2px;
}

.tab-item__close:hover {
  color: var(--color-feedback-error);
  background: var(--color-fill-error-subtle);
}
</style>
