<script setup lang="ts">
import '@/styles/pages/dashboard.css';
import { onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import DashboardCardGrid from '@/modules/dashboard/components/DashboardCardGrid.vue';
import { useDashboardPage } from '@/modules/dashboard/composables/useDashboardPage';
import { resetDB } from '@/shared/mock/db';

defineOptions({ name: 'Dashboard' });

const {
  GRID_COLS,
  ROW_HEIGHT,
  approvalItems,
  approvalSummaries,
  globalProductionBoardLanes,
  goTo,
  isPopupMode,
  layout,
  loadingApprovals,
  loadingGlobalProductionBoard,
  loadingProjects,
  loadingShortcuts,
  loadingTasks,
  loadingWatch,
  openCardInWindow,
  projectItems,
  removeShortcutById,
  resetLayout,
  setCardVisible,
  shortcutItems,
  showDashboardCardEmpty,
  taskItems,
  updateLayout,
  visibilityOptions,
  visibleCards,
  watchProjects,
} = useDashboardPage();

function handleVisibilityChange(cardId: string, visible: boolean): void {
  setCardVisible(cardId, visible);
}

function handleRemoveShortcut(id: string): void {
  void removeShortcutById(id).then(() => message.success('已移除捷径'));
}

function handleResetLayout(): void {
  void resetLayout().then(() => message.success('已恢复默认布局'));
}

/** 页面动作注册进顶栏用户菜单（KK pageTopActions 同款） */
const pageTopActions = inject<{
  set: (actions: Array<{ key: string; label: string; icon: 'reload' | 'layout-reset' | 'settings'; handler: () => void }>) => void;
  clear: () => void;
}>('pageTopActions');

onMounted(() => {
  pageTopActions?.set([
    {
      key: 'reset-layout',
      label: '恢复默认布局',
      icon: 'layout-reset',
      handler: handleResetLayout,
    },
    {
      key: 'reset-demo-data',
      label: '重置演示数据',
      icon: 'reload',
      handler: () => {
        resetDB();
        message.success('演示数据已重置，即将刷新');
        setTimeout(() => window.location.reload(), 600);
      },
    },
  ]);
});

onUnmounted(() => {
  pageTopActions?.clear();
});
</script>

<template>
  <div :class="['db1-root', { 'db1-root--popup': isPopupMode }]">
    <div v-if="showDashboardCardEmpty" class="db1-empty-config">
      <h2>所有卡片均已隐藏</h2>
      <p>在顶栏用户菜单"恢复默认布局"中找回工作台。</p>
      <a-button type="primary" @click="handleResetLayout">恢复默认布局</a-button>
    </div>

    <template v-else>
      <div v-if="!isPopupMode" class="db1-toolbar">
        <a-dropdown placement="bottomRight">
          <a-button>卡片配置</a-button>
          <template #overlay>
            <a-menu>
              <a-menu-item
                v-for="option in visibilityOptions"
                :key="option.id"
                @click="handleVisibilityChange(option.id, !option.visible)"
              >
                <span
                  class="db1-visibility-dot"
                  :class="{ 'is-visible': option.visible }"
                ></span>
                <span>{{ option.title }}</span>
                <span class="db1-visibility-state">{{ option.visible ? '显示' : '隐藏' }}</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>

      <DashboardCardGrid
        :layout="layout"
        :approval-items="approvalItems"
        :approval-summaries="approvalSummaries"
        :global-production-board-lanes="globalProductionBoardLanes"
        :grid-cols="GRID_COLS"
        :is-popup-mode="isPopupMode"
        :loading-approvals="loadingApprovals"
        :loading-global-production-board="loadingGlobalProductionBoard"
        :loading-projects="loadingProjects"
        :loading-shortcuts="loadingShortcuts"
        :loading-tasks="loadingTasks"
        :loading-watch="loadingWatch"
        :project-items="projectItems"
        :row-height="ROW_HEIGHT"
        :shortcut-items="shortcutItems"
        :task-items="taskItems"
        :visible-cards="visibleCards"
        :watch-projects="watchProjects"
        @go-to="goTo"
        @update:layout="updateLayout"
        @open-card="openCardInWindow"
        @remove-shortcut="handleRemoveShortcut"
      />
    </template>
  </div>
</template>

<style scoped>
.db1-visibility-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  margin-right: 8px;
  background: var(--color-bg-disabled);
}

.db1-visibility-dot.is-visible {
  background: var(--color-feedback-success);
}

.db1-visibility-state {
  float: right;
  color: var(--color-text-tertiary);
  font-size: 12px;
  margin-left: 24px;
}
</style>
