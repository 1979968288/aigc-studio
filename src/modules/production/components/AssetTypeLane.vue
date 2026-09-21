<script setup lang="ts">
import { computed, ref } from 'vue';
import { EnvironmentOutlined, ToolOutlined, UserOutlined } from '@ant-design/icons-vue';
import AssetCard from './AssetCard.vue';
import { useProductionCenter } from '../useProductionCenterPage';
import type { AssetTypeName, PCAsset } from '../types';

defineOptions({ name: 'AssetTypeLane' });

const props = defineProps<{
  assetType: AssetTypeName;
  assets: PCAsset[];
}>();

const ctx = useProductionCenter();

const ICON_COMPONENTS: Record<AssetTypeName, typeof UserOutlined> = {
  角色资产: UserOutlined,
  场景资产: EnvironmentOutlined,
  道具资产: ToolOutlined,
};

const iconComponent = computed(() => ICON_COMPONENTS[props.assetType]);

const selectedIds = computed(() =>
  ctx.selectedEntity.value?.type === 'asset' ? [ctx.selectedEntity.value.id] : []
);
const highlightedIds = computed(() => ctx.highlightedAssets.value);

const isDragOver = ref(false);

function onDragOver(): void {
  isDragOver.value = true;
}

function onDragLeave(): void {
  isDragOver.value = false;
}

function onDrop(e: DragEvent): void {
  isDragOver.value = false;
  const raw = e.dataTransfer?.getData('application/pc-scene');
  if (raw) {
    ctx.handleDropSceneToAsset(raw, props.assetType);
  }
}

function getRelatedTaskIds(asset: PCAsset): string {
  const ids = ctx.tasks.value.filter((task) => asset.usedInScenes.includes(task.sceneId)).map((task) => task.id);
  if (ids.length > 3) {
    return `${ids.slice(0, 3).join(', ')}...`;
  }
  return ids.join(', ') || '-';
}
</script>

<template>
  <div
    class="pc-asset-type-lane"
    :data-asset-type="assetType"
    @dragover.prevent="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <div class="pc-asset-type-lane__header">
      <component :is="iconComponent" class="pc-asset-type-lane__icon" aria-hidden="true" />
      <h3 class="pc-asset-type-lane__title">{{ assetType }}</h3>
    </div>

    <div class="pc-asset-type-lane__body" :class="{ 'pc-asset-type-lane__body--drag-over': isDragOver }">
      <AssetCard
        v-for="asset in assets"
        :key="asset.id"
        :asset="asset"
        :related-task-ids="getRelatedTaskIds(asset)"
        :is-selected="selectedIds.includes(asset.id)"
        :is-highlighted="highlightedIds.includes(asset.id)"
        @click="ctx.selectAsset(asset)"
        @dblclick="(e: MouseEvent) => ctx.showContextMenu(e, 'asset', asset)"
        @contextmenu="(e: MouseEvent) => ctx.showContextMenu(e, 'asset', asset)"
      />

      <div
        class="pc-asset-type-lane__drop-hint"
        :class="{ 'pc-asset-type-lane__drop-hint--active': isDragOver }"
      >
        ↓ 拖拽场次到此处生成{{ assetType }}需求
      </div>
    </div>
  </div>
</template>

<style scoped>
.pc-asset-type-lane {
  border: 2px dashed transparent;
  border-radius: var(--radius-4);
  padding: var(--spacing-3);
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.pc-asset-type-lane__header {
  margin-bottom: var(--spacing-3);
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.pc-asset-type-lane__icon {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-size: 16px;
}

.pc-asset-type-lane__title {
  font-size: var(--font-size-16);
  color: var(--color-text-primary);
  flex: 1;
  margin: 0;
}

.pc-asset-type-lane__body--drag-over {
  background: var(--color-fill-primary-subtle);
  border-radius: var(--radius-4);
}

.pc-asset-type-lane__drop-hint {
  padding: var(--spacing-5);
  text-align: center;
  font-size: var(--font-size-14);
  color: var(--color-text-tertiary);
  border-radius: var(--radius-4);
  border: 2px dashed var(--color-border-default);
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
  cursor: default;
}

.pc-asset-type-lane__drop-hint:hover,
.pc-asset-type-lane__drop-hint--active {
  border-color: var(--color-action-primary);
  color: var(--color-action-primary-hover);
  background: var(--color-fill-primary-subtle);
}
</style>