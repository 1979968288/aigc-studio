import { readDB, writeDB } from '@/shared/mock/db';
import { DEMO_USERS, ROLE_DEFINITIONS, type DemoUser, type RoleCode } from '@/constants/roles';
import { STAFF_COLOR_PALETTE } from './constants';
import type { StaffCreateInput, StaffItem, StaffQuery, StaffUpdateInput } from './types';

/**
 * 人员管理 API 契约层（Mock 实现）
 * 数据源 = db.users（可变集合，种子拷贝自 DEMO_USERS）。
 * 登录/角色切换仍以 DEMO_USERS 常量数组为准（人员表增删不影响登录视角）。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function roleLabelOf(role: RoleCode): string {
  return ROLE_DEFINITIONS.find((item) => item.code === role)?.label ?? '成员';
}

/** 读取人员集合（实时从 db 读取，保证人员管理增删后各模块可见） */
export function readStaffList(): StaffItem[] {
  return readDB().users;
}

/** 按 id 查人员 */
export function findStaffById(id: string): StaffItem | null {
  return readDB().users.find((user) => user.id === id) ?? null;
}

/** 按 id 或姓名查人员（兼容老数据存中文名的场景） */
export function findStaffByRef(ref: string): StaffItem | null {
  const users = readDB().users;
  return users.find((user) => user.id === ref) ?? users.find((user) => user.name === ref) ?? null;
}

/** 解析人员显示名：优先 id → 姓名 → 原样 */
export function resolveStaffName(ref: string | undefined | null): string {
  if (!ref) return '未分配';
  return findStaffByRef(ref)?.name ?? ref;
}

/** 解析人员头像色：优先 id → 姓名 → 默认主题色 */
export function resolveStaffColor(ref: string | undefined | null): string {
  if (!ref) return '#0055ff';
  return findStaffByRef(ref)?.color ?? '#0055ff';
}

/** 生成新人员 id（与 DEMO_USERS id 风格一致） */
function nextStaffId(): string {
  const db = readDB();
  const max = db.users.reduce((acc, user) => {
    const match = /^u-(\d+)$/.exec(user.id);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 1000);
  return `u-${max + 1}`;
}

/** 查询人员（搜索 / 部门 / 状态筛选） */
export async function fetchStaff(query: StaffQuery = {}): Promise<StaffItem[]> {
  await delay(120);
  let list = readStaffList();
  if (query.department && query.department !== 'all') {
    list = list.filter((user) => user.department === query.department);
  }
  if (query.employmentStatus && query.employmentStatus !== 'all') {
    list = list.filter((user) => user.employmentStatus === query.employmentStatus);
  }
  if (query.role) {
    list = list.filter((user) => user.role === query.role);
  }
  if (query.keyword) {
    const kw = query.keyword.trim().toLowerCase();
    list = list.filter(
      (user) =>
        user.name.toLowerCase().includes(kw) ||
        user.roleLabel.toLowerCase().includes(kw) ||
        user.department.toLowerCase().includes(kw)
    );
  }
  return list;
}

/** 新建人员 */
export async function createStaff(input: StaffCreateInput): Promise<StaffItem> {
  await delay(150);
  const db = readDB();
  const id = nextStaffId();
  const paletteUsed = db.users.map((user) => user.color);
  const color =
    input.color ?? STAFF_COLOR_PALETTE.find((c) => !paletteUsed.includes(c)) ?? STAFF_COLOR_PALETTE[0];
  const staff: DemoUser = {
    id,
    name: input.name.trim(),
    role: input.role,
    roleLabel: roleLabelOf(input.role),
    description: input.description?.trim() ?? '',
    color,
    icon: DEMO_USERS.find((user) => user.role === input.role)?.icon ?? DEMO_USERS[0].icon,
    department: input.department,
    employmentStatus: input.employmentStatus,
  };
  db.users.push(staff);
  writeDB(db);
  return staff;
}

/** 更新人员 */
export async function updateStaff(id: string, patch: StaffUpdateInput): Promise<StaffItem | null> {
  await delay(150);
  const db = readDB();
  const index = db.users.findIndex((user) => user.id === id);
  if (index < 0) return null;
  const current = db.users[index];
  const next: DemoUser = {
    ...current,
    name: patch.name?.trim() ?? current.name,
    role: patch.role ?? current.role,
    roleLabel: patch.role ? roleLabelOf(patch.role) : current.roleLabel,
    description: patch.description ?? current.description,
    color: patch.color ?? current.color,
    department: patch.department ?? current.department,
    employmentStatus: patch.employmentStatus ?? current.employmentStatus,
  };
  db.users[index] = next;
  writeDB(db);
  return next;
}

/** 设置在职/离职状态 */
export async function setStaffEmploymentStatus(
  id: string,
  status: 'active' | 'inactive'
): Promise<StaffItem | null> {
  return updateStaff(id, { employmentStatus: status });
}

/** 删除人员 */
export async function deleteStaff(id: string): Promise<void> {
  await delay(120);
  const db = readDB();
  db.users = db.users.filter((user) => user.id !== id);
  writeDB(db);
}

/** 人员被业务数据引用的数量（删除保护提示用） */
export interface StaffRefCounts {
  tasks: number;
  assets: number;
  scenes: number;
  projects: number;
  approvals: number;
}

export function countStaffRefs(id: string): StaffRefCounts {
  const db = readDB();
  const counts: StaffRefCounts = { tasks: 0, assets: 0, scenes: 0, projects: 0, approvals: 0 };
  Object.values(db.production).forEach((data) => {
    counts.tasks += data.tasks.filter((task) => task.responsible === id).length;
    counts.assets += data.assets.filter((asset) => asset.artist === id).length;
    counts.scenes += data.scenes.filter((scene) => scene.assigneeName === id).length;
  });
  counts.projects = db.projects.filter(
    (project) =>
      project.members.some((member) => member.userId === id) ||
      project.owner === id ||
      project.director === id ||
      project.producer === id ||
      project.create_by === id
  ).length;
  counts.approvals = db.approvals.filter((approval) => approval.submitter === id).length;
  return counts;
}
