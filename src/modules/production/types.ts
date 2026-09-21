/**
 * 制作工坊（四泳道生产工作台）类型定义
 *
 * 对齐 KK ProductionCenter 的四泳道模型：
 *   剧本层（ScriptLayer）→ 场次层（Scene）→ 制作场次层（Task）→ 资产层（Asset）
 * AIGC 双生产线映射：
 *   剧本/分镜 → 镜头归组 → 生成工序 → 角色/场景/道具
 */

export type SceneStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type TaskStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AssetStatus = '草稿' | '制作中' | '审核中' | '修订中' | '已发布' | '已废弃';
export type RiskLevel = 'low' | 'medium' | 'high';

/** AIGC 资产类型（用户定稿：只保留三类，去掉 KK 的「元素资产」） */
export type AssetTypeName = '角色资产' | '场景资产' | '道具资产';

/** 剧本内的一小段场次文本 */
export interface PCScriptSceneText {
  id: string;
  title: string;
  paragraphs: string[];
}

/** 剧本幕（act） */
export interface PCScriptAct {
  id: string;
  name: string;
  scenes: PCScriptSceneText[];
}

/** 剧本记录 */
export interface PCScriptRecord {
  id: string;
  projectId: string;
  name: string;
  versionNo: number;
  createTime: string;
  acts: PCScriptAct[];
}

/** 场次（镜头归组） */
export interface PCScene {
  id: string;
  projectId: string;
  /** 场次号，如 SC-001 */
  sceneNo?: string;
  name: string;
  type: string;
  duration: string;
  status: SceneStatus;
  riskLevel: RiskLevel;
  characters: string[];
  location: string;
  schedule: string;
  /** 复杂度 0-100 */
  complexity: number;
  /** 关联任务数 */
  tasks: number;
  /** 资产就绪 / 总数 */
  assetsReady: number;
  assetsTotal: number;
  /** 负责人 userId（对应人员管理 db.users 的 id） */
  assigneeName?: string;
}

/** 生成任务（工序） */
export interface PCTask {
  id: string;
  projectId: string;
  sceneId: string;
  code?: string;
  /** 工序阶段：美术关键帧 / 图生视频 / 对口型 / 精修合成 */
  stage?: string;
  status: TaskStatus;
  /** 负责人 userId（对应人员管理 db.users 的 id） */
  responsible: string;
  department: string;
  startTime: string;
  endTime: string;
  location: string;
  progress: string;
  durationSec?: number;
  description?: string;
  dependencies: string[];
  /** 审片时间轴镜头段（成片内起止秒），审片室侧栏卡片与时间轴段共用此时间码对位 */
  clipStartSec?: number;
  clipEndSec?: number;
  /** 生成配方：提示词 */
  prompt?: string;
  /** 生成配方：所用模型 */
  genModel?: string;
  /** 生成配方：参考图（DataURL，Demo 无后端本地存储） */
  refImages?: string[];
}

/** 资产 */
export interface PCAsset {
  id: string;
  projectId: string;
  name: string;
  assetType: AssetTypeName;
  version: string;
  status: AssetStatus;
  /** 制作人 userId（对应人员管理 db.users 的 id） */
  artist: string;
  size: string;
  format: string;
  usedInScenes: string[];
  qualityCheck: string;
}

/** 制作工坊整份数据（按 projectId 隔离） */
export interface ProductionData {
  scripts: PCScriptRecord[];
  scenes: PCScene[];
  tasks: PCTask[];
  assets: PCAsset[];
}

/** 卡片点击 / 右键菜单目标类型 */
export type ProductionEntityType = 'script' | 'scene' | 'task' | 'asset';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: ProductionEntityType;
  item: PCScene | PCTask | PCAsset | PCScriptRecord | null;
}

export type SearchField = 'scene' | 'task' | 'asset';