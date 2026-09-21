import { APPROVAL_TYPE_META } from '@/modules/dashboard/constants';
import type { ApprovalCategoryDef } from './types';

export const APPROVAL_CATEGORIES: ApprovalCategoryDef[] = [
  {
    key: 'task',
    label: '任务审核',
    types: ['asset_lock', 'candidate_final'],
    operatorId: 'u-director',
    operatorLabel: '导演',
  },
  {
    key: 'management',
    label: '管理审批',
    types: ['project_create'],
    operatorId: 'u-producer',
    operatorLabel: '制片',
  },
];

export const APPROVAL_CATEGORY_MAP = Object.fromEntries(
  APPROVAL_CATEGORIES.map((item) => [item.key, item])
) as Record<string, ApprovalCategoryDef>;

/** 审批状态筛选 Tab */
export const APPROVAL_STATUS_TABS: { key: 'all' | 'pending' | 'processed'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processed', label: '已处理' },
];

/** 审批状态文案与颜色 */
export const APPROVAL_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待审', color: 'var(--color-status-info)', bg: 'var(--color-fill-info-subtle)' },
  approved: { label: '已通过', color: 'var(--color-feedback-success)', bg: 'var(--color-fill-success-subtle)' },
  rejected: { label: '已驳回', color: 'var(--color-feedback-error)', bg: 'var(--color-fill-error-subtle)' },
};

/** 审批类型选项（复用 dashboard 元数据） */
export const APPROVAL_TYPE_OPTIONS = Object.entries(APPROVAL_TYPE_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export { APPROVAL_TYPE_META };
