import { COMPANY_STAFF, type DemoUser } from '@/constants/roles';
import type { RoleCode } from '@/constants/roles';
import { buildSegmentBlueprints } from '@/shared/aigc/pipelineRoles';
import { seedProduction, type ProductionDB } from '@/modules/production/mock';

/**
 * Mock 数据库（localStorage 持久化）
 *
 * 设计约定（对齐 KMOKE 分层）：
 * - 页面与业务模块永远通过 modules/<domain>/api 调用数据，
 *   api 内部走本 Mock 层；未来接真实后端只替换 api 实现即可。
 * - 所有数据挂在统一命名空间 key 下，"一键重置演示数据"即重播种。
 * - 预置"进行中"剧本数据：让每个页面打开即有内容可演示。
 */

const DB_KEY = 'aigc_studio_db_v1';
const DB_VERSION = 18;

/** 项目成员（成员 = 用户 + 项目内角色 + 加入时间） */
export interface DemoProjectMember {
  /** 用户 id（对应 db.users） */
  userId: string;
  /** 项目内角色（岗位编码；同一人在不同项目可不同） */
  projectRole: RoleCode;
  /** 加入日期 */
  joinedAt: string;
}

/** 环节成员（挂在管线工序上：谁在哪道工序负责 / 参与） */
export interface DemoProjectSegmentMember {
  /** 环节 id（对应管线工序蓝图 seg-N） */
  segmentId: string;
  /** 环节名快照（工序名） */
  segmentName: string;
  /** 用户 id（对应 db.users） */
  userId: string;
  /** 环节内身份：owner 负责人 / participant 参与人 */
  type: 'owner' | 'participant';
  /** 组内排序 */
  sortOrder: number;
  /** 是否该环节默认负责人 */
  isPrincipal: boolean;
}

/** 项目状态：0 草稿 / 1 筹备中 / 2 制作中 / 3 已暂停 / 4 已归档 / 5 已取消 */
export interface DemoProject {
  id: string;
  name: string;
  type_name: string;
  status: number;
  progress: number;
  favorited: boolean;
  owner: string;
  planned_delivery: string;
  create_time: string;
  /** 项目描述（创建向导第一步） */
  description: string;
  /** 管线模板 key（创建向导第二步） */
  pipeline_template: 'standard' | 'lightweight' | 'lip_sync';
  /** 团队成员（含负责人；项目内角色独立于岗位） */
  members: DemoProjectMember[];
  /** 环节成员（挂在管线工序上） */
  segmentMembers: DemoProjectSegmentMember[];
  /** 项目代号 */
  project_alias: string;
  /** 项目昵称 */
  nicknames: string;
  /** 项目级别 S/A/B/C */
  project_level: 'S' | 'A' | 'B' | 'C';
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
  risk_level: 0 | 1 | 2;
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
  /** 业务类型 0 商业项目 / 1 内部项目 */
  business_type: 0 | 1;
  /** 测试标签 technical_test/business_test/none */
  test_label: 'technical_test' | 'business_test' | 'none';
  /** 申请日期 */
  application_date: string;
  /** 立项人（用户 id） */
  initiator: string;
  /** 立项人岗位（自动带出） */
  initiator_position: string;
  /** 立项人所在部门（自动带出） */
  department: string;
  /** 制作开始日期 */
  production_start: string;
  /** 制作结束日期 */
  production_end: string;
  /** AI 配音需求 */
  has_ai_voice: 0 | 1;
  /** 数字人需求 */
  has_digital_human: 0 | 1;
  /** 风格模型训练需求 */
  has_style_lora: 0 | 1;
}

/** 管线模板（AIGC 特色：决定镜头任务的工序链） */
export interface DemoPipelineTemplate {
  key: DemoProject['pipeline_template'];
  label: string;
  description: string;
  steps: string[];
}

/** 管线模板清单（种子与环节成员生成共用同一份事实源） */
const PIPELINE_TEMPLATES: DemoPipelineTemplate[] = [
  {
    key: 'standard',
    label: '标准管线',
    description: '美术出关键帧 → 视频图生视频 → 精修，适合精品内容',
    steps: ['美术关键帧', '图生视频', '精修合成'],
  },
  {
    key: 'lightweight',
    label: '轻量管线',
    description: '视频生成师自包关键帧与生成，适合紧急小单',
    steps: ['关键帧+生成', '精修合成'],
  },
  {
    key: 'lip_sync',
    label: '口型管线',
    description: '关键帧 → 图生视频 → 智能对口型，适合对白重的剧',
    steps: ['美术关键帧', '图生视频', '对口型', '精修合成'],
  },
];

/** 按角色要求从项目成员里挑人（保持成员表顺序） */
function pickMemberIdsByRoles(
  members: DemoProjectMember[],
  roles: readonly RoleCode[]
): string[] {
  return members
    .filter((member) => roles.includes(member.projectRole))
    .map((member) => member.userId);
}

/**
 * 由管线工序链生成环节成员种子：
 * 每个工序按「负责人角色 / 参与人角色」从项目成员里取人，负责人首位为默认负责人。
 */
function buildSegmentMembers(
  templateKey: DemoProject['pipeline_template'],
  members: DemoProjectMember[]
): DemoProjectSegmentMember[] {
  const steps = PIPELINE_TEMPLATES.find((template) => template.key === templateKey)?.steps ?? [];
  const result: DemoProjectSegmentMember[] = [];
  for (const blueprint of buildSegmentBlueprints(steps)) {
    const ownerIds = pickMemberIdsByRoles(members, blueprint.ownerRoles);
    const participantIds = pickMemberIdsByRoles(members, blueprint.participantRoles).filter(
      (userId) => !ownerIds.includes(userId)
    );
    ownerIds.forEach((userId, index) => {
      result.push({
        segmentId: blueprint.segmentId,
        segmentName: blueprint.segmentName,
        userId,
        type: 'owner',
        sortOrder: index,
        isPrincipal: index === 0,
      });
    });
    participantIds.forEach((userId, index) => {
      result.push({
        segmentId: blueprint.segmentId,
        segmentName: blueprint.segmentName,
        userId,
        type: 'participant',
        sortOrder: index,
        isPrincipal: false,
      });
    });
  }
  return result;
}

/** 演示项目成员种子（项目成员与环节成员共用同一份） */
const P1_MEMBERS: DemoProjectMember[] = [
  { userId: 'u-producer', projectRole: 'producer', joinedAt: '2026-07-12' },
  { userId: 'u-director', projectRole: 'director', joinedAt: '2026-07-12' },
  { userId: 'u-screenwriter', projectRole: 'screenwriter', joinedAt: '2026-07-13' },
  { userId: 'u-art', projectRole: 'art_generator', joinedAt: '2026-07-13' },
  { userId: 'u-video', projectRole: 'video_generator', joinedAt: '2026-07-14' },
  { userId: 'u-post', projectRole: 'post_production', joinedAt: '2026-07-20' },
];

