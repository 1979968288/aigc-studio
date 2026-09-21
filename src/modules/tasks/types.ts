import type { DemoTaskLine, DemoTaskStatus } from '@/shared/mock/db';

/** 列表视图模式 */
export type TaskListMode = 'table' | 'kanban';

/** 左侧栏视图定义（对齐 KK ViewSidebar 分组导航） */
export interface TaskViewDef {
  id: string;
  label: string;
  icon: 'all' | 'board' | 'art' | 'video' | 'script';
  group: 'system' | 'line';
  /** 生产线过滤（undefined=全部） */
  line?: DemoTaskLine;
  /** 全局今日看板固定看板模式 */
  mode: TaskListMode;
}

/** 看板泳道（按状态分组） */
export interface TaskKanbanLane {
  key: DemoTaskStatus;
  label: string;
  color: string;
}
