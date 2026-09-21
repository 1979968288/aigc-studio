import { readDB, writeDB, type DemoApproval, type DemoApprovalStatus, type DemoProjectDemand } from '@/shared/mock/db';
import { APPROVAL_CATEGORY_MAP } from './constants';
import type { ApprovalCategory, ApprovalStatusFilter } from './types';

/**
 * 审批中心 API 契约层（Mock 实现）
 * 数据源 = db.approvals；审批动作写回业务对象（资产状态/任务状态/需求池立项标记）。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function categoryOf(type: DemoApproval['type']): ApprovalCategory {
  return type === 'project_create' ? 'management' : 'task';
}

/** 审批人（分工：任务审核→导演，管理审批→制片） */
function operatorOf(type: DemoApproval['type']): string {
  return type === 'project_create' ? 'u-producer' : 'u-director';
}

function nowText(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 审批列表（可按分类/状态过滤） */
export async function fetchApprovals(category?: ApprovalCategory): Promise<DemoApproval[]> {
  await delay(120);
  const list = readDB().approvals.filter((item) => (category ? categoryOf(item.type) === category : true));
  return [...list].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/** 分类待办计数（侧栏角标 + 待处理 Tab） */
export async function fetchApprovalSummary(): Promise<Record<ApprovalCategory, number>> {
  await delay(100);
  const db = readDB();
  return {
    task: db.approvals.filter((item) => categoryOf(item.type) === 'task' && item.status === 'pending').length,
    management: db.approvals.filter((item) => categoryOf(item.type) === 'management' && item.status === 'pending').length,
  };
}

/** 状态判定（逾期且待审） */
export function isOverdue(item: DemoApproval): boolean {
  if (item.status !== 'pending') return false;
  const today = new Date().toISOString().slice(0, 10);
  return item.dueAt < today;
}

/** 写回业务对象（通过→资产发布/任务完成/需求立项；驳回→任务返工） */
function applyDecision(db: ReturnType<typeof readDB>, item: DemoApproval, action: 'approve' | 'reject', comment?: string): void {
  if (action === 'approve') {
    if (item.type === 'asset_lock') {
      const asset = db.production[item.projectId]?.assets.find((a) => a.id === item.targetId);
      if (asset) asset.status = '已发布';
    } else if (item.type === 'candidate_final') {
      const task = db.tasks.find((t) => t.id === item.targetId);
      if (task) {
        task.status = 'done';
        task.lane = 'today_cleared';
      }
    } else if (item.type === 'project_create') {
      const demand = db.projectDemands.find((d) => d.id === item.targetId);
      if (demand) demand.approved = true;
    }
  } else {
    // 驳回：资产锁定→资产保持审核中；候选定稿→任务返工
    if (item.type === 'candidate_final') {
      const task = db.tasks.find((t) => t.id === item.targetId);
      if (task) {
        task.status = 'todo';
        task.lane = 'todo';
        task.reworkReason = comment || '候选定稿被驳回，需返工后重新送审。';
      }
    }
  }
  item.status = action === 'approve' ? 'approved' : 'rejected';
  item.operatorId = operatorOf(item.type);
  item.comment = comment;
  item.decidedAt = nowText();
}

/** 通过（意见选填） */
export async function approveApproval(id: string, comment?: string): Promise<void> {
  await delay(140);
  const db = readDB();
  const item = db.approvals.find((a) => a.id === id);
  if (!item || item.status !== 'pending') return;
  applyDecision(db, item, 'approve', comment);
  writeDB(db);
}

/** 驳回（意见必填） */
export async function rejectApproval(id: string, comment: string): Promise<void> {
  await delay(140);
  const db = readDB();
  const item = db.approvals.find((a) => a.id === id);
  if (!item || item.status !== 'pending') return;
  applyDecision(db, item, 'reject', comment);
  writeDB(db);
}

/** 批量通过/驳回 */
export async function batchDecideApprovals(ids: string[], action: 'approve' | 'reject', comment?: string): Promise<void> {
  await delay(160);
  const db = readDB();
  for (const id of ids) {
    const item = db.approvals.find((a) => a.id === id);
    if (item && item.status === 'pending') applyDecision(db, item, action, comment);
  }
  writeDB(db);
}

/** 审批目标描述（详情/表格展示关联对象） */
export function describeTarget(item: DemoApproval): { label: string; extra: string } {
  const db = readDB();
  if (item.type === 'asset_lock') {
    const asset = db.production[item.projectId]?.assets.find((a) => a.id === item.targetId);
    return {
      label: asset?.name ?? item.targetId,
      extra: asset ? `${asset.assetType} · ${asset.status}` : '',
    };
  }
  if (item.type === 'candidate_final') {
    const task = db.tasks.find((t) => t.id === item.targetId);
    return {
      label: task?.name ?? item.targetId,
      extra: task ? `${task.stageText} · ${task.assignee}` : '',
    };
  }
  const demand = db.projectDemands.find((d) => d.id === item.targetId);
  return {
    label: demand?.title ?? item.targetId,
    extra: demand ? `${demand.project_type} · 客户：${demand.client_name}` : '',
  };
}

/** 需求池立项状态（供详情展示） */
export function demandOf(item: DemoApproval): DemoProjectDemand | null {
  return item.type === 'project_create'
    ? readDB().projectDemands.find((d) => d.id === item.targetId) ?? null
    : null;
}

export type { ApprovalStatusFilter };
