<script setup lang="ts">
import { h } from 'vue';
import {
  AppstoreOutlined,
  PlusOutlined,
  ProjectOutlined,
  ReloadOutlined,
  SearchOutlined,
  TableOutlined,
} from '@ant-design/icons-vue';
import { useAssetListPageContext } from '../useAssetListPage';
import {
  ASSET_STATUS_FILTER_OPTIONS,
  ASSET_TYPE_FILTER_OPTIONS,
} from '../constants';
import type { AssetViewMode } from '../types';

defineOptions({ name: 'AssetListToolbar' });

const page = useAssetListPageContext();

const { viewMode, typeFilter, statusFilter, keyword, filteredAssets, resetFilters, openCreate } = page;

const viewModeOptions = [
  { value: 'table', label: '列表', icon: TableOutlined },
  { value: 'kanban', label: '泳道', icon: ProjectOutlined },
  { value: 'card', label: '卡片', icon: AppstoreOutlined },
].map((item) => ({
  value: item.value as AssetViewMode,
  label: h('span', { class: 'al-view-label' }, [
    h(item.icon, { class: 'al-view-icon' }),
    h('span', item.label),
  ]),
}));
</script>

<template>
  <div class="al-toolbar">
    <div class="al-toolbar__left">
      <a-segmented v-model:value="viewMode" :options="viewModeOptions" />
    </div>

    <div class="al-toolbar__right">
      <a-select
        v-model:value="typeFilter"
        class="al-toolbar__select"
        :options="ASSET_TYPE_FILTER_OPTIONS"
      />
      <a-select
        v-model:value="statusFilter"
        class="al-toolbar__select"
        :options="ASSET_STATUS_FILTER_OPTIONS"
      />
      <a-input
        v-model:value="keyword"
        class="al-toolbar__search"
        placeholder="名称 / 编号 / 制作"
        allow-clear
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input>
      <a-tooltip title="重置筛选">
        <a-button type="text" @click="resetFilters">
          <ReloadOutlined />
        </a-button>
      </a-tooltip>
      <span class="al-toolbar__count">{{ filteredAssets.length }} 项</span>
      <a-button type="primary" @click="openCreate">
        <PlusOutlined /> 新建资产
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.al-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.al-toolbar__left,
.al-toolbar__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.al-toolbar__right {
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.al-toolbar__select {
  width: 128px;
  flex: 0 0 auto;
}

.al-toolbar__search {
  width: 220px;
}

.al-toolbar__count {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
  white-space: nowrap;
}
</style>

<style>
.al-view-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.al-view-icon {
  font-size: 13px;
}
</style>