const P2_MEMBERS: DemoProjectMember[] = [
  { userId: 'u-producer', projectRole: 'producer', joinedAt: '2026-07-28' },
  { userId: 'u-director', projectRole: 'director', joinedAt: '2026-07-28' },
  { userId: 'u-video', projectRole: 'video_generator', joinedAt: '2026-07-29' },
  { userId: 'u-post', projectRole: 'post_production', joinedAt: '2026-08-01' },
];

const P3_MEMBERS: DemoProjectMember[] = [
  { userId: 'u-director', projectRole: 'director', joinedAt: '2026-08-02' },
  { userId: 'u-screenwriter', projectRole: 'screenwriter', joinedAt: '2026-08-02' },
  { userId: 'u-art', projectRole: 'art_generator', joinedAt: '2026-08-03' },
  { userId: 'u-video', projectRole: 'video_generator', joinedAt: '2026-08-03' },
];

const P4_MEMBERS: DemoProjectMember[] = [
  { userId: 'u-post', projectRole: 'post_production', joinedAt: '2026-06-15' },
  { userId: 'u-video', projectRole: 'video_generator', joinedAt: '2026-06-16' },
];

/** 需求池条目（创建向导第一步选择，映射 KK 的 OA 项目池） */
export interface DemoProjectDemand {
  id: string;
  /** 需求单标题 */
  title: string;
  /** 项目类型（对应 AIGC 项目类型） */
  project_type: string;
  /** 客户名称 */
  client_name: string;
  /** 立项人（DEMO_USERS id） */
  initiator_id: string;
  /** 申请日期 */
  application_date: string;
  /** 期望交付日期 */
  planned_delivery: string;
  /** 需求备注（回填项目描述） */
  remark: string;
  /** 项目级别 */
  project_level: DemoProject['project_level'];
  /** 业务类型 0 商业 / 1 内部 */
  business_type: 0 | 1;
  /** 是否已立项（管理审批 project_create 通过后写回 true，防止重复立项） */
  approved?: boolean;
}

/** 项目核心输出（剪辑成片） */
export interface DemoProjectOutput {
  id: string;
  title: string;
  filename: string;
  duration?: string;
  status: 'approved' | 'reviewing' | 'pending' | 'rejected';
  pinCount: number;
  size: string;
  updatedAt: string;
  updatedAgo: string;
}

/** 参考库条目（文件或文件夹） */
export interface DemoReferenceItem {
  id: string;
  projectId: string;
  /** 归属作用域：资产 / 剧本 / 场次 / 镜头 */
  scope: 'asset' | 'script' | 'scene' | 'shot';
  /** 模块分类名（分组标题，如「角色设定」） */
  module: string;
  name: string;
  kind: 'image' | 'text' | 'media' | 'other';
  isFolder: boolean;
  /** 所属文件夹 id（文件进文件夹后 module 仍保留分组归属） */
  parentId: string | null;
  date: string;
}

/** 生产线：美术出图 / 视频生成 / 剧本 / 分镜 */
/** 生产线（剧本线含剧本写作/设定与分镜划分；美术=资产线；视频=镜头生成线） */
export type DemoTaskLine = 'art' | 'video' | 'script';
export type DemoTaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
/** 全局今日看板泳道 */
export type DemoTaskLane = 'overdue' | 'todo' | 'today_work' | 'in_review' | 'today_cleared';

export interface DemoTask {
  id: string;
  name: string;
  line: DemoTaskLine;
  status: DemoTaskStatus;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string;
  projectId: string;
  /** 所属环节（项目 / 生产线）显示文本 */
  stageText: string;
  /** 看板泳道归属 */
  lane: DemoTaskLane;
  /** 负责人 userId（对应 db.users） */
  assignee: string;
  /** 任务描述 */
  description?: string;
  /** 最近返工原因（详情抽屉「发起返工」写入） */
  reworkReason?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 生成配方：提示词 */
  prompt?: string;
  /** 生成配方：所用模型 */
  genModel?: string;
  /** 生成配方：参考图（DataURL，Demo 无后端本地存储） */
  refImages?: string[];
}

/** 审批类型：asset_lock/candidate_final 属任务审核（导演审批），project_create 属管理审批（制片审批） */
export type DemoApprovalCategory = 'asset_lock' | 'candidate_final' | 'project_create';
export type DemoApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface DemoApproval {
  id: string;
  type: DemoApprovalCategory;
  title: string;
  submitter: string;
  submittedAt: string;
  dueAt: string;
  priority: 'urgent' | 'normal';
  /** 待审 / 已通过 / 已驳回 */
  status: DemoApprovalStatus;
  projectId: string;
  /** 关联业务对象 id：asset_lock→production.assets，candidate_final→db.tasks，project_create→db.projectDemands */
  targetId: string;
  /** 审批人 userId（asset_lock/candidate_final=导演，project_create=制片） */
  operatorId?: string;
  /** 审批意见（驳回必填） */
  comment?: string;
  decidedAt?: string;
}

/** 首页捷径：来自"收藏标签页"动作（用户动态收藏，非硬编码入口） */
export interface DemoShortcut {
  id: string;
  label: string;
  route: string;
}

/* ---------------- 审片室 ---------------- */

/** 圈注图形类型（对齐 KK ReviewAnnotationType） */
export type DemoReviewAnnotationType = 'line' | 'rect' | 'arrow' | 'text';

/** 圈注图形（config 为 Konva 原生配置，存储时归一化为 0~1 相对坐标） */
export interface DemoReviewAnnotationShape {
  id: string;
  type: DemoReviewAnnotationType;
  config: Record<string, unknown>;
}

/** 圈注快照（记录绘制时的画面尺寸，保证任意窗口下还原） */
export interface DemoReviewAnnotationSnapshot {
  media_width: number;
  media_height: number;
  shapes: DemoReviewAnnotationShape[];
}

/** 审片评论（对齐 KK ReviewOpinion） */
export interface DemoReviewComment {
  id: string;
  /** 作者 userId（对应 db.users） */
  authorId: string;
  content: string;
  /** 提及的用户 id 列表 */
  mentionUserIds: string[];
  createdAt: string;
  /** 绑定的虚拟时间轴秒数 */
  timeSeconds: number;
  /** 圈注快照（无圈注为 null） */
  annotations: DemoReviewAnnotationSnapshot | null;
  /** 圈注帧截图（本地 dataURL，无后端上传） */
  screenshotDataUrl: string | null;
  /** 已处理时间（未处理为 null） */
  resolvedAt: string | null;
  replies: DemoReviewComment[];
  reactions: Record<string, number>;
}

