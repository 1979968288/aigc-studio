import type { AssetStatus, AssetTypeName, AssetViewMode } from './types';

/** 资产状态元数据（AntD Tag 预设色 + 状态点色值） */
export const ASSET_STATUS_META: Record<AssetStatus, { label: string; tag: string; dot: string }> = {
  草稿: { label: '草稿', tag: 'default', dot: 'var(--color-text-tertiary)' },
  制作中: { label: '制作中', tag: 'blue', dot: 'var(--color-feedback-info)' },
  审核中: { label: '审核中', tag: 'gold', dot: 'var(--color-feedback-warning)' },
  修订中: { label: '修订中', tag: 'orange', dot: 'var(--color-feedback-error)' },
  已发布: { label: '已发布', tag: 'green', dot: 'var(--color-feedback-success)' },
  已废弃: { label: '已废弃', tag: 'default', dot: 'var(--color-text-disabled)' },
};

/** 资产类型（顺序 = 分组/筛选顺序） */
export const ASSET_TYPES: AssetTypeName[] = ['角色资产', '场景资产', '道具资产'];

/** 资产类型标签色（卡片/泳道视图的 AntD Tag 预设色） */
export const ASSET_TYPE_TAG_META: Record<AssetTypeName, string> = {
  角色资产: 'purple',
  场景资产: 'cyan',
  道具资产: 'gold',
};

/** 资产类型状态点色值（列表视图的轻量 pill） */
export const ASSET_TYPE_DOT_META: Record<AssetTypeName, string> = {
  角色资产: '#0055ff',
  场景资产: '#12a887',
  道具资产: '#e0941b',
};

/** 类型筛选选项（含「全部类型」） */
export const ASSET_TYPE_FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部类型', value: 'all' },
  ...ASSET_TYPES.map((type) => ({ label: type, value: type })),
];

/** 状态筛选选项（含「全部状态」） */
export const ASSET_STATUS_FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部状态', value: 'all' },
  ...(Object.keys(ASSET_STATUS_META) as AssetStatus[]).map((status) => ({
    label: ASSET_STATUS_META[status].label,
    value: status,
  })),
];

/** 视图切换选项 */
export const ASSET_VIEW_MODE_OPTIONS: Array<{ label: string; value: AssetViewMode }> = [
  { label: '列表', value: 'table' },
  { label: '泳道', value: 'kanban' },
  { label: '卡片', value: 'card' },
];

/** 状态 → 汇总分组：未开始/进行中/已完成/已废弃 */
export const ASSET_STATUS_GROUP: Record<AssetStatus, 'notStarted' | 'inProgress' | 'completed' | 'discarded'> = {
  草稿: 'notStarted',
  制作中: 'inProgress',
  审核中: 'inProgress',
  修订中: 'inProgress',
  已发布: 'completed',
  已废弃: 'discarded',
};

/** 建资产表单：状态选项 */
export const ASSET_STATUS_FORM_OPTIONS = (Object.keys(ASSET_STATUS_META) as AssetStatus[]).map(
  (status) => ({ label: ASSET_STATUS_META[status].label, value: status })
);

/** 建资产表单：格式选项 */
export const ASSET_FORMAT_OPTIONS = ['PNG', 'PSD', 'FBX', 'OBJ', 'MP4', 'EXR', '其他'].map((v) => ({
  label: v,
  value: v,
}));

/** 质检状态选项 */
export const QUALITY_CHECK_OPTIONS = [
  { label: '通过', value: 'PASS' },
  { label: '待检', value: 'PENDING' },
  { label: '未通过', value: 'FAIL' },
];