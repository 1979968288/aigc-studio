<script setup lang="ts">
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { useAssetListPageContext } from '../useAssetListPage';
import { ASSET_STATUS_META, ASSET_TYPE_DOT_META } from '../constants';
import type { AssetListItem } from '../types';

defineOptions({ name: 'AssetTableView' });

const page = useAssetListPageContext();
const { filteredAssets, openDetail, openEdit, remove, sceneLabel } = page;

const columns: TableColumnsType = [
  { title: '资产编号', dataIndex: 'id', key: 'id', width: 110 },
  { title: '资产名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'assetType', key: 'assetType', width: 110 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 104 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
  { title: '制作', dataIndex: 'artist', key: 'artist', width: 96 },
  { title: '大小', dataIndex: 'size', key: 'size', width: 96 },
  { title: '格式', dataIndex: 'format', key: 'format', width: 80 },
  { title: '引用场次', dataIndex: 'usedInScenes', key: 'usedInScenes', width: 96 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

/** 类型展示短名（角色/场景/道具） */
const TYPE_SHORT: Record<string, string> = {
  角色资产: '角色',
  场景资产: '场景',
  道具资产: '道具',
};

function row(record: unknown): AssetListItem {
  return record as AssetListItem;
}

function sceneNames(asset: AssetListItem): string {
  return asset.usedInScenes.map((id) => sceneLabel(id)).join('、') || '暂无引用';
}
</script>

<template>
  <div class="al-table">
    <a-table
      row-key="id"
      size="middle"
      :columns="columns"
      :data-source="filteredAssets"
      :pagination="{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 项`,
        size: 'small',
      }"
      :scroll="{ x: 1000 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'id'">
          <span class="al-table__code">{{ row(record).id }}</span>
        </template>

        <template v-else-if="column.key === 'name'">
          <a class="al-table__name" @click="openDetail(row(record))">{{ row(record).name }}</a>
        </template>

        <template v-else-if="column.key === 'assetType'">
          <span class="al-table__type">
            <i class="al-table__type-dot" :style="{ background: ASSET_TYPE_DOT_META[row(record).assetType] }" />
            {{ TYPE_SHORT[row(record).assetType] }}
          </span>
        </template>

        <template v-else-if="column.key === 'status'">
          <span class="al-table__status">
            <i class="al-table__status-dot" :style="{ background: ASSET_STATUS_META[row(record).status].dot }" />
            {{ ASSET_STATUS_META[row(record).status].label }}
          </span>
        </template>

        <template v-else-if="column.key === 'version'">
          <span class="al-table__version">{{ row(record).version }}</span>
        </template>

        <template v-else-if="column.key === 'format'">
          <span class="al-table__format">{{ row(record).format }}</span>
        </template>

        <template v-else-if="column.key === 'usedInScenes'">
          <a-tooltip :title="sceneNames(row(record))">
            <span class="al-table__scenes">{{ row(record).usedInScenes.length }} 场</span>
          </a-tooltip>
        </template>

        <template v-else-if="column.key === 'action'">
          <div class="al-table__actions">
            <a-tooltip title="查看">
              <a-button type="text" size="small" @click="openDetail(row(record))">
                <EyeOutlined />
              </a-button>
            </a-tooltip>
            <a-tooltip title="编辑">
              <a-button type="text" size="small" @click="openEdit(row(record))">
                <EditOutlined />
              </a-button>
            </a-tooltip>
            <a-popconfirm title="确认删除该资产？" ok-text="删除" cancel-text="取消" @confirm="remove(row(record))">
              <a-tooltip title="删除">
                <a-button type="text" size="small" danger @click.stop>
                  <DeleteOutlined />
                </a-button>
              </a-tooltip>
            </a-popconfirm>
          </div>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.al-table {
  height: 100%;
  overflow: auto;
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-4);
  background: var(--component-panel-background);
}

.al-table :deep(.ant-table) {
  background: transparent;
}

.al-table :deep(.ant-table-thead > tr > th) {
  background: var(--color-bg-card-soft);
  color: var(--color-text-secondary);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-medium);
  border-bottom: 1px solid var(--color-border-divider);
}

.al-table :deep(.ant-table-thead > tr > th::before) {
  display: none;
}

.al-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid var(--color-border-divider);
  color: var(--color-text-secondary);
  font-size: var(--font-size-13);
}

.al-table :deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: none;
}

.al-table :deep(.ant-table-tbody > tr) {
  transition: background 0.15s ease;
}

.al-table :deep(.ant-table-tbody > tr:hover > td) {
  background: var(--color-bg-hover);
}

.al-table__code {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.2px;
}

.al-table__name {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
}

.al-table__name:hover {
  color: var(--color-action-link);
}

.al-table__type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
}

.al-table__type-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-full);
  flex: 0 0 auto;
}

.al-table__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-primary);
}

.al-table__status-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  flex: 0 0 auto;
}

.al-table__version {
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.al-table__format {
  display: inline-block;
  padding: 1px 8px;
  border-radius: var(--radius-2);
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  font-size: var(--font-size-12);
}

.al-table__scenes {
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
  cursor: default;
}

.al-table__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.al-table :deep(.ant-pagination) {
  margin: 12px 16px;
}
</style>