/** 时间线剪辑段（对齐 KK ReviewTimelineClip，秒数为虚拟时间轴） */
export interface DemoReviewClip {
  id: string;
  label: string;
  startSec: number;
  endSec: number;
}

/** 审片时间线（一个审片项 = 一条时间线，对齐 KK ReviewCase） */
export interface DemoReviewTimeline {
  id: string;
  projectId: string;
  name: string;
  versionCode: string;
  status: 'pending' | 'in_review' | 'approved' | 'rework';
  videoUrl: string;
  thumbnailUrl: string | null;
  /** 视频真实时长（种子兜底，播放器加载 metadata 后以实际为准） */
  videoDurationSec: number;
  frameRate: number;
  clips: DemoReviewClip[];
  /** 该时间线的镜头段是否取自制作工坊任务（PCTask.clipStartSec/EndSec），否则用写死的 clips */
  useProductionShots?: boolean;
  comments: DemoReviewComment[];
  createdAt: string;
}

/** 镜头审片字段（颜色分类 / 评级 / 导演意见，key 为任务 id） */
export interface DemoReviewShotFields {
  colorCategory: 'red' | 'yellow' | 'green' | 'blue' | 'gray' | null;
  rating: 'S' | 'A' | 'B' | 'C' | 'N' | null;
  directorComments: string;
}

export interface DemoDB {
  version: number;
  seededAt: string;
  /** 人员集合（公司员工库种子拷贝自 COMPANY_STAFF，支持人员管理增删改） */
  users: DemoUser[];
  projects: DemoProject[];
  pipelineTemplates: DemoPipelineTemplate[];
  /** 待立项需求池（创建向导第一步） */
  projectDemands: DemoProjectDemand[];
  tasks: DemoTask[];
  approvals: DemoApproval[];
  shortcuts: DemoShortcut[];
  /** 参考库条目（含文件夹，按 projectId 隔离） */
  referenceLibrary: DemoReferenceItem[];
  /** 项目核心输出（成片），按项目 outputs 字段挂载亦可，此处独立便于扩展 */
  projectOutputs: Record<string, DemoProjectOutput[]>;
  /** 制作工坊（四泳道生产工作台）数据，按 projectId 隔离 */
  production: ProductionDB;
  /** 审片室时间线（含评论/圈注），按 projectId 归属 */
  reviewTimelines: DemoReviewTimeline[];
  /** 镜头审片字段（颜色/评级/导演意见），key 为任务 id */
  reviewShotFields: Record<string, DemoReviewShotFields>;
}

