import type { DemoUser } from '@/constants/roles';

/**
 * 人员管理模块类型定义
 * 以 DemoUser（constants/roles）为核心，追加组织维度。
 */

/** 人员列表项（可直接使用 DemoUser） */
export type StaffItem = DemoUser;

/** 部门树节点（对齐 KK DeptTreeNode：自引用递归，本 Demo 为扁平部门） */
export interface DeptTreeNode {
  key: string;
  name: string;
  /** 0 表示"全部人员"虚拟根，其余为部门名 */
  deptName?: string;
  children?: DeptTreeNode[];
}

/** 人员查询参数 */
export interface StaffQuery {
  keyword?: string;
  department?: string;
  employmentStatus?: 'active' | 'inactive' | 'all';
  role?: string;
}

/** 人员创建输入 */
export interface StaffCreateInput {
  name: string;
  role: DemoUser['role'];
  department: string;
  employmentStatus: 'active' | 'inactive';
  color?: string;
  description?: string;
}

/** 人员更新输入 */
export type StaffUpdateInput = Partial<StaffCreateInput>;

/** 可操作人员类型（供卡片/弹窗复用） */
export interface StaffEditorModel {
  name: string;
  role: DemoUser['role'];
  roleLabel: string;
  department: string;
  employmentStatus: 'active' | 'inactive';
  description: string;
  color: string;
}
