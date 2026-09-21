import type { Component } from 'vue';
import type { DemoProjectOutput, DemoReferenceItem } from '@/shared/mock/db';
import type { ProjectSummary } from '../types';

export type { ProjectSummary };

/** 项目详情聚合数据 */
export interface ProjectDetail {
  project: ProjectSummary;
  outputs: DemoProjectOutput[];
  stats: ProjectDetailStats;
}

/** 英雄区/制作信息共用的生产统计 */
export interface ProjectDetailStats {
  shotsTotal: number;
  shotsDone: number;
  todoTasks: number;
  memberCount: number;
}

/** 制作信息字段类型（对齐 KK ProjectProductionFieldDef） */
export type ProductionFieldType =
  | 'text'
  | 'number'
  | 'textarea'
  | 'date'
  | 'select'
  | 'boolean'
  | 'user'
  | 'staff';

/** 制作信息字段定义（对齐 KK ProjectProductionFieldDef 结构） */
export interface ProductionFieldDef {
  key: string;
  label: string;
  type: ProductionFieldType;
  options?: Array<{ label: string; value: string }>;
  immutable?: boolean;
  fullWidth?: boolean;
  hint?: string;
}

export interface ProductionFieldGroupDef {
  id: string;
  title: string;
  fields: ProductionFieldDef[];
}

export interface ProductionSectionDef {
  id: 'basic' | 'core' | 'pipeline' | 'members';
  title: string;
  icon: Component;
  groups: ProductionFieldGroupDef[];
}

/** 置顶到英雄区的字段条目（对齐 KK ProjectProductionPinnedItem） */
export interface ProductionPinnedItem {
  key: string;
  label: string;
  value: string;
}

/** 参考库作用域 */
export type ReferenceScope = DemoReferenceItem['scope'];
export type ReferenceKind = DemoReferenceItem['kind'];

/** 参考库分组 */
export interface ReferenceGroup {
  key: string;
  label: string;
  items: DemoReferenceItem[];
}

export type ProjectDetailMenuKey = 'overview' | 'production-info' | 'reference-library' | 'settings';
