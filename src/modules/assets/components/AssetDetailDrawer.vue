<script setup lang="ts">
import { useAssetListPageContext } from '../useAssetListPage';
import { ASSET_STATUS_META } from '../constants';

defineOptions({ name: 'AssetDetailDrawer' });

const page = useAssetListPageContext();
const { detailAsset, closeDetail, openEdit, sceneLabel } = page;

/** 资产类型胶囊色（文字色/填充色，取自类型状态点色值） */
const TYPE_PILL: Record<string, { color: string; bg: string }> = {
  角色资产: { color: '#0055ff', bg: 'rgba(0, 85, 255, 0.1)' },
  场景资产: { color: '#12a887', bg: 'rgba(18, 168, 135, 0.1)' },
  道具资产: { color: '#e0941b', bg: 'rgba(224, 148, 27, 0.12)' },
};

/** 资产状态胶囊色（文字色/填充色，与列表状态点同源） */
const STATUS_PILL: Record<string, { color: string; bg: string }> = {
  草稿: { color: 'var(--color-text-tertiary)', bg: 'var(--color-bg-hover)' },
  制作中: { color: 'var(--color-feedback-info)', bg: 'var(--color-fill-info-subtle)' },
  审核中: { color: 'var(--color-feedback-warning)', bg: 'var(--color-fill-warning-subtle)' },
  修订中: { color: 'var(--color-feedback-error)', bg: 'var(--color-fill-error-subtle)' },
  已发布: { color: 'var(--color-feedback-success)', bg: 'var(--color-fill-success-subtle)' },
  已废弃: { color: 'var(--color-text-disabled)', bg: 'var(--color-bg-hover)' },
};

function qualityLabel(value: string): string {
  if (value === 'PASS') return '通过';
  if (value === 'FAIL') return '未通过';
  return '待检';
}

function qualityClass(value: string): string {
  if (value === 'PASS') return 'is-pass';
  if (value === 'FAIL') return 'is-fail';
  return 'is-pending';
}
</script>

<template>
  <a-drawer
    :open="!!detailAsset"
    title="资产详情"
    width="460"
    :closable="true"
    @close="closeDetail"
  >
    <template v-if="detailAsset">
      <div class="al-detail__head">
        <div class="al-detail__head-row">
          <span
            class="al-detail__pill"
            :style="{ color: TYPE_PILL[detailAsset.assetType]?.color, background: TYPE_PILL[detailAsset.assetType]?.bg }"
          >
            {{ detailAsset.assetType }}
          </span>
          <span
            class="al-detail__pill"
            :style="{ color: STATUS_PILL[detailAsset.status]?.color, background: STATUS_PILL[detailAsset.status]?.bg }"
          >
            {{ ASSET_STATUS_META[detailAsset.status].label }}
          </span>
          <span class="al-detail__code">{{ detailAsset.id }}</span>
        </div>
        <h3 class="al-detail__title">{{ detailAsset.name }}</h3>
      </div>

      <div class="al-detail__rows">
        <div class="al-detail__row">
          <span class="al-detail__label">当前版本</span>
          <span class="al-detail__value">{{ detailAsset.version }}</span>
        </div>
        <div class="al-detail__row">
          <span class="al-detail__label">制作</span>
          <span class="al-detail__value">{{ detailAsset.artist || '未分配' }}</span>
        </div>
        <div class="al-detail__row">
          <span class="al-detail__label">文件大小</span>
          <span class="al-detail__value">{{ detailAsset.size }}</span>
        </div>
        <div class="al-detail__row">
          <span class="al-detail__label">文件格式</span>
          <span class="al-detail__value">
            <span class="al-detail__format">{{ detailAsset.format }}</span>
          </span>
        </div>
        <div class="al-detail__row">
          <span class="al-detail__label">质检状态</span>
          <span class="al-detail__value">
            <span class="al-detail__quality" :class="qualityClass(detailAsset.qualityCheck)">
              <i class="al-detail__quality-dot" />
              {{ qualityLabel(detailAsset.qualityCheck) }}
            </span>
          </span>
        </div>
      </div>

      <div class="al-detail__section-title">版本历史</div>
      <div class="al-detail__versions">
        <div
          v-for="version in detailAsset.versions"
          :key="version.id"
          class="al-detail__version"
          :class="{ 'al-detail__version--current': version.version === detailAsset.version }"
        >
          <div class="al-detail__version-main">
            <span class="al-detail__version-no">{{ version.version }}</span>
            <span class="al-detail__version-status">{{ ASSET_STATUS_META[version.status].label }}</span>
          </div>
          <div class="al-detail__version-note">{{ version.note }}</div>
        </div>
      </div>

      <div class="al-detail__section-title">引用场次</div>
      <div class="al-detail__scenes">
        <span v-for="id in detailAsset.usedInScenes" :key="id" class="al-detail__scene">
          {{ sceneLabel(id) }}
        </span>
        <span v-if="!detailAsset.usedInScenes.length" class="al-detail__empty">暂无引用场次</span>
      </div>
    </template>

    <template #footer>
      <a-space>
        <a-button @click="closeDetail">关闭</a-button>
        <a-button v-if="detailAsset" type="primary" @click="openEdit(detailAsset)">编辑</a-button>
      </a-space>
    </template>
  </a-drawer>
</template>

<style scoped>
/* 清爽精简风：无实线分隔，头部与内容之间用留白分区 */
:deep(.ant-drawer-header) {
  border-bottom: none;
  padding-bottom: var(--spacing-3);
}

:deep(.ant-drawer-footer) {
  border-top: none;
  padding-top: var(--spacing-3);
}

.al-detail__head {
  margin-bottom: var(--spacing-5);
}

.al-detail__head-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.al-detail__pill {
  display: inline-block;
  padding: 1px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-12);
  line-height: 20px;
}

.al-detail__code {
  margin-left: auto;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
  font-variant-numeric: tabular-nums;
}

.al-detail__title {
  margin: var(--spacing-2) 0 0;
  font-size: var(--font-size-16);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
  word-break: break-word;
}

.al-detail__rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.al-detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.al-detail__label {
  flex-shrink: 0;
  font-size: var(--font-size-13);
  color: var(--color-text-tertiary);
}

.al-detail__value {
  min-width: 0;
  font-size: var(--font-size-13);
  color: var(--color-text-primary);
  text-align: right;
}

.al-detail__format {
  display: inline-block;
  padding: 1px 8px;
  border-radius: var(--radius-2);
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  font-size: var(--font-size-12);
}

.al-detail__quality {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-13);
}

.al-detail__quality-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.al-detail__quality.is-pass {
  color: var(--color-feedback-success);
}

.al-detail__quality.is-fail {
  color: var(--color-feedback-error);
}

.al-detail__quality.is-pending {
  color: var(--color-feedback-warning);
}

.al-detail__section-title {
  margin: var(--spacing-5) 0 var(--spacing-2);
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.al-detail__versions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.al-detail__version {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
}

.al-detail__version--current {
  background: var(--color-fill-primary-subtle);
}

.al-detail__version-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.al-detail__version-no {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  font-variant-numeric: tabular-nums;
}

.al-detail__version-status {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
}

.al-detail__version-note {
  margin-top: 2px;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
}

.al-detail__scenes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.al-detail__scene {
  display: inline-block;
  padding: 1px 10px;
  border-radius: var(--radius-full);
  background: var(--color-fill-primary-subtle);
  color: var(--color-status-info);
  font-size: var(--font-size-12);
  line-height: 20px;
}

.al-detail__empty {
  color: var(--color-text-disabled);
  font-size: var(--font-size-13);
}
</style>