function seed(): DemoDB {
  return {
    version: DB_VERSION,
    seededAt: new Date().toISOString(),
    users: COMPANY_STAFF.map((user) => ({ ...user })),
    projects: [
      {
        id: 'p1',
        name: '国风神话短片《山海志异》',
        type_name: '短片',
        status: 2,
        progress: 46,
        favorited: true,
        owner: 'u-producer',
        planned_delivery: '2026-09-20',
        create_time: '2026-07-12',
        description: '以山海经为蓝本的中式志怪短片，整片 8 分钟，水墨风格。',
        pipeline_template: 'standard',
        members: P1_MEMBERS,
        segmentMembers: buildSegmentMembers('standard', P1_MEMBERS),
        project_alias: 'SHZY-2026',
        nicknames: '山海',
        project_level: 'A',
        product_name: '山海志异',
        director: 'u-director',
        producer: 'u-producer',
        create_by: 'u-producer',
        approval_date: '2026-07-10',
        actual_delivery: '',
        health_score: 72,
        risk_level: 1,
        references: '《中国奇谭》《雾山五行》',
        total_episodes: 1,
        episode_duration: 8,
        duration_minutes: 8,
        schedule: '2026 Q3',
        languages: '中文',
        resolution: '4K',
        frame_rate: '24fps',
        budget: 35,
        has_lip_sync: 0,
        has_digital_assets: 1,
        gen_model: 'SDXL + AnimateDiff',
        business_type: 1,
        test_label: 'none',
        application_date: '2026-07-08',
        initiator: 'u-producer',
        initiator_position: '制片',
        department: '制作中心',
        production_start: '2026-07-12',
        production_end: '2026-09-20',
        has_ai_voice: 0,
        has_digital_human: 0,
        has_style_lora: 1,
      },
      {
        id: 'p2',
        name: '品牌 TVC《晨光·城市》',
        type_name: 'TVC',
        status: 2,
        progress: 72,
        favorited: false,
        owner: 'u-producer',
        planned_delivery: '2026-09-05',
        create_time: '2026-07-28',
        description: '城市咖啡品牌 30 秒 TVC，实拍转 AI 场景延展。',
        pipeline_template: 'lightweight',
        members: P2_MEMBERS,
        segmentMembers: buildSegmentMembers('lightweight', P2_MEMBERS),
        project_alias: 'CGCS-30S',
        nicknames: '晨光',
        project_level: 'B',
        product_name: '晨光咖啡',
        director: 'u-director',
        producer: 'u-producer',
        create_by: 'u-producer',
        approval_date: '2026-07-25',
        actual_delivery: '',
        health_score: 85,
        risk_level: 0,
        references: 'Nespresso 城市系列',
        total_episodes: 1,
        episode_duration: 1,
        duration_minutes: 1,
        schedule: '2026 Q3',
        languages: '中文',
        resolution: '1080P',
        frame_rate: '25fps',
        budget: 12,
        has_lip_sync: 0,
        has_digital_assets: 1,
        gen_model: 'SDXL',
        business_type: 0,
        test_label: 'none',
        application_date: '2026-07-22',
        initiator: 'u-producer',
        initiator_position: '制片',
        department: '制作中心',
        production_start: '2026-07-28',
        production_end: '2026-09-05',
        has_ai_voice: 1,
        has_digital_human: 0,
        has_style_lora: 0,
      },
      {
        id: 'p3',
        name: '漫剧《雾都疑云》第一季',
        type_name: '漫剧',
        status: 1,
        progress: 12,
        favorited: true,
        owner: 'u-director',
        planned_delivery: '2026-10-15',
        create_time: '2026-08-02',
        description: '民国侦探漫剧，共 12 集，每集 3 分钟，对口型对白为主。',
        pipeline_template: 'lip_sync',
        members: P3_MEMBERS,
        segmentMembers: buildSegmentMembers('lip_sync', P3_MEMBERS),
        project_alias: 'WDYY-S1',
        nicknames: '雾都',
        project_level: 'S',
        product_name: '雾都疑云',
        director: 'u-director',
        producer: 'u-director',
        create_by: 'u-director',
        approval_date: '2026-07-30',
        actual_delivery: '',
        health_score: null,
        risk_level: 2,
        references: '《民国奇探》',
        total_episodes: 12,
        episode_duration: 3,
        duration_minutes: 36,
        schedule: '2026 Q4',
        languages: '中文',
        resolution: '2K',
        frame_rate: '24fps',
        budget: 60,
        has_lip_sync: 1,
        has_digital_assets: 1,
        gen_model: 'SDXL + Wav2Lip',
        business_type: 1,
        test_label: 'none',
        application_date: '2026-07-28',
        initiator: 'u-director',
        initiator_position: '导演',
        department: '创作部',
        production_start: '2026-08-02',
        production_end: '2026-10-15',
        has_ai_voice: 1,
        has_digital_human: 1,
        has_style_lora: 1,
      },
      {
        id: 'p4',
        name: '产品演示视频《AirFlow Pro》',
        type_name: '演示视频',
        status: 4,
        progress: 100,
        favorited: false,
        owner: 'u-post',
        planned_delivery: '2026-08-10',
        create_time: '2026-06-15',
        description: '净化器产品 60 秒演示视频，已交付归档。',
        pipeline_template: 'lightweight',
    members: P4_MEMBERS,
    segmentMembers: buildSegmentMembers('lightweight', P4_MEMBERS),
    project_alias: 'AFP-DEMO',
    nicknames: 'AirFlow',
    project_level: 'C',
    product_name: 'AirFlow Pro',
    director: 'u-post',
    producer: 'u-post',
    create_by: 'u-post',
    approval_date: '2026-06-12',
    actual_delivery: '2026-08-09',
    health_score: 98,
    risk_level: 0,
    references: 'Dyson 产品片',
    total_episodes: 1,
    episode_duration: 1,
    duration_minutes: 1,
    schedule: '2026 Q2',
    languages: '中文',
    resolution: '1080P',
    frame_rate: '30fps',
    budget: 8,
    has_lip_sync: 0,
    has_digital_assets: 0,
    gen_model: 'SDXL',
    business_type: 0,
    test_label: 'none',
    application_date: '2026-06-10',
    initiator: 'u-post',
    initiator_position: '剪辑后期',
    department: '制作中心',
    production_start: '2026-06-15',
    production_end: '2026-08-10',
    has_ai_voice: 0,
    has_digital_human: 0,
    has_style_lora: 0,
  },
    ],
    projectDemands: [
      {
        id: 'd1',
        title: '古风音律 MV《弦上长安》',
        project_type: '短片',
        client_name: '华音文化',
        initiator_id: 'u-producer',
        application_date: '2026-09-01',
        planned_delivery: '2026-11-20',
        remark: '琵琶演奏家 x 古风插画的融合 MV，4 分钟，需风格 LoRA 训练。',
        project_level: 'A',
        business_type: 0,
        approved: true,
      },
      {
        id: 'd2',
        title: '新能源车发布会开场片',
        project_type: '宣传片',
        client_name: '星驰汽车',
        initiator_id: 'u-director',
        application_date: '2026-09-02',
        planned_delivery: '2026-10-10',
        remark: '发布会开场 90 秒，赛博朋克城市穿行镜头，输出 4K。',
        project_level: 'S',
        business_type: 0,
      },
      {
        id: 'd3',
        title: '知识付费课程动画《经济学思维》',
        project_type: '漫剧',
        client_name: '启明学堂',
        initiator_id: 'u-screenwriter',
        application_date: '2026-08-30',
        planned_delivery: '2026-12-01',
        remark: '24 集课程配套动画，每集 2 分钟，讲师数字人口播 + 动画演绎。',
        project_level: 'B',
        business_type: 0,
      },
      {
        id: 'd4',
        title: 'AI 配音有声漫《夜行档案》',
        project_type: '漫剧',
        client_name: '内部孵化',
        initiator_id: 'u-art',
        application_date: '2026-08-25',
        planned_delivery: '2026-11-05',
        remark: '悬疑有声漫 8 集，AI 配音驱动角色口型，试验管线可行性。',
        project_level: 'B',
        business_type: 1,
      },
    ],
    pipelineTemplates: PIPELINE_TEMPLATES,
    tasks: [
      // 剧本线（编剧：剧本写作/设定 + 分镜划分）
      {
        id: 't11',
        name: '《山海志异》第二幕剧本修订',
        line: 'script',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-08-31',
        projectId: 'p1',
        stageText: '前期 / 剧本',
        lane: 'today_work',
        assignee: 'u-screenwriter',
        description: '修订第二幕对白节奏与角色动机，输出 v3 提交评审。',
        createdAt: '2026-08-20',
      },
      {
        id: 't12',
        name: 'S01 场次分镜表拆分',
        line: 'script',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-09-01',
        projectId: 'p1',
        stageText: '前期 / 分镜',
        lane: 'todo',
        assignee: 'u-screenwriter',
        description: '将 S01 场次按镜头拆分为分镜表，供视频生成引用。',
        createdAt: '2026-08-22',
      },
      // 美术线
      {
        id: 't1',
        name: '角色「白小满」三视图 v3',
        line: 'art',
        status: 'in_progress',
        priority: 'urgent',
        dueDate: '2026-08-30',
        projectId: 'p1',
        stageText: '资产 / 角色设定',
        lane: 'today_work',
        assignee: 'u-art',
        description: '白小满三视图 v3，含正/侧/背与表情表，导演锁定后入库。',
        prompt: '少女守境人白小满三视图，白衣青纹，肩头白鹿纹微光，正/侧/背与表情表，国风动画设定稿',
        genModel: 'Midjourney V7',
        createdAt: '2026-08-18',
      },
      {
        id: 't2',
        name: '场景「阴阳集市」概念图',
        line: 'art',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-09-02',
        projectId: 'p1',
        stageText: '资产 / 场景设定',
        lane: 'todo',
        assignee: 'u-art',
        createdAt: '2026-08-21',
      },
      {
        id: 't3',
        name: '场景「荒墟渡口」概念图',
        line: 'art',
        status: 'review',
        priority: 'medium',
        dueDate: '2026-09-03',
        projectId: 'p1',
        stageText: '资产 / 场景设定',
        lane: 'in_review',
        assignee: 'u-art',
        createdAt: '2026-08-23',
      },
      {
        id: 't4',
        name: '道具「纸刃」多角度设定',
        line: 'art',
        status: 'done',
        priority: 'low',
        dueDate: '2026-08-24',
        projectId: 'p1',
        stageText: '资产 / 道具设定',
        lane: 'today_cleared',
        assignee: 'u-art',
        createdAt: '2026-08-15',
      },
      // 视频线
      {
        id: 't5',
        name: '镜头 S01-012 图生视频',
        line: 'video',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-08-31',
        projectId: 'p1',
        stageText: '镜头 / 视频生成',
        lane: 'today_work',
        assignee: 'u-video',
        description: 'S01-012 镜头图生视频生成，候选提交导演审阅。',
        prompt: '白小满穿行阴阳集市，青灯与纸伞错落，镜头缓慢前推，暖调黄昏光',
        genModel: 'Kling 1.6',
        createdAt: '2026-08-24',
      },
      {
        id: 't6',
        name: '镜头 S01-013 返工：眼神调整',
        line: 'video',
        status: 'todo',
        priority: 'urgent',
        dueDate: '2026-08-29',
        projectId: 'p1',
        stageText: '镜头 / 视频生成',
        lane: 'overdue',
        assignee: 'u-video',
        reworkReason: '导演：开场眼神太呆，重新生成一版更有灵气的。',
        prompt: '白小满抬头特写，眼神灵动有神，发丝轻扬，浅景深，国风动画质感',
        genModel: 'Kling 1.6',
        createdAt: '2026-08-28',
      },
      {
        id: 't7',
        name: '镜头 S01-014 首尾帧衔接',
        line: 'video',
        status: 'review',
        priority: 'medium',
        dueDate: '2026-09-01',
        projectId: 'p1',
        stageText: '镜头 / 视频生成',
        lane: 'in_review',
        assignee: 'u-video',
        createdAt: '2026-08-25',
      },
      {
        id: 't8',
        name: '镜头 C02-003 产品旋转展示',
        line: 'video',
        status: 'done',
        priority: 'medium',
        dueDate: '2026-08-26',
        projectId: 'p2',
        stageText: '镜头 / 视频生成',
        lane: 'today_cleared',
        assignee: 'u-video',
        createdAt: '2026-08-20',
      },
      {
        id: 't9',
        name: '片头 3 秒 hook A/B 变体',
        line: 'video',
        status: 'in_progress',
        priority: 'high',
        dueDate: '2026-09-04',
        projectId: 'p2',
        stageText: '镜头 / 视频生成',
        lane: 'today_work',
        assignee: 'u-video',
        prompt: '咖啡杯热气升腾，城市晨光流动，产品环绕运镜，商业广告质感',
        genModel: 'Runway Gen-4',
        createdAt: '2026-08-26',
      },
      {
        id: 't10',
        name: '主角「程雾」角色卡 v1',
        line: 'art',
        status: 'todo',
        priority: 'high',
        dueDate: '2026-09-06',
        projectId: 'p3',
        stageText: '资产 / 角色设定',
        lane: 'todo',
        assignee: 'u-art',
        createdAt: '2026-08-27',
      },
      {
        id: 't13',
        name: '镜头 S01-009 图生视频',
        line: 'video',
        status: 'done',
        priority: 'medium',
        dueDate: '2026-09-10',
        projectId: 'p1',
        stageText: '镜头 / 视频生成',
        lane: 'today_cleared',
        assignee: 'u-video',
        description: 'S01-009 镜头已定稿，候选 #3 通过导演审批。',
        prompt: '荒墟渡口残阳，纸灯浮于水面，萤络妖火明灭，镜头缓推',
        genModel: 'Seedance 1.0',
        createdAt: '2026-08-19',
      },
    ],
    approvals: [
      // ---- 任务审核 · 资产锁定（美术提交，导演审批）----
      {
        id: 'a1',
        type: 'asset_lock',
        title: '角色卡「白小满」v3 锁定申请',
        submitter: 'u-art',
        submittedAt: '2026-09-18 09:12',
        dueAt: '2026-09-25',
        priority: 'urgent',
        status: 'pending',
        projectId: 'p1',
        targetId: 'DA-001',
      },
      {
        id: 'a2',
        type: 'asset_lock',
        title: '场景卡「荒墟渡口」锁定申请',
        submitter: 'u-art',
        submittedAt: '2026-09-17 16:40',
        dueAt: '2026-09-26',
        priority: 'normal',
        status: 'pending',
        projectId: 'p1',
        targetId: 'DA-004',
      },
      {
        id: 'a7',
        type: 'asset_lock',
        title: '妖兽「萤络」妖形态锁定申请',
        submitter: 'u-art',
        submittedAt: '2026-09-18 11:05',
        dueAt: '2026-09-26',
        priority: 'urgent',
        status: 'pending',
        projectId: 'p1',
        targetId: 'DA-002',
      },
      {
        id: 'a8',
        type: 'asset_lock',
        title: '道具「青灯」设定锁定申请',
        submitter: 'u-art',
        submittedAt: '2026-09-16 15:22',
        dueAt: '2026-09-29',
        priority: 'normal',
        status: 'pending',
        projectId: 'p1',
        targetId: 'DA-007',
      },
      {
        id: 'a5',
        type: 'asset_lock',
        title: '场景卡「阴阳集市」锁定申请',
        submitter: 'u-art',
        submittedAt: '2026-09-14 11:20',
        dueAt: '2026-09-18',
        priority: 'normal',
        status: 'approved',
        projectId: 'p1',
        targetId: 'DA-003',
        operatorId: 'u-director',
        comment: '资产质量达标，允许入库。',
        decidedAt: '2026-09-16 10:00',
      },
      {
        id: 'a9',
        type: 'asset_lock',
        title: '角色卡「白小满」三视图 v2 锁定申请',
        submitter: 'u-art',
        submittedAt: '2026-09-10 09:30',
        dueAt: '2026-09-15',
        priority: 'normal',
        status: 'approved',
        projectId: 'p1',
        targetId: 'DA-001',
        operatorId: 'u-director',
        comment: 'v2 通过，v3 微调后重新锁定。',
        decidedAt: '2026-09-12 14:20',
      },
      {
        id: 'a10',
        type: 'asset_lock',
        title: '场景卡「荒墟渡口」v0.8 锁定申请',
        submitter: 'u-art',
        submittedAt: '2026-09-08 10:12',
        dueAt: '2026-09-14',
        priority: 'normal',
        status: 'rejected',
        projectId: 'p1',
        targetId: 'DA-004',
        operatorId: 'u-director',
        comment: '画面质感不足，完善后重新送审。',
        decidedAt: '2026-09-12 09:40',
      },
      // ---- 任务审核 · 候选定稿（视频提交，导演审批）----
      {
        id: 'a3',
        type: 'candidate_final',
        title: '镜头 S01-012 候选 #4 定稿申请',
        submitter: 'u-video',
        submittedAt: '2026-09-18 10:05',
        dueAt: '2026-09-25',
        priority: 'urgent',
        status: 'pending',
        projectId: 'p1',
        targetId: 't5',
      },
      {
        id: 'a4',
        type: 'candidate_final',
        title: '镜头 C02-003 候选 #2 定稿申请',
        submitter: 'u-video',
        submittedAt: '2026-09-17 15:22',
        dueAt: '2026-09-27',
        priority: 'normal',
        status: 'pending',
        projectId: 'p2',
        targetId: 't8',
      },
      {
        id: 'a11',
        type: 'candidate_final',
        title: '镜头 S01-014 首尾帧衔接 候选 #1 定稿申请',
        submitter: 'u-video',
        submittedAt: '2026-09-12 14:10',
        dueAt: '2026-09-15',
        priority: 'urgent',
        status: 'pending',
        projectId: 'p1',
        targetId: 't7',
      },
      {
        id: 'a12',
        type: 'candidate_final',
        title: '镜头 S01-013 眼神调整 返工后候选 #2 定稿申请',
        submitter: 'u-video',
        submittedAt: '2026-09-19 09:05',
        dueAt: '2026-09-30',
        priority: 'urgent',
        status: 'pending',
        projectId: 'p1',
        targetId: 't6',
      },
      {
        id: 'a13',
        type: 'candidate_final',
        title: '片头 3 秒 hook 候选 A/B 定稿申请',
        submitter: 'u-video',
        submittedAt: '2026-09-16 17:30',
        dueAt: '2026-09-27',
        priority: 'normal',
        status: 'pending',
        projectId: 'p2',
        targetId: 't9',
      },
      {
        id: 'a14',
        type: 'candidate_final',
        title: '镜头 S01-009 定稿申请',
        submitter: 'u-video',
        submittedAt: '2026-09-09 16:00',
        dueAt: '2026-09-13',
        priority: 'normal',
        status: 'approved',
        projectId: 'p1',
        targetId: 't13',
        operatorId: 'u-director',
        comment: '镜头合格，准予定稿。',
        decidedAt: '2026-09-11 11:30',
      },
      {
        id: 'a15',
        type: 'candidate_final',
        title: '镜头 S01-014 首尾帧衔接 候选 #0 定稿申请',
        submitter: 'u-video',
        submittedAt: '2026-09-10 13:20',
        dueAt: '2026-09-14',
        priority: 'normal',
        status: 'rejected',
        projectId: 'p1',
        targetId: 't7',
        operatorId: 'u-director',
        comment: '首尾帧衔接有跳帧，修正后重新提交。',
        decidedAt: '2026-09-12 15:50',
      },
      // ---- 管理审批 · 项目立项（导演/编剧发起，制片审批）----
      {
        id: 'a6',
        type: 'project_create',
        title: '项目立项：AI 配音有声漫《夜行档案》',
        submitter: 'u-art',
        submittedAt: '2026-09-15 14:30',
        dueAt: '2026-09-28',
        priority: 'normal',
        status: 'pending',
        projectId: 'p3',
        targetId: 'd4',
      },
      {
        id: 'a16',
        type: 'project_create',
        title: '项目立项：新能源车发布会开场片',
        submitter: 'u-director',
        submittedAt: '2026-09-18 09:40',
        dueAt: '2026-09-25',
        priority: 'urgent',
        status: 'pending',
        projectId: 'p2',
        targetId: 'd2',
      },
      {
        id: 'a17',
        type: 'project_create',
        title: '项目立项：《经济学思维》课程动画',
        submitter: 'u-screenwriter',
        submittedAt: '2026-09-17 11:15',
        dueAt: '2026-10-02',
        priority: 'normal',
        status: 'pending',
        projectId: 'p3',
        targetId: 'd3',
      },
      {
        id: 'a18',
        type: 'project_create',
        title: '项目立项：古风音律 MV《弦上长安》',
        submitter: 'u-producer',
        submittedAt: '2026-09-05 10:00',
        dueAt: '2026-09-10',
        priority: 'normal',
        status: 'approved',
        projectId: 'p1',
        targetId: 'd1',
        operatorId: 'u-producer',
        comment: '需求与预算确认，同意立项。',
        decidedAt: '2026-09-08 16:30',
      },
      {
        id: 'a19',
        type: 'project_create',
        title: '项目立项：《经济学思维》课程动画（初版）',
        submitter: 'u-screenwriter',
        submittedAt: '2026-09-06 09:20',
        dueAt: '2026-09-12',
        priority: 'normal',
        status: 'rejected',
        projectId: 'p3',
        targetId: 'd3',
        operatorId: 'u-producer',
        comment: '预算与排期未对齐，补充后重新提交。',
        decidedAt: '2026-09-09 14:00',
      },
    ],
    // 捷径来自用户"收藏标签页"动作；预置一条代表历史收藏记录
    shortcuts: [{ id: 's1', label: '审片室', route: '/review' }],
    referenceLibrary: [
      // p1 山海志异
      { id: 'rf1', projectId: 'p1', scope: 'asset', module: '角色设定', name: '角色三视图参考', kind: 'image', isFolder: false, parentId: null, date: '2026-07-15' },
      { id: 'rf2', projectId: 'p1', scope: 'asset', module: '角色设定', name: '服饰纹样合集', kind: 'image', isFolder: false, parentId: 'rf-folder1', date: '2026-07-18' },
      { id: 'rf-folder1', projectId: 'p1', scope: 'asset', module: '角色设定', name: '白小满参考包', kind: 'other', isFolder: true, parentId: null, date: '2026-07-16' },
      { id: 'rf3', projectId: 'p1', scope: 'asset', module: '角色设定', name: '性格小传文本', kind: 'text', isFolder: false, parentId: 'rf-folder1', date: '2026-07-20' },
      { id: 'rf4', projectId: 'p1', scope: 'asset', module: '场景设定', name: '阴阳集市氛围板', kind: 'image', isFolder: false, parentId: null, date: '2026-07-22' },
      { id: 'rf5', projectId: 'p1', scope: 'asset', module: '道具设定', name: '妖兽图鉴扫描页', kind: 'image', isFolder: false, parentId: null, date: '2026-07-25' },
      { id: 'rf-folder2', projectId: 'p1', scope: 'script', module: '世界观', name: '世界观设定集', kind: 'other', isFolder: true, parentId: null, date: '2026-07-13' },
      { id: 'rf6', projectId: 'p1', scope: 'script', module: '世界观', name: '山海经异兽考', kind: 'text', isFolder: false, parentId: 'rf-folder2', date: '2026-07-14' },
      { id: 'rf7', projectId: 'p1', scope: 'script', module: '剧本正文', name: '第二幕修订稿', kind: 'text', isFolder: false, parentId: null, date: '2026-08-28' },
      { id: 'rf8', projectId: 'p1', scope: 'script', module: '剧本正文', name: '志怪氛围参考视频', kind: 'media', isFolder: false, parentId: null, date: '2026-08-01' },
      { id: 'rf9', projectId: 'p1', scope: 'scene', module: '场次资料', name: 'S01 场次气氛图', kind: 'image', isFolder: false, parentId: null, date: '2026-08-05' },
      { id: 'rf10', projectId: 'p1', scope: 'shot', module: '镜头参考', name: '打斗分镜节奏参考', kind: 'image', isFolder: false, parentId: null, date: '2026-08-10' },
      { id: 'rf11', projectId: 'p1', scope: 'shot', module: '镜头参考', name: '转场运镜参考', kind: 'media', isFolder: false, parentId: null, date: '2026-08-12' },
      // p2 晨光·城市
      { id: 'rf12', projectId: 'p2', scope: 'asset', module: '道具设定', name: '产品特写参考', kind: 'image', isFolder: false, parentId: null, date: '2026-08-02' },
      { id: 'rf13', projectId: 'p2', scope: 'scene', module: '场次资料', name: '城市场景参考', kind: 'image', isFolder: false, parentId: null, date: '2026-08-03' },
      { id: 'rf14', projectId: 'p2', scope: 'script', module: '剧本正文', name: '咖啡广告脚本', kind: 'text', isFolder: false, parentId: null, date: '2026-07-30' },
      // p3 雾都疑云
      { id: 'rf15', projectId: 'p3', scope: 'asset', module: '角色设定', name: '侦探角色参考', kind: 'image', isFolder: false, parentId: null, date: '2026-08-06' },
      { id: 'rf16', projectId: 'p3', scope: 'scene', module: '场次资料', name: '民国街道参考', kind: 'image', isFolder: false, parentId: null, date: '2026-08-08' },
      { id: 'rf17', projectId: 'p3', scope: 'script', module: '剧本正文', name: '对白配音样例', kind: 'media', isFolder: false, parentId: null, date: '2026-08-15' },
    ],
    projectOutputs: {
      p1: [
        { id: 'o1', title: '正片 v0.3', filename: '山海志异_v03_精剪.mp4', duration: '08:12', status: 'reviewing', pinCount: 3, size: '1.2 GB', updatedAt: '2026-08-30', updatedAgo: '2 天前' },
        { id: 'o2', title: '先导预告 v1', filename: '山海志异_先导预告_v1.mp4', duration: '00:45', status: 'approved', pinCount: 5, size: '218 MB', updatedAt: '2026-08-25', updatedAgo: '7 天前' },
      ],
      p2: [
        { id: 'o3', title: 'TVC 成片 v0.9', filename: '晨光城市_TVC_v09.mp4', duration: '00:30', status: 'pending', pinCount: 1, size: '96 MB', updatedAt: '2026-08-28', updatedAgo: '4 天前' },
      ],
      p3: [],
      p4: [
        { id: 'o4', title: '演示视频终版', filename: 'AirFlowPro_演示终版.mp4', duration: '01:00', status: 'approved', pinCount: 2, size: '152 MB', updatedAt: '2026-08-09', updatedAgo: '3 周前' },
      ],
    },
    production: seedProduction(),
    reviewTimelines: [
      {
        id: 'tl-1',
        projectId: 'p1',
        name: '正片',
        versionCode: 'v0.3',
        status: 'in_review',
        videoUrl: '/demo-assets/review/review-sintel.mp4',
        thumbnailUrl: null,
        /** 视频真实时长（种子兜底，加载 metadata 后以实际为准） */
        videoDurationSec: 52.2,
        frameRate: 24,
        useProductionShots: true,
        // 镜头段由生产任务镜头号生成（api.fetchReviewTimelineDetail），此处兜底留空
        clips: [],
        comments: [
          {
            id: 'rc-1',
            authorId: 'u-director',
            content: '开场白小满出场的眼神不对，太呆了，@林深 重新生成一版更有灵气的。',
            mentionUserIds: ['u-video'],
            createdAt: '2026-09-12T10:24:00',
            timeSeconds: 8,
            annotations: {
              media_width: 960,
              media_height: 540,
              shapes: [
                {
                  id: 's-1',
                  type: 'rect',
                  config: { x: 0.4, y: 0.25, width: 0.2, height: 0.3, stroke: '#f5222d', strokeWidth: 2.5 },
                },
                {
                  id: 's-2',
                  type: 'arrow',
                  config: {
                    points: [0.7, 0.2, 0.61, 0.35],
                    stroke: '#f5222d',
                    strokeWidth: 2.5,
                    fill: '#f5222d',
                    pointerLength: 12,
                    pointerWidth: 10,
                  },
                },
                {
                  id: 's-3',
                  type: 'text',
                  config: { x: 0.66, y: 0.12, text: '眼神', fontSize: 16, fill: '#f5222d' },
                },
              ],
            },
            screenshotDataUrl: null,
            resolvedAt: null,
            replies: [
              {
                id: 'rc-1-r1',
                authorId: 'u-video',
                content: '收到，我调整提示词出两版候选给你挑。',
                mentionUserIds: [],
                createdAt: '2026-09-12T11:02:00',
                timeSeconds: 8,
                annotations: null,
                screenshotDataUrl: null,
                resolvedAt: null,
                replies: [],
                reactions: {},
              },
            ],
            reactions: { '👍': 2 },
          },
          {
            id: 'rc-2',
            authorId: 'u-producer',
            content: '这个转场客户之前提过要更快一点，控制在 0.5s 内完成。',
            mentionUserIds: [],
            createdAt: '2026-09-11T16:40:00',
            timeSeconds: 26,
            annotations: null,
            screenshotDataUrl: null,
            resolvedAt: '2026-09-12T09:15:00',
            replies: [],
            reactions: {},
          },
          {
            id: 'rc-3',
            authorId: 'u-director',
            content: '阴阳集市的氛围可以，灯笼的暖色再压一点，别抢主体。',
            mentionUserIds: [],
            createdAt: '2026-09-12T14:08:00',
            timeSeconds: 41,
            annotations: null,
            screenshotDataUrl: null,
            resolvedAt: null,
            replies: [],
            reactions: { '🔥': 1 },
          },
        ],
        createdAt: '2026-08-30',
      },
      {
        id: 'tl-2',
        projectId: 'p1',
        name: '先导预告',
        versionCode: 'v1',
        status: 'approved',
        videoUrl: '/demo-assets/review/review-bunny.mp4',
        thumbnailUrl: null,
        videoDurationSec: 33,
        frameRate: 24,
        clips: [{ id: 'tl-2-clip-1', label: '预告正片', startSec: 0, endSec: 33 }],
        comments: [],
        createdAt: '2026-08-25',
      },
      {
        id: 'tl-3',
        projectId: 'p2',
        name: 'TVC 成片',
        versionCode: 'v0.9',
        status: 'in_review',
        videoUrl: '/demo-assets/review/review-sintel.mp4',
        thumbnailUrl: null,
        videoDurationSec: 52.2,
        frameRate: 24,
        clips: [
          { id: 'tl-3-clip-1', label: '城市晨光开场', startSec: 0, endSec: 20 },
          { id: 'tl-3-clip-2', label: '产品特写', startSec: 20, endSec: 52.2 },
        ],
        comments: [
          {
            id: 'rc-4',
            authorId: 'u-producer',
            content: '第二段产品 logo 停留时间再多半秒，客户特别强调了品牌露出。',
            mentionUserIds: [],
            createdAt: '2026-09-13T09:30:00',
            timeSeconds: 48,
            annotations: null,
            screenshotDataUrl: null,
            resolvedAt: null,
            replies: [],
            reactions: {},
          },
        ],
        createdAt: '2026-08-28',
      },
    ],
    reviewShotFields: {
      'T-001': { colorCategory: 'red', rating: 'B', directorComments: '眼神重新生成后再送审' },
      'T-002': { colorCategory: 'green', rating: 'A', directorComments: '' },
    },
  };
}

