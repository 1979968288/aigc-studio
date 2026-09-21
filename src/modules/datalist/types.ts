import type { PCAsset, PCScene, PCTask } from '@/modules/production/types';

/** 数据清单 Tab 维度（对齐 KK 数据清单：按生产对象分页签，不设独立缺口 Tab） */
export type DataListTab = 'all' | 'script' | 'scene' | 'task' | 'asset';

/** 全部 Tab 的混合行：四类生产对象统一呈现，不做分类分区 */
export type DataListAllCategory = '剧本' | '场次' | '任务' | '资产';

/** 全部 Tab 展示行（四类对象打平为统一列） */
export interface DataListAllRow {
  id: string;
  category: DataListAllCategory;
  /** 编号（剧本段无编号，为「—」） */
  code: string;
  /** 名称 / 摘要 */
  name: string;
  /** 状态文本（剧本段无状态，为「—」） */
  statusText: string;
  statusColor: string;
  progressStatus: ProgressStatus;
  issues: string[];
  checkStatus: CheckStatus;
}

/** 进度状态（四段式统计，对齐 KK progress_status） */
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

/** 核对状态（对齐 KK 数据修复状态：需要修复/已修复/无需修复） */
export type CheckStatus = 'need_fix' | 'fixed' | 'ok';

/** 剧本清单打平后的行（每个场景段落一行） */
export interface DataListScriptRow {
  id: string;
  scriptName: string;
  versionNo: number;
  actName: string;
  sceneTitle: string;
  preview: string;
}

/** 场次清单展示行 */
export interface DataListSceneRow extends PCScene {
  issues: string[];
  progressStatus: ProgressStatus;
  checkStatus: CheckStatus;
}

/** 任务清单展示行：补充所属场次信息 + 核对 */
export interface DataListTaskRow extends PCTask {
  sceneNo: string;
  sceneName: string;
  issues: string[];
  progressStatus: ProgressStatus;
  checkStatus: CheckStatus;
}

/** 资产清单展示行 */
export interface DataListAssetRow extends PCAsset {
  issues: string[];
  progressStatus: ProgressStatus;
  checkStatus: CheckStatus;
}

/** 单 Tab 四段式统计 */
export interface TabProgressStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
}