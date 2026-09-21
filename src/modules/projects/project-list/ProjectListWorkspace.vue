<script setup lang="ts">
import { SearchOutlined, FilterOutlined, PlusOutlined, TableOutlined } from '@ant-design/icons-vue';
import ProjectCard from './components/ProjectCard.vue';
import CreateProjectModal from './components/CreateProjectModal.vue';
import { useProjectListPage } from './useProjectListPage';
import { PROJECT_VIEW_MODE_OPTIONS } from '../constants';

defineOptions({ name: 'ProjectListWorkspace' });

const {
  loading,
  filteredProjects,
  keyword,
  viewMode,
  createProjectModalVisible,
  filterPopoverVisible,
  filterDraft,
  activeFilterCount,
  hasActiveQuery,
  emptyTitle,
  emptyHint,
  statusOptions,
  typeOptions,
  loadProjects,
  selectViewMode,
  applyFilterDraft,
  resetFilters,
  clearQuery,
  handleCreateProject,
  handleCreateSuccess,
  handleFavorite,
  goToDetail,
} = useProjectListPage();

const viewModeSegmentedOptions = PROJECT_VIEW_MODE_OPTIONS.map((option) => ({
  label: option.label,
  value: option.key,
}));

const currentViewLabel =
  PROJECT_VIEW_MODE_OPTIONS.find((option) => option.key === viewMode.value)?.label ?? '卡片';
</script>

<template>
  <div class="project-list-page">
    <!-- 工具栏 -->
    <div class="project-list-toolbar">
      <div class="toolbar-left">
        <a-segmented
          class="view-mode-segmented"
          :value="viewMode"
          :options="viewModeSegmentedOptions"
          @update:value="(value: string | number) => selectViewMode(value as typeof viewMode)"
        />
      </div>

      <div class="toolbar-right">
        <div class="search-group">
          <a-input
            v-model:value="keyword"
            allow-clear
            placeholder="搜索项目名称"
            class="search-input"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
          <a-button class="search-btn" @click="loadProjects">搜索</a-button>
        </div>

        <a-popover v-model:open="filterPopoverVisible" trigger="click" placement="bottomRight">
          <a-button class="filter-btn">
            <FilterOutlined />
            筛选
            <span v-if="activeFilterCount > 0" class="filter-badge">
              {{ activeFilterCount }}
            </span>
          </a-button>
          <template #content>
            <div class="filter-panel">
              <h3 class="filter-title">筛选项目</h3>

              <div class="filter-item">
                <label>项目类型</label>
                <a-select
                  v-model:value="filterDraft.type"
                  placeholder="全部"
                  allow-clear
                  style="width: 100%"
                  :options="typeOptions.map((t) => ({ label: t, value: t }))"
                />
              </div>

              <div class="filter-item">
                <label>项目状态</label>
                <a-select
                  v-model:value="filterDraft.status"
                  placeholder="全部"
                  allow-clear
                  style="width: 100%"
                  :options="statusOptions"
                />
              </div>

              <div class="filter-item">
                <a-checkbox v-model:checked="filterDraft.favoritedOnly">
                  仅看已收藏
                </a-checkbox>
              </div>

              <div class="filter-actions">
                <a-button size="small" @click="resetFilters">重置</a-button>
                <a-button type="primary" size="small" @click="applyFilterDraft">应用</a-button>
              </div>
            </div>
          </template>
        </a-popover>

        <a-button type="primary" @click="handleCreateProject">
          <PlusOutlined />
          创建项目
        </a-button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="project-list-content">
      <a-spin :spinning="loading">
        <!-- 卡片视图 -->
        <template v-if="viewMode === 'card'">
          <div v-if="filteredProjects.length > 0" class="card-grid">
            <ProjectCard
              v-for="project in filteredProjects"
              :key="project.id"
              :project="project"
              @click="goToDetail"
              @favorite-click="handleFavorite"
            />
          </div>

          <div v-else-if="!loading" class="empty-state">
            <a-empty>
              <template #description>
                <div class="empty-copy">
                  <h3 class="empty-title">{{ emptyTitle }}</h3>
                  <p class="empty-hint">{{ emptyHint }}</p>
                </div>
              </template>
            </a-empty>
            <div class="empty-actions">
              <a-button v-if="hasActiveQuery" @click="clearQuery">清空搜索与筛选</a-button>
              <a-button v-else type="primary" @click="handleCreateProject">
                <PlusOutlined />
                创建项目
              </a-button>
            </div>
          </div>
        </template>

        <!-- 表格 / 泳道视图（P2.1b 交付） -->
        <div v-else-if="!loading" class="placeholder-view">
          <a-empty>
            <template #description>
              <div class="empty-copy">
                <h3 class="empty-title">
                  <TableOutlined />
                  {{ currentViewLabel }}视图建设中
                </h3>
                <p class="empty-hint">{{ currentViewLabel }}视图将在 P2.1b 里程碑开放，当前请使用卡片视图。</p>
              </div>
            </template>
          </a-empty>
        </div>
      </a-spin>
    </div>

    <CreateProjectModal v-model:open="createProjectModalVisible" @create="handleCreateSuccess" />
  </div>
</template>

<style scoped>
.project-list-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 工具栏 */
.project-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid var(--component-toolbar-border);
  border-radius: var(--radius-5);
  background: var(--component-toolbar-background);
  margin-bottom: var(--spacing-4);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-group {
  display: flex;
  align-items: center;
  gap: 0;
}

.search-input {
  width: 220px;
}

.filter-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.filter-badge {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-action-primary);
  color: #fff;
  font-size: 11px;
  line-height: 1;
}

/* 内容区 */
.project-list-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 376px));
  gap: 12px;
  align-items: stretch;
  justify-content: start;
}

/* 空态 */
.empty-state,
.placeholder-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-8) 0;
}

.empty-copy {
  text-align: center;
}

.empty-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.empty-hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.empty-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

/* 筛选面板 */
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 240px;
}

.filter-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-divider);
}
</style>
