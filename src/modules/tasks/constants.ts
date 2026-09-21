import { TASK_LINE_META, TASK_PRIORITY_META, TASK_STATUS_META } from '@/modules/dashboard/constants';
import type { TaskKanbanLane, TaskViewDef } from './types';

/** 左侧栏视图（对齐 KK ViewSidebar：系统视图 + 生产线分组；分镜已并入剧本线） */
export const TASK_VIEWS: TaskViewDef[] = [
  { id: 'sys-all', label: '所有任务', icon: 'all', group: 'system', mode: 'table' },
  { id: 'sys-board', label: '全局今日看板', icon: 'board', group: 'system', mode: 'kanban' },
  { id: 'line-art', label: '美术', icon: 'art', group: 'line', line: 'art', mode: 'table' },
  { id: 'line-video', label: '视频', icon: 'video', group: 'line', line: 'video', mode: 'table' },
  { id: 'line-script', label: '剧本', icon: 'script', group: 'line', line: 'script', mode: 'table' },
];

export const SYSTEM_VIEW_GROUP = 'system';
export const LINE_VIEW_GROUP = 'line';

/** 看板泳道（对齐 KK 泳道：待办/进行中/审核中/已完成/阻塞） */
export const TASK_KANBAN_LANES: TaskKanbanLane[] = [
  { key: 'todo', label: '待办', color: 'var(--color-status-info)' },
  { key: 'in_progress', label: '进行中', color: 'var(--color-feedback-warning)' },
  { key: 'review', label: '审核中', color: 'var(--color-action-primary)' },
  { key: 'done', label: '已完成', color: 'var(--color-feedback-success)' },
  { key: 'blocked', label: '已阻塞', color: 'var(--color-feedback-error)' },
];

/** 任务状态元数据（对齐 KK task-meta，复用 dashboard 语义） */
export { TASK_STATUS_META, TASK_PRIORITY_META, TASK_LINE_META };

/** 状态选项（表格筛选 / 抽屉下拉） */
export const TASK_STATUS_OPTIONS = Object.entries(TASK_STATUS_META).map(([key, meta]) => ({
  value: key,
  label: meta.label,
}));

export const TASK_PRIORITY_OPTIONS = Object.entries(TASK_PRIORITY_META).map(([key, meta]) => ({
  value: key,
  label: meta.label,
}));

export const TASK_LINE_OPTIONS = Object.entries(TASK_LINE_META).map(([key, meta]) => ({
  value: key,
  label: meta.label,
}));
