import { markRaw, type Component } from 'vue';
import {
  TeamOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  PictureOutlined,
  PlaySquareOutlined,
  ScissorOutlined,
} from '@ant-design/icons-vue';

/** 角色编码（客户为免登录外链角色，不参与登录） */
export type RoleCode =
  | 'producer' // 制片
  | 'director' // 导演（兼美术终审 / 资产锁定审批）
  | 'screenwriter' // 编剧
  | 'art_generator' // 美术生成师（出图）
  | 'video_generator' // 视频生成师（图生视频）
  | 'post_production'; // 剪辑后期

export interface RoleDefinition {
  code: RoleCode;
  label: string;
  description: string;
}

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  { code: 'producer', label: '制片', description: '项目与成本总览，进度与风险把控' },
  { code: 'director', label: '导演', description: '终审定稿、返工决策与资产锁定审批' },
  { code: 'screenwriter', label: '编剧', description: '剧本维护与分镜表结构管理' },
  { code: 'art_generator', label: '美术生成师', description: '角色、场景设定出图与资产候选提交' },
  { code: 'video_generator', label: '视频生成师', description: '镜头图生视频、候选回流与自筛' },
  { code: 'post_production', label: '剪辑后期', description: '精修合成、成片版本与镜头映射' },
];

/** 演示用户（登录页角色切换器数据源） */
export interface DemoUser {
  id: string;
  name: string;
  role: RoleCode;
  roleLabel: string;
  description: string;
  /** 头像主题色（primitive hex，用于派生前景/背景） */
  color: string;
  icon: Component;
  /** 所属部门（人员管理：组织维度，与角色平行） */
  department: string;
  /** 在职状态：active 在职 / inactive 离职 */
  employmentStatus: 'active' | 'inactive';
}

/** 人员组织：部门清单（人员管理左树） */
export const DEPARTMENTS: string[] = [
  '制片中心',
  '创作中心',
  '美术部',
  '视频部',
  '后期部',
];

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'u-producer',
    name: '张远',
    role: 'producer',
    roleLabel: '制片',
    description: '项目与成本总览，进度与风险把控',
    color: '#0055ff',
    icon: markRaw(TeamOutlined),
    department: '制片中心',
    employmentStatus: 'active',
  },
  {
    id: 'u-director',
    name: '李慕',
    role: 'director',
    roleLabel: '导演',
    description: '终审定稿、返工决策与资产锁定审批',
    color: '#6679ff',
    icon: markRaw(VideoCameraOutlined),
    department: '创作中心',
    employmentStatus: 'active',
  },
  {
    id: 'u-screenwriter',
    name: '王栖',
    role: 'screenwriter',
    roleLabel: '编剧',
    description: '剧本维护与分镜表结构管理',
    color: '#4aa9f5',
    icon: markRaw(FileTextOutlined),
    department: '创作中心',
    employmentStatus: 'active',
  },
  {
    id: 'u-art',
    name: '苏晚',
    role: 'art_generator',
    roleLabel: '美术生成师',
    description: '角色、场景设定出图与资产候选提交',
    color: '#ef9c3f',
    icon: markRaw(PictureOutlined),
    department: '美术部',
    employmentStatus: 'active',
  },
  {
    id: 'u-video',
    name: '林深',
    role: 'video_generator',
    roleLabel: '视频生成师',
    description: '镜头图生视频、候选回流与自筛',
    color: '#39bc72',
    icon: markRaw(PlaySquareOutlined),
    department: '视频部',
    employmentStatus: 'active',
  },
  {
    id: 'u-post',
    name: '陈序',
    role: 'post_production',
    roleLabel: '剪辑后期',
    description: '精修合成、成片版本与镜头映射',
    color: '#f26b7f',
    icon: markRaw(ScissorOutlined),
    department: '后期部',
    employmentStatus: 'active',
  },
];

/** 角色默认职责描述（公司员工库按角色复用） */
const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  producer: '项目排期、预算与交付节奏把控',
  director: '镜头终审、返工决策与资产锁定审批',
  screenwriter: '剧本维护与分镜表拆分',
  art_generator: '角色、场景与道具设定出图',
  video_generator: '镜头图生视频与候选回流',
  post_production: '精修合成与成片输出',
};

/** 公司员工库补充人员（不含登录演示角色，共 24 人） */
interface CompanyStaffSeed {
  id: string;
  name: string;
  role: RoleCode;
  department: string;
  employmentStatus: 'active' | 'inactive';
  color: string;
}

