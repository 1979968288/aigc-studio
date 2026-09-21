<script setup lang="ts">
import { computed } from 'vue';
import type { PCAsset } from '../types';
import { ASSET_STATUS_META } from '../constants';
import { resolveStaffName } from '@/modules/staff/api';

const props = defineProps<{
  asset: PCAsset;
  relatedTaskIds: string;
  isSelected: boolean;
  isHighlighted: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', payload: MouseEvent): void;
  (e: 'dblclick', payload: MouseEvent): void;
  (e: 'contextmenu', payload: MouseEvent): void;
}>();

const statusColor = computed(() => ASSET_STATUS_META[props.asset.status]?.color ?? 'var(--color-text-secondary)');
</script>

<template>
  <div
    :class="['pc-card pc-asset-card', { 'pc-card--selected': isSelected, 'pc-card--highlighted': isHighlighted }]"
    @click="emit('click', $event)"
    @dblclick="emit('dblclick', $event)"
    @contextmenu="emit('contextmenu', $event)"
  >
    <div class="pc-asset-card__id">{{ asset.id }}</div>
    <div class="pc-asset-card__name">{{ asset.name }}</div>

    <div class="pc-asset-card__info">
      版本：{{ asset.version }}
      <span class="pc-asset-card__status" :style="{ color: statusColor }">{{ asset.status }}</span>
    </div>
    <div class="pc-asset-card__info">制作：{{ resolveStaffName(asset.artist) }}</div>
    <div class="pc-asset-card__info pc-asset-card__info--spaced">
      大小：{{ asset.size }} {{ asset.format }}
    </div>

    <div class="pc-asset-card__footer">
      <a-tooltip title="使用的场次">
        <span>场次：{{ asset.usedInScenes.join(', ') || '-' }}</span>
      </a-tooltip>
      <a-tooltip title="质检状态">
        <span :class="{ 'pc-asset-card__qc-pass': asset.qualityCheck === 'PASS' }">
          质检：{{ asset.qualityCheck }}
        </span>
      </a-tooltip>
    </div>

    <div class="pc-asset-card__tasks">
      <a-tooltip title="关联的任务">
        <span>生成任务：{{ relatedTaskIds }}</span>
      </a-tooltip>
    </div>

    <div v-if="isSelected" class="pc-card__selected-dot" />
  </div>
</template>

<style scoped>
.pc-asset-card {
  padding: var(--spacing-4);
  border-radius: var(--radius-4);
  border: 1px solid var(--color-border-default);
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
  position: relative;
  overflow: hidden;
  background: var(--component-card-background);
  margin-bottom: var(--spacing-3);
  box-shadow: var(--shadow-card);
}

.pc-asset-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-accent);
  box-shadow: var(--shadow-card-hover);
}

.pc-card--selected,
.pc-card--highlighted {
  background: var(--color-fill-primary-subtle);
  border-color: var(--color-action-primary);
}

.pc-card--selected {
  box-shadow: 0 0 0 2px var(--color-fill-primary-subtle), var(--shadow-card-hover);
}

.pc-asset-card__id {
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.pc-asset-card__name {
  margin-bottom: var(--spacing-3);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.pc-asset-card__info {
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.pc-asset-card__info--spaced {
  margin-bottom: var(--spacing-2);
}

.pc-asset-card__status {
  margin-left: 4px;
}

.pc-asset-card__footer {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.pc-asset-card__qc-pass {
  color: var(--color-feedback-success);
}

.pc-asset-card__tasks {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
}

.pc-card__selected-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: var(--color-action-primary);
  border-radius: var(--radius-full);
  border: 2px solid var(--color-bg-card);
}
</style>