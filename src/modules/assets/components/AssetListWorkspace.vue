<script setup lang="ts">
import { onMounted, provide } from 'vue';
import AssetListStats from './AssetListStats.vue';
import AssetListToolbar from './AssetListToolbar.vue';
import AssetTableView from './AssetTableView.vue';
import AssetCardView from './AssetCardView.vue';
import AssetKanbanView from './AssetKanbanView.vue';
import AssetDetailDrawer from './AssetDetailDrawer.vue';
import AssetEditModal from './AssetEditModal.vue';
import { assetListPageKey, useAssetListPage } from '../useAssetListPage';

defineOptions({ name: 'AssetListWorkspace' });

const props = defineProps<{ projectId: string }>();

const page = useAssetListPage(props.projectId);
provide(assetListPageKey, page);

const { projectName, loading, viewMode } = page;

onMounted(() => {
  void page.load();
});
</script>

<template>
  <div class="al-page">
    <header class="al-page__header">
      <div class="al-page__title-wrap">
        <span class="al-page__title">资产清单</span>
        <span class="al-page__project">{{ projectName }}</span>
      </div>
    </header>

    <AssetListStats />
    <AssetListToolbar />

    <section class="al-page__content">
      <a-spin :spinning="loading">
        <AssetTableView v-if="viewMode === 'table'" />
        <AssetKanbanView v-else-if="viewMode === 'kanban'" />
        <AssetCardView v-else />
      </a-spin>
    </section>

    <AssetDetailDrawer />
    <AssetEditModal />
  </div>
</template>

<style scoped>
.al-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  height: 100%;
  padding: var(--spacing-5);
  overflow: hidden;
}

.al-page__header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.al-page__title-wrap {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
  min-width: 0;
}

.al-page__title {
  color: var(--color-text-primary);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
}

.al-page__project {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-13);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.al-page__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>