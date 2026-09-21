import type { PCAsset, AssetTypeName, AssetStatus } from '@/modules/production/types';

export type { PCAsset, AssetTypeName, AssetStatus };

/**
 * 资产清单（AssetList）类型定义
 *
 * 复用制作工坊（production）模块的 PCAsset 数据模型，保证两条入口
 * （制作工坊资产层 / 资产清单）读写同一份资产数据、状态一致。
 * 清单页在其上派生版本历史等展示字段，不改动底层种子数据结构。
 */

/** 列表 / 卡片 / 泳道 三视图 */
export type AssetViewMode = 'table' | 'card' | 'kanban';

/** 资产版本历史记录（详情抽屉嵌套展示） */
export interface AssetVersionRecord {
  id: string;
  version: string;
  status: AssetStatus;
  updatedAt: string;
  note: string;
}

/** 资产清单展示行：PCAsset + 派生字段 */
export interface AssetListItem extends PCAsset {
  /** 版本历史（派生，便于详情层下钻） */
  versions: AssetVersionRecord[];
}

/** 顶层统计卡片 */
export interface AssetStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
}

/** 新建 / 编辑资产表单模型 */
export interface AssetFormModel {
  name: string;
  assetType: AssetTypeName;
  version: string;
  status: AssetStatus;
  artist: string;
  size: string;
  format: string;
  usedInScenes: string[];
  qualityCheck: string;
}