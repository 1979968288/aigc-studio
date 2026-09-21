import type { DemoApprovalCategory } from '@/shared/mock/db';

/** 审批分类（对齐 KK：task 任务审核 / management 管理审批，人员审批 AIGC 侧砍掉） */
export type ApprovalCategory = 'task' | 'management';

/** 状态筛选 Tab */
export type ApprovalStatusFilter = 'all' | 'pending' | 'processed';

/** 视图模式 */
export type ApprovalView = 'table' | 'kanban';

/** 分类定义（含审批人分工：任务审核→导演，管理审批→制片） */
export interface ApprovalCategoryDef {
  key: ApprovalCategory;
  label: string;
  types: DemoApprovalCategory[];
  operatorId: string;
  operatorLabel: string;
}