const COMPANY_STAFF_SEED: CompanyStaffSeed[] = [
  // 制片中心
  { id: 'u-1001', name: '周砚', role: 'producer', department: '制片中心', employmentStatus: 'active', color: '#0055ff' },
  { id: 'u-1002', name: '何菲', role: 'producer', department: '制片中心', employmentStatus: 'active', color: '#6679ff' },
  { id: 'u-1003', name: '邱南', role: 'producer', department: '制片中心', employmentStatus: 'active', color: '#4aa9f5' },
  { id: 'u-1004', name: '施敏', role: 'producer', department: '制片中心', employmentStatus: 'inactive', color: '#ef9c3f' },
  // 创作中心
  { id: 'u-1005', name: '郑望', role: 'director', department: '创作中心', employmentStatus: 'active', color: '#39bc72' },
  { id: 'u-1006', name: '孟青', role: 'director', department: '创作中心', employmentStatus: 'active', color: '#f26b7f' },
  { id: 'u-1007', name: '许知白', role: 'screenwriter', department: '创作中心', employmentStatus: 'active', color: '#8f6df5' },
  { id: 'u-1008', name: '岑晓', role: 'screenwriter', department: '创作中心', employmentStatus: 'active', color: '#14b8c4' },
  { id: 'u-1009', name: '傅原', role: 'screenwriter', department: '创作中心', employmentStatus: 'active', color: '#0055ff' },
  { id: 'u-1010', name: '卢雨眠', role: 'screenwriter', department: '创作中心', employmentStatus: 'inactive', color: '#6679ff' },
  // 美术部
  { id: 'u-1011', name: '江照', role: 'art_generator', department: '美术部', employmentStatus: 'active', color: '#4aa9f5' },
  { id: 'u-1012', name: '唐梨', role: 'art_generator', department: '美术部', employmentStatus: 'active', color: '#ef9c3f' },
  { id: 'u-1013', name: '毕野', role: 'art_generator', department: '美术部', employmentStatus: 'active', color: '#39bc72' },
  { id: 'u-1014', name: '骆青禾', role: 'art_generator', department: '美术部', employmentStatus: 'active', color: '#f26b7f' },
  { id: 'u-1015', name: '尹棠', role: 'art_generator', department: '美术部', employmentStatus: 'active', color: '#8f6df5' },
  // 视频部
  { id: 'u-1016', name: '秦屿', role: 'video_generator', department: '视频部', employmentStatus: 'active', color: '#14b8c4' },
  { id: 'u-1017', name: '卫澜', role: 'video_generator', department: '视频部', employmentStatus: 'active', color: '#0055ff' },
  { id: 'u-1018', name: '蒋牧', role: 'video_generator', department: '视频部', employmentStatus: 'active', color: '#6679ff' },
  { id: 'u-1019', name: '崔时', role: 'video_generator', department: '视频部', employmentStatus: 'active', color: '#4aa9f5' },
  { id: 'u-1020', name: '贺临', role: 'video_generator', department: '视频部', employmentStatus: 'inactive', color: '#ef9c3f' },
  // 后期部
  { id: 'u-1021', name: '邵闻', role: 'post_production', department: '后期部', employmentStatus: 'active', color: '#39bc72' },
  { id: 'u-1022', name: '柏舟', role: 'post_production', department: '后期部', employmentStatus: 'active', color: '#f26b7f' },
  { id: 'u-1023', name: '童越', role: 'post_production', department: '后期部', employmentStatus: 'inactive', color: '#8f6df5' },
  { id: 'u-1024', name: '简宁', role: 'post_production', department: '后期部', employmentStatus: 'active', color: '#14b8c4' },
];

/**
 * 公司员工库（人员管理 / 项目成员选人的唯一数据源，共 30 人）
 * = 登录演示角色 6 人 + 补充员工 24 人。
 * 登录页仍只用 DEMO_USERS，人员库增删不影响登录视角。
 */
export const COMPANY_STAFF: DemoUser[] = [
  ...DEMO_USERS,
  ...COMPANY_STAFF_SEED.map((item) => ({
    id: item.id,
    name: item.name,
    role: item.role,
    roleLabel: ROLE_DEFINITIONS.find((role) => role.code === item.role)?.label ?? '成员',
    description: ROLE_DESCRIPTIONS[item.role],
    color: item.color,
    icon: DEMO_USERS.find((user) => user.role === item.role)?.icon ?? DEMO_USERS[0].icon,
    department: item.department,
    employmentStatus: item.employmentStatus,
  })),
];
