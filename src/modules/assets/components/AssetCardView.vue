<script setup lang="ts">
import { FileImageOutlined } from '@ant-design/icons-vue';
import { useAssetListPageContext } from '../useAssetListPage';
import { ASSET_STATUS_META, ASSET_TYPE_TAG_META } from '../constants';

defineOptions({ name: 'AssetCardView' });

const page = useAssetListPageContext();
const { filteredAssets, openDetail } = page;
</script>

<template>
  <div v-if="filteredAssets.length" class="al-card-grid">
    <button
      v-for="asset in filteredAssets"
      :key="asset.id"
      type="button"
      class="al-card"
      @click="openDetail(asset)"
    >
      <div class="al-card__thumb" :data-type="asset.assetType">
        <FileImageOutlined class="al-card__thumb-icon" />
      </div>
      <div class="al-card__body">
        <div class="al-card__name">{{ asset.name }}</div>
        <div class="al-card__tags">
          <a-tag :color="ASSET_TYPE_TAG_META[asset.assetType]">{{ asset.assetType }}</a-tag>
          <a-tag :color="ASSET_STATUS_META[asset.status].tag">{{ ASSET_STATUS_META[asset.status].label }}</a-tag>
        </div>
        <div class="al-card__meta">
          <span>{{ asset.version }}</span>
          <span class="al-card__dot">·</span>
          <span>{{ asset.artist || '未分配' }}</span>
        </div>
        <div class="al-card__meta al-card__meta--muted">
          <span>{{ asset.size }} · {{ asset.format }}</span>
        </div>
      </div>
    </button>
  </div>

  <a-empty v-else description="暂无资产数据" />
</template>

<style scoped>
.al-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-4);
}

.al-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-4);
  background: var(--component-panel-background);
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.al-card:hover {
  border-color: var(--color-action-primary);
  box-shadow: var(--shadow-1);
}

.al-card__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #fff;
  background: linear-gradient(135deg, #7d9bff, #4d6bff);
}

.al-card__thumb[data-type='场景资产'] {
  background: linear-gradient(135deg, #3fd0b4, #1ba88c);
}

.al-card__thumb[data-type='道具资产'] {
  background: linear-gradient(135deg, #f2b04c, #d99118);
}

.al-card__thumb-icon {
  font-size: 32px;
  opacity: 0.9;
}

.al-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
}

.al-card__name {
  color: var(--color-text-primary);
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.al-card__tags {
  display: flex;
  gap: 4px;
}

.al-card__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-12);
}

.al-card__meta--muted {
  color: var(--color-text-tertiary);
}

.al-card__dot {
  color: var(--color-text-tertiary);
}
</style>