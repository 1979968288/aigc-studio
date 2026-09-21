import {
  readDB,
  writeDB,
  filterTasksByRole,
  addShortcut as dbAddShortcut,
  type DemoTaskLane,
} from '@/shared/mock/db';
import type { RoleCode } from '@/constants/roles';
import {
  PROJECT_STATUS_META,
  TASK_STATUS_META,
  TASK_PRIORITY_META,
  TASK_LINE_META,
  APPROVAL_TYPE_META,
  GLOBAL_PRODUCTION_BOARD_CARD_MIN_WIDTH,
} from './constants';
import type {
  DashboardProjectSummary,
  DashboardTaskItem,
  DashboardApprovalItem,
  DashboardApprovalSummary,
  DashboardShortcutItem,
  DashboardGlobalProductionLane,
  DashboardGlobalProductionTask,
  DashboardGlobalProductionLaneKey,
} from './types';

/**
 * Dashboard API 契约层（Mock 实现）
 * 未来接真实后端时保持函数签名不变。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWatchProjects(): Promise<DashboardProjectSummary[]> {
  await delay(180);
  return readDB()
    .projects.filter((project) => project.favorited)
    .map(toProjectSummary);
}

export async function fetchProjects(): Promise<DashboardProjectSummary[]> {
  await delay(200);
  return readDB().projects.map(toProjectSummary);
}

export async function fetchMyTasks(role: RoleCode): Promise<DashboardTaskItem[]> {
  await delay(160);
  const db = readDB();
  const projectNameById = new Map(db.projects.map((project) => [project.id, project.name]));
  return filterTasksByRole(db.tasks, role).map((task) => {
    const lineMeta = TASK_LINE_META[task.line] ?? {
      label: task.line,
      color: 'var(--color-text-secondary)',
      bg: 'var(--color-bg-disabled)',
    };
    return {
      id: task.id,
      name: task.name,
      line: task.line,
      lineLabel: lineMeta.label,
      lineColor: lineMeta.color,
      lineBg: lineMeta.bg,
      status: task.status,
      statusLabel: TASK_STATUS_META[task.status]?.label ?? task.status,
      statusColor: TASK_STATUS_META[task.status]?.color ?? 'var(--color-text-secondary)',
      priorityLabel: TASK_PRIORITY_META[task.priority]?.label ?? task.priority,
      priorityColor: TASK_PRIORITY_META[task.priority]?.color ?? 'var(--color-text-secondary)',
      dueDate: task.dueDate,
      projectName: projectNameById.get(task.projectId) ?? '—',
    };
  });
}

/** 全局今日看板（100% 对齐 KK 泳道：逾期/待处理/今日制作/审批中/今日已清） */
export async function fetchGlobalProductionBoard(): Promise<DashboardGlobalProductionLane[]> {
  await delay(220);
  const db = readDB();
  const projectNameById = new Map(db.projects.map((project) => [project.id, project.name]));

  const lanes = createEmptyLanes();
  const laneMap = new Map(lanes.map((lane) => [lane.key, lane]));

  for (const task of db.tasks) {
    const laneKey = normalizeLaneKey(task.lane);
    const lane = laneMap.get(laneKey);
    if (!lane) continue;
    lane.items.push({
      id: task.id,
      name: task.name,
      projectName: projectNameById.get(task.projectId)?.trim() || '未知项目',
      stageText: task.stageText || '未设置环节',
      plannedEndText: task.dueDate ? task.dueDate.slice(0, 10) : '未设置',
      priorityLabel: TASK_PRIORITY_META[task.priority]?.label ?? task.priority,
      priorityColor: TASK_PRIORITY_META[task.priority]?.color ?? 'var(--color-text-tertiary)',
      accentColor: 'var(--color-action-primary)',
    });
  }
  return lanes;
}

