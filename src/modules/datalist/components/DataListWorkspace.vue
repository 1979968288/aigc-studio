<script setup lang="ts">
import { computed, onMounted } from 'vue';
import type { TableColumnsType } from 'ant-design-vue';
import {
  ALL_COLUMNS,
  ASSET_COLUMNS,
  DATA_LIST_SEARCH_PLACEHOLDER,
  DATA_LIST_STATS_TITLE,
  DATA_LIST_TABS,
  DATA_LIST_TOTAL_NOUN,
  SCENE_COLUMNS,
  SCRIPT_COLUMNS,
  TASK_COLUMNS,
} from '../constants';
import { useDataListPage } from '../useDataListPage';
import type { ProgressStatus } from '../types';

defineOptions({ name: 'DataListWorkspace' });

const props = defineProps<{
  projectId: string;
}>();

const page = useDataListPage(props.projectId);

const activeTab = computed({
  get: () => page.activeTab.value,
  set: (value) => {
    page.activeTab.value = value;
  },
});

const keyword = computed({
  get: () => page.keyword.value,
  set: (value) => {
    page.keyword.value = value;
  },
});

const statsCollapsed = computed({
  get: () => page.statsCollapsed.value,
  set: (value) => {
    page.statsCollapsed.value = value;
  },
});

const columns = computed<TableColumnsType>(() => {
  switch (page.activeTab.value) {
    case 'all':
      return ALL_COLUMNS;
    case 'script':
      return SCRIPT_COLUMNS;
    case 'scene':
      return SCENE_COLUMNS;
    case 'task':
      return TASK_COLUMNS;
    case 'asset':
      return ASSET_COLUMNS;
    default:
      return ALL_COLUMNS;
  }
});

const rows = computed(() => {
  switch (page.activeTab.value) {
    case 'all':
      return page.filteredAll.value;
    case 'script':
      return page.filteredScripts.value;
    case 'scene':
      return page.filteredScenes.value;
    case 'task':
      return page.filteredTasks.value;
    case 'asset':
      return page.filteredAssets.value;
    default:
      return page.filteredAll.value;
  }
});

const searchPlaceholder = computed(() => DATA_LIST_SEARCH_PLACEHOLDER[page.activeTab.value]);
const statsTitle = computed(() => DATA_LIST_STATS_TITLE[page.activeTab.value]);

/** 四段式统计卡（对齐 KK：总X / 未开始 / 进行中 / 已完成，点击筛当前 Tab） */
interface StatCard {
  key: ProgressStatus | null;
  label: string;
  value: number;
}

const statCards = computed<StatCard[]>(() => {
  const stats = page.activeStats.value;
  if (!stats) return [];
  return [
    { key: null, label: `总${DATA_LIST_TOTAL_NOUN[page.activeTab.value]}`, value: stats.total },
    { key: 'not_started', label: '未开始', value: stats.notStarted },
    { key: 'in_progress', label: '进行中', value: stats.inProgress },
    { key: 'completed', label: '已完成', value: stats.completed },
  ];
});

function isCardActive(card: StatCard): boolean {
  // 「总X」卡在无筛选时高亮；其余按当前筛选态
  return page.statusFilter.value === card.key;
}

onMounted(() => {
  void page.load();
});
</script>

<template>
  <div class="dl-page">
    <!-- 顶部统计（可折叠，对齐 KK CollapsibleStatsSection） -->
    <div class="dl-stats-header">
      <span class="dl-stats-title">{{ statsTitle }}</span>
      <a-button type="link" size="small" @click="statsCollapsed = !statsCollapsed">
        {{ statsCollapsed ? '展开统计' : '收起统计' }}
      </a-button>
    </div>
    <div v-if="!statsCollapsed" class="dl-stats">
      <!-- 剧本 Tab：仅结构计数，无进度 -->
      <template v-if="activeTab === 'script'">
        <div class="dl-stat">
          <div class="dl-stat__label">剧本段</div>
          <div class="dl-stat__value">{{ page.scriptCount.value }}</div>
        </div>
      </template>
      <!-- 其余 Tab：四段式可点击统计卡 -->
      <template v-else>
        <button
          v-for="card in statCards"
          :key="card.key ?? 'total'"
          type="button"
          :class="['dl-stat', 'dl-stat--clickable', { 'dl-stat--active': isCardActive(card) }]"
          @click="page.applyStatusFilter(card.key)"
        >
          <div class="dl-stat__label">{{ card.label }}</div>
          <div class="dl-stat__value">{{ card.value }}</div>
        </button>
      </template>
    </div>

    <!-- 工具栏：Tab + 搜索 -->
    <div class="dl-toolbar">
      <a-tabs v-model:activeKey="activeTab" class="dl-tabs">
        <a-tab-pane v-for="tab in DATA_LIST_TABS" :key="tab.key" :tab="tab.label" />
      </a-tabs>
      <div class="dl-toolbar__search">
        <a-input
          v-model:value="keyword"
          allow-clear
          :placeholder="searchPlaceholder"
          class="dl-toolbar__input"
        />
      </div>
    </div>

    <!-- 清单表格 -->
    <div class="dl-table">
      <a-table
        :columns="columns"
        :data-source="rows"
        :loading="page.loading.value"
        :pagination="false"
        row-key="id"
        size="middle"
      />
    </div>
  </div>
</template>

<style scoped>
.dl-page {
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  background: var(--color-bg-page);
  overflow: hidden;
}

.dl-stats-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dl-stats-title {
  font-size: var(--font-size-13);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.dl-stats {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 200px));
  gap: var(--spacing-4);
}

.dl-stat {
  padding: var(--spacing-4);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-5);
  background: var(--component-panel-background);
  text-align: left;
}

.dl-stat--clickable {
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dl-stat--clickable:hover {
  border-color: var(--color-action-primary);
}

.dl-stat--active {
  border-color: var(--color-action-primary);
  background: var(--color-fill-primary-subtle);
}

.dl-stat--active .dl-stat__value {
  color: var(--color-action-primary);
}

.dl-stat__label {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
}

.dl-stat__value {
  margin-top: var(--spacing-1);
  color: var(--color-text-primary);
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
}

.dl-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.dl-tabs {
  flex: 1;
  min-width: 0;
}

.dl-toolbar__search {
  flex: 0 0 280px;
}

.dl-toolbar__input {
  width: 100%;
}

.dl-table {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-5);
  background: var(--component-panel-background);
}

/* 状态点 / 核对 chip（由 customRender 生成，跨组件需 deep） */
.dl-table :deep(.dl-cell-status) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dl-table :deep(.dl-cell-status__dot) {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex: 0 0 auto;
}

.dl-table :deep(.dl-issue-chip) {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border: 1px solid;
  border-radius: var(--radius-full);
  font-size: var(--font-size-12);
  line-height: 1.6;
  white-space: nowrap;
}

.dl-table :deep(.dl-category-tag) {
  display: inline-block;
  padding: 1px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-12);
  line-height: 20px;
}
</style>
