import type {
  AssetTypeName,
  AssetStatus,
  RiskLevel,
  SceneStatus,
  TaskStatus,
} from './types';

/** 场次状态元数据 */
export const SCENE_STATUS_META: Record<SceneStatus, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'var(--color-text-tertiary)' },
  scheduled: { label: '已排期', color: 'var(--color-feedback-info)' },
  in_progress: { label: '制作中', color: 'var(--color-feedback-success)' },
  completed: { label: '已完成', color: 'var(--color-action-primary)' },
  cancelled: { label: '已取消', color: 'var(--color-text-disabled)' },
};

/** 任务（工序）状态元数据 */
export const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待开始', color: 'var(--color-text-tertiary)' },
  scheduled: { label: '已排期', color: 'var(--color-feedback-info)' },
  in_progress: { label: '进行中', color: 'var(--color-feedback-success)' },
  completed: { label: '已完成', color: 'var(--color-action-primary)' },
  cancelled: { label: '已取消', color: 'var(--color-text-disabled)' },
};

/** 风险等级元数据 */
export const RISK_LEVEL_META: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: '低风险', color: 'var(--color-feedback-success)' },
  medium: { label: '中风险', color: 'var(--color-feedback-warning)' },
  high: { label: '高风险', color: 'var(--color-feedback-error)' },
};

/** 资产状态元数据 */
export const ASSET_STATUS_META: Record<AssetStatus, { label: string; color: string }> = {
  草稿: { label: '草稿', color: 'var(--color-text-tertiary)' },
  制作中: { label: '制作中', color: 'var(--color-feedback-info)' },
  审核中: { label: '审核中', color: 'var(--color-feedback-warning)' },
  修订中: { label: '修订中', color: 'var(--color-feedback-error)' },
  已发布: { label: '已发布', color: 'var(--color-feedback-success)' },
  已废弃: { label: '已废弃', color: 'var(--color-text-disabled)' },
};

/** 资产类型列表（顺序 = 资产层分组顺序） */
export const ASSET_TYPES: AssetTypeName[] = ['角色资产', '场景资产', '道具资产'];

/** 搜索字段选项 */
export const SEARCH_FIELD_OPTIONS: { label: string; value: 'scene' | 'task' | 'asset' }[] = [
  { label: '场次', value: 'scene' },
  { label: '任务', value: 'task' },
  { label: '资产', value: 'asset' },
];

/** 用于新建下拉的选项 key */
export type CreateDialogType = 'scene' | 'task' | 'asset';

export const CREATE_MENU_ITEMS: { key: CreateDialogType; label: string }[] = [
  { key: 'scene', label: '新建场次' },
  { key: 'task', label: '新建任务' },
  { key: 'asset', label: '新建资产' },
];