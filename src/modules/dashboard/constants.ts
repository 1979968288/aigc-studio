import type { DashCardMeta, DashboardMenuItem, DashboardTaskStatusTab } from './types';

export const GRID_COLS = 12;
export const ROW_HEIGHT = 26;
export const DASHBOARD_LAYOUT_STORAGE_KEY = 'aigc_studio_dashboard_layout_v3';
export const DASHBOARD_DEFAULT_CARD_HEIGHT = 12;
export const DASHBOARD_PROJECT_CARD_HEIGHT = 16;

/** 卡片元数据（100% 对齐 KK cardMetaList：顺序/尺寸/路由）
 * 顺序：watch → project → task → review → board → shortcuts → menu（board 在 review 之后） */
export const cardMetaList: DashCardMeta[] = [
  {
    id: 'watch',
    title: '关注项目',
    type: 'watch',
    route: '/projects',
    defaultW: 6,
    defaultH: DASHBOARD_PROJECT_CARD_HEIGHT,
    minW: 4,
    minH: DASHBOARD_PROJECT_CARD_HEIGHT,
  },
  {
    id: 'project',
    title: '项目管理',
    type: 'project',
    route: '/projects',
    defaultW: 6,
    defaultH: DASHBOARD_PROJECT_CARD_HEIGHT,
    minW: 4,
    minH: DASHBOARD_PROJECT_CARD_HEIGHT,
  },
  {
    id: 'task',
    title: '任务管理',
    type: 'task',
    route: '/my-tasks',
    defaultW: 6,
    defaultH: DASHBOARD_DEFAULT_CARD_HEIGHT,
    minW: 4,
    minH: 4,
  },
  {
    id: 'review',
    title: '审核管理',
    type: 'review',
    route: '/approvals',
    defaultW: 6,
    defaultH: DASHBOARD_DEFAULT_CARD_HEIGHT,
    minW: 4,
    minH: 4,
  },
  {
    id: 'global-production-board',
    title: '全局今日看板',
    type: 'global-production-board',
    route: '/my-tasks?view=global-production-board',
    defaultW: 12,
    defaultH: DASHBOARD_DEFAULT_CARD_HEIGHT,
    minW: 8,
    minH: 4,
  },
  {
    id: 'shortcuts',
    title: '收藏/捷径',
    type: 'shortcut',
    defaultW: 6,
    defaultH: DASHBOARD_DEFAULT_CARD_HEIGHT,
    minW: 4,
    minH: 4,
  },
  {
    id: 'menu',
    title: '功能菜单',
    type: 'menu',
    defaultW: 6,
    defaultH: DASHBOARD_DEFAULT_CARD_HEIGHT,
    minW: 4,
    minH: 4,
  },
];

export const cardMetaMap = Object.fromEntries(
  cardMetaList.map((item) => [item.id, item])
) as Record<string, DashCardMeta>;

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

/** 任务卡状态 Tab（KK 同款：待办/进行中/已完成） */
export const taskStatusTabs: DashboardTaskStatusTab[] = [
  { key: 'todo', label: '待办', accent: 'blue' },
  { key: 'in_progress', label: '进行中', accent: 'amber' },
  { key: 'done', label: '已完成', accent: 'green' },
];

export const TASK_STATUS_TO_TAB: Record<string, DashboardTaskStatusTab['key']> = {
  todo: 'todo',
  blocked: 'todo',
  in_progress: 'in_progress',
  review: 'in_progress',
  done: 'done',
};

export const TASK_STATUS_META: Record<string, { label: string; color: string }> = {
  todo: { label: '待办', color: 'var(--color-status-info)' },
  in_progress: { label: '进行中', color: 'var(--color-feedback-warning)' },
  review: { label: '审核中', color: 'var(--color-action-primary)' },
  done: { label: '已完成', color: 'var(--color-feedback-success)' },
  blocked: { label: '已阻塞', color: 'var(--color-feedback-error)' },
};

export const TASK_PRIORITY_META: Record<string, { label: string; color: string }> = {
  urgent: { label: '紧急', color: 'var(--color-feedback-error)' },
  high: { label: '高', color: 'var(--color-feedback-warning)' },
  medium: { label: '中', color: 'var(--color-status-info)' },
  low: { label: '低', color: 'var(--color-text-tertiary)' },
};

/** 生产线徽标（任务项上的小标签：剧本线含剧本与分镜划分） */
export const TASK_LINE_META: Record<string, { label: string; color: string; bg: string }> = {
  script: { label: '剧本', color: 'var(--color-status-info)', bg: 'var(--color-fill-info-subtle)' },
  art: { label: '美术', color: 'var(--color-feedback-warning)', bg: 'var(--color-fill-warning-subtle)' },
  video: { label: '视频', color: 'var(--color-feedback-success)', bg: 'var(--color-fill-success-subtle)' },
};

/** 全局今日看板泳道规格（100% 对齐 KK：逾期/待处理/今日制作/审批中/今日已清） */
export const GLOBAL_PRODUCTION_BOARD_CARD_MIN_WIDTH = 280;

export const APPROVAL_TYPE_META: Record<
  string,
  { label: string; accent: 'blue' | 'green' | 'purple'; icon: 'task' | 'asset' | 'approval' }
> = {
  asset_lock: { label: '资产锁定', accent: 'blue', icon: 'asset' },
  candidate_final: { label: '候选定稿', accent: 'green', icon: 'task' },
  project_create: { label: '项目立项', accent: 'purple', icon: 'approval' },
};

/** 功能菜单（对齐 KK menuItems：常驻系统功能入口） */
export const menuItems: DashboardMenuItem[] = [
  { id: 'projects', label: '项目列表', route: '/projects', icon: 'project', accent: 'blue' },
  { id: 'my-tasks', label: '我的任务', route: '/my-tasks', icon: 'task', accent: 'amber' },
  { id: 'assets', label: '资产库', route: '/assets', icon: 'asset', accent: 'purple' },
  { id: 'approvals', label: '审批中心', route: '/approvals', icon: 'approval', accent: 'green' },
  { id: 'review', label: '审片室', route: '/review', icon: 'review', accent: 'blue' },
  { id: 'inbox', label: '收件箱', route: '/inbox', icon: 'inbox', accent: 'amber' },
  { id: 'staff', label: '人员管理', route: '/staff', icon: 'staff', accent: 'blue' },
];