const LANE_SPECS: Array<{
  key: DashboardGlobalProductionLaneKey;
  title: string;
  emptyHint: string;
  accentColor: string;
  variant?: 'solid' | 'dashed';
}> = [
  {
    key: 'overdue',
    title: '逾期',
    emptyHint: '暂无逾期任务',
    accentColor: 'var(--color-feedback-error)',
  },
  {
    key: 'todo',
    title: '待处理',
    emptyHint: '暂无待处理任务',
    accentColor: 'var(--color-action-primary)',
  },
  {
    key: 'today_work',
    title: '今日制作',
    emptyHint: '暂无任务',
    accentColor: 'var(--color-status-info)',
  },
  {
    key: 'in_review',
    title: '审批中',
    emptyHint: '暂无待审批任务',
    accentColor: 'var(--color-status-info)',
  },
  {
    key: 'today_cleared',
    title: '今日已清',
    emptyHint: '拖拽任务至此完成',
    accentColor: 'var(--color-feedback-success)',
    variant: 'dashed',
  },
];

function createEmptyLanes(): DashboardGlobalProductionLane[] {
  return LANE_SPECS.map((spec) => ({
    ...spec,
    minCardWidth: GLOBAL_PRODUCTION_BOARD_CARD_MIN_WIDTH,
    items: [] as DashboardGlobalProductionTask[],
  }));
}

function normalizeLaneKey(value: DemoTaskLane): DashboardGlobalProductionLaneKey {
  const known: DemoTaskLane[] = ['overdue', 'todo', 'today_work', 'in_review', 'today_cleared'];
  return known.includes(value) ? value : 'todo';
}

export async function fetchApprovals(): Promise<DashboardApprovalItem[]> {
  await delay(150);
  return readDB().approvals.map((approval) => {
    const meta = APPROVAL_TYPE_META[approval.type];
    return {
      ...approval,
      typeLabel: meta?.label ?? approval.type,
      priorityLabel: approval.priority === 'urgent' ? '加急' : '常规',
      icon: meta?.icon ?? 'task',
    };
  });
}

export async function fetchApprovalSummaries(): Promise<DashboardApprovalSummary[]> {
  await delay(150);
  const db = readDB();
  return (['asset_lock', 'candidate_final'] as const).map((key) => {
    const meta = APPROVAL_TYPE_META[key];
    return {
      key,
      label: meta?.label ?? key,
      count: db.approvals.filter((approval) => approval.type === key).length,
      icon: meta?.icon ?? 'task',
      accent: meta?.accent ?? 'blue',
    };
  });
}

export async function fetchShortcuts(): Promise<DashboardShortcutItem[]> {
  await delay(120);
  return readDB().shortcuts;
}

/** 收藏标签页为首页捷径（供标签条右键"收藏到首页"调用） */
export async function addShortcut(
  label: string,
  route: string
): Promise<DashboardShortcutItem[]> {
  await delay(100);
  return dbAddShortcut(label, route);
}

export async function removeShortcut(id: string): Promise<DashboardShortcutItem[]> {
  await delay(100);
  const db = readDB();
  db.shortcuts = db.shortcuts.filter((shortcut) => shortcut.id !== id);
  writeDB(db);
  return db.shortcuts;
}

function toProjectSummary(
  project: ReturnType<typeof readDB>['projects'][number]
): DashboardProjectSummary {
  const statusMeta = PROJECT_STATUS_META[String(project.status)] ?? {
    label: '未知',
    color: 'var(--color-text-secondary)',
    bgColor: 'var(--color-bg-disabled)',
  };
  return {
    id: project.id,
    name: project.name,
    type_name: project.type_name,
    status: project.status,
    statusLabel: statusMeta.label,
    statusColor: statusMeta.color,
    statusBg: statusMeta.bgColor,
    progress: project.progress,
    favorited: project.favorited,
    owner: project.owner,
    planned_delivery: project.planned_delivery,
    create_time: project.create_time,
  };
}
