import {
  AppstoreOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons-vue';
import type { Component } from 'vue';
import type { ProductionSectionDef, ProjectDetailMenuKey } from './types';

/** 左侧二级导航（KK WorkspaceSideNav 项：概览/制作信息，无会议管理/参考库） */
export const DETAIL_MENU_ITEMS: Array<{
  key: ProjectDetailMenuKey;
  label: string;
  icon: Component;
}> = [
  { key: 'overview', label: '项目概览', icon: AppstoreOutlined },
  { key: 'production-info', label: '制作信息', icon: InfoCircleOutlined },
];

export const DETAIL_BOTTOM_MENU_ITEMS: Array<{
  key: ProjectDetailMenuKey;
  label: string;
  icon: Component;
}> = [{ key: 'settings', label: '项目设置', icon: TeamOutlined }];

/** 英雄区动作按钮 */
export const HERO_ACTION_BUTTONS = [
  { key: 'workshop', label: '制作工坊', route: (id: string) => `/projects/${id}/workshop` },
  { key: 'asset-list', label: '资产清单', route: (id: string) => `/projects/${id}/asset-list` },
  { key: 'data-list', label: '数据清单', route: (id: string) => `/projects/${id}/data-list` },
  { key: 'review', label: '审片室', route: (id: string) => `/projects/${id}/review` },
] as const;

/** 核心输出状态映射（KK statusMap 同款） */
export const OUTPUT_STATUS_MAP: Record<
  string,
  { label: string; color: string; background: string }
> = {
  approved: {
    label: '已批准',
    color: 'var(--color-feedback-success)',
    background: 'var(--color-fill-success-subtle)',
  },
  reviewing: {
    label: '审核中',
    color: 'var(--color-action-link)',
    background: 'var(--color-fill-primary-subtle)',
  },
  pending: {
    label: '待修改',
    color: 'var(--color-text-secondary)',
    background: 'var(--color-bg-disabled)',
  },
  rejected: {
    label: '已驳回',
    color: 'var(--color-feedback-error)',
    background: 'var(--color-fill-error-subtle)',
  },
};

/** 概览页文件夹卡片（资源空间，固定三类，对齐 KK 截图） */
export const OVERVIEW_FOLDERS = [
  { key: 'script', label: '剧本', pathLabel: '前期 / 剧本资料', icon: 'book-open' },
  { key: 'storyboard', label: '分镜', pathLabel: '前期 / 分镜资料', icon: 'folder-kanban' },
  { key: 'asset', label: '资产', pathLabel: '资产 / 设定与素材', icon: 'users' },
] as const;

/** 制作信息选项（对齐 KK project-production-options） */
export const PROJECT_LEVEL_OPTIONS = [
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
];

export const RISK_LEVEL_OPTIONS = [
  { label: '低风险', value: '0' },
  { label: '中风险', value: '1' },
  { label: '高风险', value: '2' },
];

export const RISK_LEVEL_LABELS: Record<string, string> = {
  '0': '低风险',
  '1': '中风险',
  '2': '高风险',
};

export const RESOLUTION_OPTIONS = [
  { label: '4K', value: '4K' },
  { label: '2K', value: '2K' },
  { label: '1080P', value: '1080P' },
  { label: '720P', value: '720P' },
];

export const FRAME_RATE_OPTIONS = [
  { label: '24fps', value: '24fps' },
  { label: '25fps', value: '25fps' },
  { label: '30fps', value: '30fps' },
  { label: '60fps', value: '60fps' },
];

export const YES_NO_OPTIONS = [
  { label: '是', value: '1' },
  { label: '否', value: '0' },
];

/** 健康度展示标签（KK getProjectProductionHealthLabel） */
export function healthScoreLabel(score: number | null): string {
  if (score == null) return '未评估';
  if (score >= 80) return '优';
  if (score >= 60) return '良';
  if (score >= 40) return '中';
  return '差';
}

/** 制作信息 sections（对齐 KK projectProductionSections 结构 + 分组） */
export const PRODUCTION_SECTIONS: ProductionSectionDef[] = [
  {
    id: 'basic',
    title: '项目基础信息',
    icon: InfoCircleOutlined,
    groups: [
      {
        id: 'basic-identification',
        title: '基本项目标识',
        fields: [
          { key: 'name', label: '项目名称', type: 'text', immutable: true },
          { key: 'project_alias', label: '项目代号', type: 'text' },
          { key: 'nicknames', label: '项目昵称', type: 'text' },
          { key: 'type_name', label: '项目类型', type: 'text', immutable: true },
          { key: 'project_level', label: '项目级别', type: 'select', options: PROJECT_LEVEL_OPTIONS },
          { key: 'product_name', label: '产品名称', type: 'text' },
          { key: 'status', label: '项目状态', type: 'text', immutable: true },
          { key: 'pipeline_template', label: '管线模板', type: 'select', options: [
            { label: '标准管线', value: 'standard' },
            { label: '轻量管线', value: 'lightweight' },
            { label: '口型管线', value: 'lip_sync' },
          ] },
        ],
      },
      {
        id: 'people-ownership',
        title: '人员与权责信息',
        fields: [
          { key: 'owner', label: '负责人', type: 'user', immutable: true },
          { key: 'director', label: '项目导演', type: 'staff' },
          { key: 'producer', label: '项目制片', type: 'staff' },
          { key: 'create_by', label: '创建人', type: 'text', immutable: true },
        ],
      },
      {
        id: 'cycle-status',
        title: '周期与状态评估',
        fields: [
          { key: 'create_time', label: '创建时间', type: 'text', immutable: true },
          { key: 'approval_date', label: '立项日期', type: 'date' },
          { key: 'planned_delivery', label: '计划交付日期', type: 'date' },
          { key: 'actual_delivery', label: '实际交付日期', type: 'date' },
          {
            key: 'health_score',
            label: '健康度',
            type: 'number',
            immutable: true,
            hint: '系统自动计算，不可手动修改',
          },
          { key: 'risk_level', label: '风险标识', type: 'select', options: RISK_LEVEL_OPTIONS },
        ],
      },
      {
        id: 'description-notes',
        title: '项目描述与备注',
        fields: [
          { key: 'description', label: '项目情况 / 备注', type: 'textarea', fullWidth: true },
          { key: 'references', label: '参考作品/竞品', type: 'text', fullWidth: true },
        ],
      },
    ],
  },
  {
    id: 'core',
    title: '技术制作信息',
    icon: VideoCameraOutlined,
    groups: [
      {
        id: 'spec-schedule',
        title: '规格体量与档期规划',
        fields: [
          { key: 'total_episodes', label: '总集数', type: 'number' },
          { key: 'episode_duration', label: '每集时长(分钟)', type: 'number' },
          { key: 'duration_minutes', label: '片长(分钟)', type: 'number' },
          { key: 'schedule', label: '项目档期', type: 'text' },
          { key: 'languages', label: '语言', type: 'text' },
          { key: 'resolution', label: '分辨率要求', type: 'select', options: RESOLUTION_OPTIONS },
          { key: 'frame_rate', label: '帧率', type: 'select', options: FRAME_RATE_OPTIONS },
          { key: 'budget', label: '总预算(万元)', type: 'number' },
        ],
      },
      {
        id: 'technical-assets',
        title: '制作技术与资产配置',
        fields: [
          { key: 'has_lip_sync', label: '是否含口型对白', type: 'select', options: YES_NO_OPTIONS },
          { key: 'has_digital_assets', label: '是否有数字资产', type: 'select', options: YES_NO_OPTIONS },
          { key: 'gen_model', label: '使用的生成模型', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'pipeline',
    title: '管线制作信息',
    icon: ThunderboltOutlined,
    groups: [
      {
        id: 'pipeline-config',
        title: '管线配置',
        fields: [
          { key: 'pipeline_steps', label: '工序链', type: 'text', immutable: true },
          { key: 'progress', label: '项目进度', type: 'text', immutable: true },
        ],
      },
      {
        id: 'production-progress',
        title: '生产进展',
        fields: [
          { key: 'shots_progress', label: '镜头完成', type: 'text', immutable: true },
          { key: 'todo_tasks', label: '待办任务', type: 'text', immutable: true },
          { key: 'member_count', label: '团队成员', type: 'text', immutable: true },
        ],
      },
    ],
  },
  {
    id: 'members',
    title: '项目成员',
    icon: TeamOutlined,
    groups: [],
  },
];

/** 参考库作用域选项（KK scopeOptions 同款） */
export const REFERENCE_SCOPE_OPTIONS = [
  { key: 'all', label: '全部资料' },
  { key: 'asset', label: '资产' },
  { key: 'script', label: '剧本' },
  { key: 'scene', label: '场次' },
  { key: 'shot', label: '镜头' },
] as const;

/** 参考库类型选项（KK kindOptions 同款） */
export const REFERENCE_KIND_OPTIONS = [
  { key: 'all', label: '全部类型' },
  { key: 'image', label: '图片' },
  { key: 'text', label: '文本' },
  { key: 'media', label: '音视频' },
] as const;

/** 各作用域下的模块分类（KK 由后端模块表驱动，演示版固定） */
export const REFERENCE_MODULES_BY_SCOPE: Record<string, string[]> = {
  asset: ['角色设定', '场景设定', '道具设定'],
  script: ['剧本正文', '世界观'],
  scene: ['场次资料'],
  shot: ['镜头参考'],
};

/** 参考库类型标签 */
export const REFERENCE_KIND_LABELS: Record<string, string> = {
  image: '图片',
  text: '文档',
  media: '音视频',
  other: '其他',
};

/** 设置页分组导航（KK ProjectSettings 分组结构的 AIGC 化） */
export const SETTINGS_MENU_GROUPS = [
  {
    key: 'canvas',
    label: '画布配置',
    children: [{ key: 'segments', label: '环节配置' }],
  },
  {
    key: 'pipeline',
    label: '管线配置',
    children: [{ key: 'pipelines', label: '管线管理' }],
  },
  {
    key: 'general',
    label: '通用配置',
    children: [{ key: 'project-info', label: '项目信息' }],
  },
] as const;

export type SettingsPanelKey = 'segments' | 'pipelines' | 'project-info';

/** 置顶字段持久化 key */
export const PRODUCTION_PINNED_STORAGE_KEY = 'aigc_studio_production_pinned_v1';

/** 侧栏折叠持久化 key */
export const DETAIL_SIDENAV_COLLAPSED_KEY = 'aigc_project_sidenav_collapsed';
