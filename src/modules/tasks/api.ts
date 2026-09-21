import { readDB, writeDB, type DemoTask, type DemoTaskLane, type DemoTaskLine, type DemoTaskStatus } from '@/shared/mock/db';

/**
 * 任务管理 API 契约层（Mock 实现）
 * 数据源 = db.tasks（全局跨项目任务，唯一任务数据源），未来接真实后端只替换本层。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 状态 → 看板泳道（对齐 KK boardLaneKey，供全局今日看板消费） */
function laneOf(status: DemoTaskStatus): DemoTaskLane {
  switch (status) {
    case 'in_progress':
      return 'today_work';
    case 'review':
      return 'in_review';
    case 'done':
      return 'today_cleared';
    case 'blocked':
      return 'todo';
    default:
      return 'todo';
  }
}

export interface TaskCreateInput {
  name: string;
  line: DemoTaskLine;
  status: DemoTaskStatus;
  priority: DemoTask['priority'];
  dueDate: string;
  projectId: string;
  stageText: string;
  assignee: string;
  description?: string;
  prompt?: string;
  genModel?: string;
  refImages?: string[];
}

export type TaskUpdatePatch = Partial<
  Pick<
    DemoTask,
    | 'name'
    | 'line'
    | 'priority'
    | 'dueDate'
    | 'projectId'
    | 'stageText'
    | 'assignee'
    | 'description'
    | 'prompt'
    | 'genModel'
    | 'refImages'
  >
>;

/** 任务列表（全局跨项目，新建在前） */
export async function fetchTaskList(): Promise<DemoTask[]> {
  await delay(120);
  return [...readDB().tasks].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

/** 创建任务 */
export async function createTask(input: TaskCreateInput): Promise<DemoTask> {
  await delay(140);
  const db = readDB();
  const task: DemoTask = {
    id: `t-${Date.now()}`,
    name: input.name,
    line: input.line,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
    projectId: input.projectId,
    stageText: input.stageText,
    lane: laneOf(input.status),
    assignee: input.assignee,
    description: input.description,
    prompt: input.prompt,
    genModel: input.genModel,
    refImages: input.refImages,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  db.tasks.push(task);
  writeDB(db);
  return task;
}

/** 更新任务字段（状态变更同步泳道） */
export async function updateTask(id: string, patch: TaskUpdatePatch): Promise<void> {
  await delay(120);
  const db = readDB();
  const task = db.tasks.find((item) => item.id === id);
  if (!task) return;
  Object.assign(task, patch);
  writeDB(db);
}

/** 状态流转（对齐 KK workflowAction，同步看板泳道） */
export async function updateTaskStatus(id: string, status: DemoTaskStatus): Promise<void> {
  await delay(120);
  const db = readDB();
  const task = db.tasks.find((item) => item.id === id);
  if (!task) return;
  task.status = status;
  task.lane = laneOf(status);
  writeDB(db);
}

/** 发起返工（对齐 KK redoTask：状态回到待办 + 记录返工原因） */
export async function reworkTask(id: string, reason: string): Promise<void> {
  await delay(140);
  const db = readDB();
  const task = db.tasks.find((item) => item.id === id);
  if (!task) return;
  task.status = 'todo';
  task.lane = 'todo';
  task.reworkReason = reason;
  writeDB(db);
}

/** 删除任务 */
export async function deleteTask(id: string): Promise<void> {
  await delay(120);
  const db = readDB();
  db.tasks = db.tasks.filter((item) => item.id !== id);
  writeDB(db);
}
