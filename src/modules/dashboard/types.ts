/** 卡片类型标识（100% 对齐 KK 七卡） */
export type DashboardCardType =
  | 'watch'
  | 'project'
  | 'task'
  | 'global-production-board'
  | 'review'
  | 'shortcut'
  | 'menu';

/** 卡片元数据（声明在 constants，驱动网格与可见性） */
export interface DashCardMeta {
  id: string;
  title: string;
  type: DashboardCardType;
  /** 查看详情跳转路由 */
  route?: string;
  defaultW: number;
  defaultH: number;
  minW: number;
  minH: number;
}

/** 网格布局项（对齐 vue-grid-layout 数据结构） */
export interface LayoutCard {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 附加元数据后的可见卡片 */
export interface VisibleLayoutCard extends LayoutCard {
  meta: DashCardMeta;
}

export interface DashboardProjectSummary {
  id: string;
  name: string;
  type_name: string;
  status: number;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  progress: number;
  favorited: boolean;
  owner: string;
  planned_delivery: string;
  create_time: string;
}

export type DashboardTaskLineKey = 'script' | 'art' | 'video';
export type DashboardTaskStatusTabKey = 'todo' | 'in_progress' | 'done';

export interface DashboardTaskStatusTab {
  key: DashboardTaskStatusTabKey;
  label: string;
  accent: 'blue' | 'amber' | 'green';
}

export interface DashboardTaskItem {
  id: string;
  name: string;
  line: DashboardTaskLineKey;
  lineLabel: string;
  lineColor: string;
  lineBg: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  priorityLabel: string;
  priorityColor: string;
  dueDate?: string;
  projectName: string;
}

/** 全局今日看板（100% 对齐 KK global-production-board 模型） */
export type DashboardGlobalProductionLaneKey =
  | 'overdue'
  | 'todo'
  | 'today_work'
  | 'in_review'
  | 'today_cleared';

export interface DashboardGlobalProductionTask {
  id: string;
  name: string;
  projectName: string;
  stageText: string;
  plannedEndText: string;
  priorityLabel: string;
  priorityColor: string;
  accentColor: string;
}

export interface DashboardGlobalProductionLane {
  key: DashboardGlobalProductionLaneKey;
  title: string;
  emptyHint: string;
  accentColor: string;
  minCardWidth: number;
  variant?: 'solid' | 'dashed';
  items: DashboardGlobalProductionTask[];
}

export interface DashboardApprovalItem {
  id: string;
  type: 'asset_lock' | 'candidate_final' | 'project_create';
  typeLabel: string;
  title: string;
  submitter: string;
  submittedAt: string;
  dueAt: string;
  priority: 'urgent' | 'normal';
  priorityLabel: string;
  icon: 'task' | 'asset' | 'approval';
}

export interface DashboardApprovalSummary {
  key: 'asset_lock' | 'candidate_final' | 'project_create';
  label: string;
  count: number;
  icon: 'task' | 'asset' | 'approval';
  accent: 'blue' | 'green' | 'purple';
}

export interface DashboardShortcutItem {
  id: string;
  label: string;
  route: string;
}

export interface DashboardMenuItem {
  id: string;
  label: string;
  route: string;
  icon: 'project' | 'task' | 'inbox' | 'asset' | 'approval' | 'review' | 'staff';
  accent: 'blue' | 'amber' | 'purple' | 'green';
}