export function readDB(): DemoDB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDB;
      if (parsed.version === DB_VERSION) {
        // 同版本但字段缺失时补默认值（历史数据兼容）
        parsed.referenceLibrary ??= [];
        parsed.projectOutputs ??= {};
        parsed.projectDemands ??= seed().projectDemands;
        parsed.production ??= seedProduction();
        parsed.reviewTimelines ??= seed().reviewTimelines;
        parsed.reviewShotFields ??= {};
        // 审批兼容：历史数据缺 status/projectId/targetId 时按标题与类型兜底为待审
        if (Array.isArray(parsed.approvals)) {
          parsed.approvals = parsed.approvals.map((approval) => ({
            ...approval,
            status: approval.status ?? 'pending',
            projectId: approval.projectId ?? 'p1',
            targetId: approval.targetId ?? '',
          }));
        }
        // 任务兼容：历史数据缺负责人（assignee）时按生产线映射补齐
        if (Array.isArray(parsed.tasks)) {
          const taskAssigneeByLine: Record<string, string> = {
            art: 'u-art',
            video: 'u-video',
            script: 'u-screenwriter',
          };
          parsed.tasks = parsed.tasks.map((task) => {
            // 分镜线已并入剧本线（v15 起），先迁移再兜底负责人
            const line = (task.line as string) === 'storyboard' ? 'script' : task.line;
            return {
              ...task,
              line,
              assignee: task.assignee ?? taskAssigneeByLine[line] ?? 'u-producer',
            };
          });
        }
        // 镜头审片字段兼容：v12 曾用错误 key（pt-sc1-task1 等），迁移到真实任务 id
        const shotFieldAliases: Record<string, string> = {
          'pt-sc1-task1': 'T-001',
          'pt-sc2-task1': 'T-002',
        };
        for (const [oldKey, newKey] of Object.entries(shotFieldAliases)) {
          if (parsed.reviewShotFields[oldKey] && !parsed.reviewShotFields[newKey]) {
            parsed.reviewShotFields[newKey] = parsed.reviewShotFields[oldKey];
            delete parsed.reviewShotFields[oldKey];
          }
        }
        // 项目集合兼容：历史数据缺 members / segmentMembers 时，从种子对应项目回填
        if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          const seedProjects = seed().projects;
          parsed.projects = parsed.projects.map((project) => {
            const fallback = seedProjects.find((item) => item.id === project.id);
            const next = { ...project };
            if (!Array.isArray(next.members)) {
              next.members = fallback ? fallback.members.map((m) => ({ ...m })) : [];
            }
            if (!Array.isArray(next.segmentMembers)) {
              next.segmentMembers = fallback
                ? fallback.segmentMembers.map((m) => ({ ...m }))
                : [];
            }
            return next;
          });
        } else {
          parsed.projects = seed().projects;
        }
        // 人员集合兼容：老版本缺少部门/在职状态时，从种子角色表补齐
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          parsed.users = parsed.users.map((user) => {
            const fallback = COMPANY_STAFF.find((item) => item.id === user.id);
            return {
              ...user,
              department: user.department ?? fallback?.department ?? '制片中心',
              employmentStatus: user.employmentStatus ?? 'active',
            };
          });
        } else {
          parsed.users = seed().users;
        }
        return parsed;
      }
    }
  } catch {
    // 数据损坏时回退到重新播种
  }
  const fresh = seed();
  writeDB(fresh);
  return fresh;
}

