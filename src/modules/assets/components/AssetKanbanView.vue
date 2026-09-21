<script setup lang="ts">
import { computed } from 'vue';
import { useAssetListPageContext } from '../useAssetListPage';
import { ASSET_STATUS_META, ASSET_TYPE_TAG_META } from '../constants';
import type { AssetStatus } from '../types';

defineOptions({ name: 'AssetKanbanView' });

const page = useAssetListPageContext();

const lanes = computed(() =>
  (Object.keys(ASSET_STATUS_META) as AssetStatus[]).map((status) => ({
    status,
    label: ASSET_STATUS_META[status].label,
    tag: ASSET_STATUS_META[status].tag,
    items: page.filteredAssets.value.filter((asset) => asset.status === status),
  }))
);

const total = computed(() => page.filteredAssets.value.length);
</script>

<template>
  <div class="al-kanban">
    <div v-for="lane in lanes" :key="lane.status" class="al-kanban__lane">
      <div class="al-kanban__lane-head">
        <a-tag :color="lane.tag">{{ lane.label }}</a-tag>
        <span class="al-kanban__lane-count">{{ lane.items.length }}</span>
      </div>
      <div class="al-kanban__lane-body">
        <button
          v-for="asset in lane.items"
          :key="asset.id"
          type="button"
          class="al-kanban__item"
          @click="page.openDetail(asset)"
        >
          <div class="al-kanban__item-name">{{ asset.name }}</div>
          <div class="al-kanban__item-meta">
            <a-tag :color="ASSET_TYPE_TAG_META[asset.assetType]">{{ asset.assetType }}</a-tag>
            <span class="al-kanban__item-version">{{ asset.version }}</span>
          </div>
        </button>
        <div v-if="!lane.items.length" class="al-kanban__empty">-</div>
      </div>
    </div>
    <a-empty v-if="!total" class="al-kanban__empty-all" description="暂无资产数据" />
  </div>
</template>

<style scoped>
.al-kanban {
  display: flex;
  gap: var(--spacing-3);
  align-items: flex-start;
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
}

.al-kanban__lane {
  flex: 0 0 240px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-4);
  background: var(--color-bg-card-soft);
}

.al-kanban__lane-head {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-border-divider);
}

.al-kanban__lane-count {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
}

.al-kanban__lane-body {
  flex: 1;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  overflow-y: auto;
}

.al-kanban__item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-3);
  background: var(--component-panel-background);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.al-kanban__item:hover {
  border-color: var(--color-action-primary);
}

.al-kanban__item-name {
  color: var(--color-text-primary);
  font-size: var(--font-size-13);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.al-kanban__item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.al-kanban__item-version {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
}

.al-kanban__empty {
  color: var(--color-text-disabled);
  text-align: center;
  padding: var(--spacing-4);
}

.al-kanban__empty-all {
  display: none;
}
</style>