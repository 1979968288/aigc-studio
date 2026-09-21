<script setup lang="ts">
import { useRouter } from 'vue-router';
import ProjectHeroPanel from './ProjectHeroPanel.vue';
import ProjectSideNav from './ProjectSideNav.vue';
import ProjectOverviewPanel from './ProjectOverviewPanel.vue';
import ProjectProductionInfoPanel from './ProjectProductionInfoPanel.vue';
import ProjectReferenceLibraryPanel from './ProjectReferenceLibraryPanel.vue';
import ProjectSettingsPanel from './ProjectSettingsPanel.vue';
import { useProjectDetailPage } from '../useProjectDetailPage';
import {
  DETAIL_BOTTOM_MENU_ITEMS,
  DETAIL_MENU_ITEMS,
  DETAIL_SIDENAV_COLLAPSED_KEY,
} from '../constants';

defineOptions({ name: 'ProjectDetailWorkspace' });

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();
const page = useProjectDetailPage(props.projectId);

const showHero = computed(
  () => page.activeMenu.value !== 'reference-library' && page.activeMenu.value !== 'settings'
);

const sidebarCollapsed = computed({
  get: () => page.sidebarCollapsed.value,
  set: (value: boolean) => {
    page.sidebarCollapsed.value = value;
    try {
      sessionStorage.setItem(DETAIL_SIDENAV_COLLAPSED_KEY, String(value));
    } catch {
      // 持久化失败不影响当前会话
    }
  },
});

try {
  const stored = sessionStorage.getItem(DETAIL_SIDENAV_COLLAPSED_KEY);
  if (stored === 'true') page.sidebarCollapsed.value = true;
} catch {
  // sessionStorage 不可用时忽略
}

function handleSave(patch: Record<string, unknown>): void {
  void page.saveDetailPatch(patch);
}

function goDataList(): void {
  // 携带项目名，保证项目标签标题与第二行字段正确（与英雄区按钮同规则）
  void router.push({
    path: `/projects/${props.projectId}/data-list`,
    query: { name: page.project.value?.name ?? '' },
  });
}
</script>

<template>
  <div class="project-detail-page">
    <a-spin :spinning="page.loading.value" wrapper-class-name="detail-spin">
      <template v-if="page.project.value">
        <div class="detail-layout">
          <!-- 左侧二级导航 -->
          <ProjectSideNav
            :items="DETAIL_MENU_ITEMS"
            :bottom-items="DETAIL_BOTTOM_MENU_ITEMS"
            :active-key="page.activeMenu.value"
            :collapsed="sidebarCollapsed"
            @select="page.handleMenuClick"
            @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
          />

          <!-- 主区 -->
          <div class="main-area">
            <ProjectHeroPanel
              v-if="showHero"
              :project="page.project.value"
              :expanded="page.headerExpanded.value"
              :pinned-items="page.pinnedItems.value"
              @toggle="page.headerExpanded.value = !page.headerExpanded.value"
              @favorite="page.handleFavorite"
              @unpin="page.togglePinned"
            />

            <div
              :class="[
                'content-area',
                {
                  'content-area--production-info': page.activeMenu.value === 'production-info',
                  'content-area--reference-library': page.activeMenu.value === 'reference-library',
                  'content-area--settings': page.activeMenu.value === 'settings',
                },
              ]"
            >
              <ProjectOverviewPanel
                v-if="page.activeMenu.value === 'overview'"
                :outputs="page.outputs.value"
                :project-id="projectId"
                @go-data-list="goDataList"
              />

              <ProjectProductionInfoPanel
                v-else-if="page.activeMenu.value === 'production-info'"
                :project="page.project.value"
                :field-values="page.fieldValues.value"
                :edit-values="page.editValues.value"
                :pinned-keys="page.pinnedKeys.value"
                :saving="page.saving.value"
                @save="handleSave"
                @toggle-pin="page.togglePinned"
              />

              <ProjectReferenceLibraryPanel
                v-else-if="page.activeMenu.value === 'reference-library'"
                :project-id="projectId"
              />

              <ProjectSettingsPanel
                v-else-if="page.activeMenu.value === 'settings'"
                :project="page.project.value"
                :saving="page.saving.value"
                @save="handleSave"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- 空态 -->
      <section v-else-if="!page.loading.value" class="project-empty-state">
        <a-result status="404" title="项目不存在" sub-title="请确认链接是否正确，或该项目是否已被删除。">
          <template #extra>
            <a-button type="primary" @click="router.push('/projects')">返回项目列表</a-button>
          </template>
        </a-result>
      </section>
    </a-spin>
  </div>
</template>

<style scoped>
.project-detail-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
}

:deep(.detail-spin),
:deep(.detail-spin .ant-spin-nested-loading),
:deep(.detail-spin .ant-spin-container) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.detail-layout {
  flex: 1;
  min-height: 0;
  display: flex;
}

.main-area {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: var(--color-bg-page);
}

.content-area {
  flex: 1;
  overflow: hidden auto;
  padding: var(--spacing-5) var(--spacing-6);
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.content-area--production-info {
  overflow: hidden;
  padding: var(--spacing-4) var(--spacing-5);
}

.content-area--production-info > * {
  height: 100%;
}

.content-area--reference-library {
  overflow: hidden;
  padding: var(--spacing-4) var(--spacing-5);
}

.content-area--reference-library > * {
  height: 100%;
}

.content-area--settings {
  overflow: hidden;
  padding: var(--spacing-4) var(--spacing-5);
}

.content-area--settings > * {
  height: 100%;
}

.content-area::-webkit-scrollbar {
  width: 6px;
}

.content-area::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: var(--radius-full);
}

.project-empty-state {
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: var(--spacing-8) var(--spacing-6);
}
</style>