export function writeDB(db: DemoDB): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/** 一键重置演示数据：清空并重新播种 */
export function resetDB(): DemoDB {
  localStorage.removeItem(DB_KEY);
  const fresh = seed();
  writeDB(fresh);
  return fresh;
}

/** 应用启动时确保数据库已播种 */
export function ensureDBSeeded(): DemoDB {
  return readDB();
}

/** 按角色过滤任务（各角色只看本生产线，制片/导演看全部） */
export function filterTasksByRole(tasks: DemoTask[], role: RoleCode): DemoTask[] {
  const lineByRole: Partial<Record<RoleCode, DemoTaskLine[]>> = {
    screenwriter: ['script'],
    art_generator: ['art'],
    video_generator: ['video'],
    post_production: ['video'],
  };
  const lines = lineByRole[role];
  return lines ? tasks.filter((task) => lines.includes(task.line)) : tasks;
}

/** 收藏标签页为首页捷径 */
export function addShortcut(label: string, route: string): DemoShortcut[] {
  const db = readDB();
  const trimmed = label.trim() || '未命名捷径';
  if (!db.shortcuts.some((shortcut) => shortcut.route === route)) {
    db.shortcuts.push({ id: `sc-${Date.now()}`, label: trimmed, route });
    writeDB(db);
  }
  return db.shortcuts;
}
