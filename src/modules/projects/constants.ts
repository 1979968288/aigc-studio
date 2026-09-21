/** 项目状态元数据（与首页 PROJECT_STATUS_META 保持一致） */
export const PROJECT_STATUS_META: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  '0': { label: '草稿', color: 'var(--color-text-tertiary)', bgColor: 'var(--color-bg-disabled)' },
  '1': { label: '筹备中', color: 'var(--color-status-info)', bgColor: 'var(--color-fill-info-subtle)' },
  '2': { label: '制作中', color: 'var(--color-feedback-success)', bgColor: 'var(--color-fill-success-subtle)' },
  '3': { label: '已暂停', color: 'var(--color-feedback-warning)', bgColor: 'var(--color-fill-warning-subtle)' },
  '4': { label: '已归档', color: 'var(--color-action-primary)', bgColor: 'var(--color-fill-info-subtle)' },
  '5': { label: '已取消', color: 'var(--color-text-tertiary)', bgColor: 'var(--color-bg-disabled)' },
};

export const PIPELINE_TEMPLATE_LABELS: Record<string, string> = {
  standard: '标准管线',
  lightweight: '轻量管线',
  lip_sync: '口型管线',
};

/** 项目列表视图模式（KK viewModeOptions 同款结构，砍掉 matrix） */
export const PROJECT_VIEW_MODE_OPTIONS = [
  { key: 'card', label: '卡片' },
  { key: 'table', label: '表格' },
  { key: 'kanban', label: '泳道' },
] as const;

export type ProjectViewMode = (typeof PROJECT_VIEW_MODE_OPTIONS)[number]['key'];

/** 视图模式持久化 key */
export const PROJECT_VIEW_MODE_STORAGE_KEY = 'aigc_studio_project_view_mode_v1';
