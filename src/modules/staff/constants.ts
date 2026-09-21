import { DEPARTMENTS, ROLE_DEFINITIONS, type RoleCode } from '@/constants/roles';
import type { DeptTreeNode } from './types';

/** 部门树（扁平部门 + 全部人员虚拟根） */
export const STAFF_DEPT_TREE: DeptTreeNode[] = [
  { key: 'all', name: '全部人员' },
  ...DEPARTMENTS.map((dept) => ({ key: dept, name: dept, deptName: dept })),
];

/** 角色选项（人员归属角色 = 登录视角角色） */
export const STAFF_ROLE_OPTIONS: { label: string; value: RoleCode }[] = ROLE_DEFINITIONS.map(
  (role) => ({ label: role.label, value: role.code })
);

/** 在职状态元数据 */
export const STAFF_EMPLOYMENT_META: Record<
  'active' | 'inactive',
  { label: string; color: string; bgColor: string }
> = {
  active: {
    label: '在职',
    color: 'var(--color-feedback-success)',
    bgColor: 'var(--color-feedback-success-subtle)',
  },
  inactive: {
    label: '离职',
    color: 'var(--color-text-tertiary)',
    bgColor: 'var(--color-bg-disabled)',
  },
};

/** 人员头像色板（新增人员自动分配） */
export const STAFF_COLOR_PALETTE = [
  '#0055ff',
  '#6679ff',
  '#4aa9f5',
  '#ef9c3f',
  '#39bc72',
  '#f26b7f',
  '#8f6df5',
  '#14b8c4',
];
