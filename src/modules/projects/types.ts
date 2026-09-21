import type {
  DemoProject,
  DemoPipelineTemplate,
  DemoProjectMember,
  DemoProjectSegmentMember,
} from '@/shared/mock/db';

/**
 * 项目域类型（对齐 KK Project 类型的演示版）
 * 字段结构与 mock db 的 DemoProject 对齐，附加渲染用元数据。
 */

export type ProjectStatus = DemoProject['status'];

export type PipelineTemplateKey = DemoProject['pipeline_template'];

export interface ProjectSummary {
  id: string;
  name: string;
  type_name: string;
  status: ProjectStatus;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  progress: number;
  favorited: boolean;
  owner: string;
  planned_delivery: string;
  create_time: string;
  description: string;
  pipeline_template: PipelineTemplateKey;
  pipelineLabel: string;
  /** 工序链步骤（来自管线模板） */
  pipelineSteps: string[];
  /** 团队成员（含负责人；项目内角色独立于岗位） */
  members: DemoProjectMember[];
  /** 环节成员（挂在管线工序上：谁在哪道工序负责 / 参与） */
  segmentMembers: DemoProjectSegmentMember[];
  /** 项目代号 */
  project_alias: string;
  /** 项目昵称 */
  nicknames: string;
  /** 项目级别 S/A/B/C */
  project_level: DemoProject['project_level'];
  /** 产品名称 */
  product_name: string;
  /** 项目导演 */
  director: string;
  /** 项目制片 */
  producer: string;
  /** 创建人 */
  create_by: string;
  /** 立项日期 */
  approval_date: string;
  /** 实际交付日期 */
  actual_delivery: string;
  /** 健康度 0-100（系统计算） */
  health_score: number | null;
  /** 风险标识 0低/1中/2高 */
  risk_level: DemoProject['risk_level'];
  /** 参考作品/竞品 */
  references: string;
  /** 总集数 */
  total_episodes: number | null;
  /** 每集时长（分钟） */
  episode_duration: number | null;
  /** 片长（分钟） */
  duration_minutes: number | null;
  /** 项目档期 */
  schedule: string;
  /** 语言 */
  languages: string;
  /** 分辨率要求 */
  resolution: string;
  /** 帧率 */
  frame_rate: string;
  /** 总预算（万元） */
  budget: number | null;
  /** 是否含口型对白 */
  has_lip_sync: 0 | 1;
  /** 是否有数字资产 */
  has_digital_assets: 0 | 1;
  /** 使用的生成模型 */
  gen_model: string;
}

export interface PipelineTemplate extends DemoPipelineTemplate {}

export interface ProjectCreateInput {
  name: string;
  type_name: string;
  description: string;
  pipeline_template: PipelineTemplateKey;
  /** 团队成员（含负责人；项目内角色独立于岗位） */
  members: DemoProjectMember[];
  /** 环节成员（挂在管线工序上） */
  segmentMembers: DemoProjectSegmentMember[];
  owner: string;
  planned_delivery: string;
  project_alias: string;
  project_level: DemoProject['project_level'] | '';
  product_name: string;
  director: string;
  producer: string;
  approval_date: string;
  actual_delivery: string;
  references: string;
  duration_minutes: number | null;
  languages: string;
  resolution: string;
  frame_rate: string;
  budget: number | null;
  has_lip_sync: 0 | 1;
  has_digital_assets: 0 | 1;
  gen_model: string;
  business_type: 0 | 1;
  test_label: DemoProject['test_label'];
  application_date: string;
  initiator: string;
  initiator_position: string;
  department: string;
  production_start: string;
  production_end: string;
  has_ai_voice: 0 | 1;
  has_digital_human: 0 | 1;
  has_style_lora: 0 | 1;
}

/** 项目类型选项（创建向导） */
export const PROJECT_TYPE_OPTIONS = ['短片', 'TVC', '漫剧', '演示视频', '宣传片'] as const;
