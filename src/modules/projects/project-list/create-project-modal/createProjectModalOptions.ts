import type { CSSProperties } from 'vue';

/** 创建项目弹窗步骤定义（对齐 KK CREATE_PROJECT_STEPS） */
export const CREATE_PROJECT_STEPS = [
  { key: 1, title: '系统模板', subtitle: '需求池与模板' },
  { key: 2, title: '配置环节负责人', subtitle: '环节负责人映射' },
  { key: 3, title: '基础信息', subtitle: '项目基础信息' },
  { key: 4, title: '技术配置', subtitle: '技术与资产配置' },
] as const;

/** 测试标签选项（对齐 KK TEST_LABEL_OPTIONS） */
export const TEST_LABEL_OPTIONS = [
  { label: '研发测试', value: 'technical_test' },
  { label: '业务测试', value: 'business_test' },
  { label: '无', value: 'none' },
] as const;

/** 业务类型选项（对齐 KK BUSINESS_TYPE_OPTIONS） */
export const BUSINESS_TYPE_OPTIONS = [
  { label: '商业项目', value: 0 },
  { label: '内部项目', value: 1 },
] as const;

/** 项目级别选项 */
export const PROJECT_LEVEL_OPTIONS = [
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
] as const;

/** 语言选项（对齐 KK PROJECT_LANGUAGE_OPTIONS 的演示版） */
export const LANGUAGE_OPTIONS = [
  { label: '中文', value: '中文' },
  { label: '英文', value: '英文' },
  { label: '双语', value: '中英双语' },
] as const;

/** 分辨率选项 */
export const RESOLUTION_OPTIONS = [
  { label: '4K', value: '4K' },
  { label: '2K', value: '2K' },
  { label: '1080P', value: '1080P' },
  { label: '720P', value: '720P' },
] as const;

/** 帧率选项 */
export const FRAME_RATE_OPTIONS = [
  { label: '24fps', value: '24fps' },
  { label: '25fps', value: '25fps' },
  { label: '30fps', value: '30fps' },
  { label: '60fps', value: '60fps' },
] as const;

/** AIGC 项目类型（Step1 类型切换，含主题色） */
export const PROJECT_TYPES = [
  { id: 'short', name: '短片', color: '#0055ff', description: '3-15 分钟叙事短片' },
  { id: 'tvc', name: 'TVC', color: '#0ea5e9', description: '15-60 秒商业广告' },
  { id: 'anime', name: '漫剧', color: '#f97316', description: '多集连载动画剧' },
  { id: 'demo', name: '演示视频', color: '#22c55e', description: '产品演示与说明' },
  { id: 'promo', name: '宣传片', color: '#ec4899', description: '品牌宣传与发布会' },
] as const;

/** Step1 可选模板（管线模板映射为带类型/封面属性的模板卡） */
export interface StepTemplateCard {
  id: string;
  name: string;
  description: string;
  /** 所属项目类型 id（PROJECT_TYPES） */
  projectTypeId: string;
  projectTypeName: string;
  projectTypeColor: string;
  isDefault: boolean;
  /** 工序链展示 */
  steps: string[];
}

/** 生成模型选项（映射 KK 主要使用引擎） */
export const GEN_MODEL_OPTIONS = [
  { label: 'SDXL', value: 'SDXL' },
  { label: 'SDXL + AnimateDiff', value: 'SDXL + AnimateDiff' },
  { label: 'SDXL + Wav2Lip', value: 'SDXL + Wav2Lip' },
  { label: 'Flux', value: 'Flux' },
  { label: '未定', value: '' },
] as const;

export const NO_ENGINE_OPTION_VALUE = '';

/** Step4 制作需求卡（映射 KK PROJECT_TOGGLE_CARDS） */
export const PROJECT_TOGGLE_CARDS = [
  {
    key: 'hasLipSync',
    field: 'has_lip_sync',
    label: '口型对白需求',
    description: '角色对白口型驱动生成',
    tone: 'purple',
  },
  {
    key: 'hasDigitalAssets',
    field: 'has_digital_assets',
    label: '数字资产需求',
    description: '角色、场景等设定资产',
    tone: 'blue',
  },
  {
    key: 'hasAiVoice',
    field: 'has_ai_voice',
    label: 'AI 配音需求',
    description: '语音合成与音色克隆',
    tone: 'green',
  },
  {
    key: 'hasDigitalHuman',
    field: 'has_digital_human',
    label: '数字人需求',
    description: '讲师/主播形象驱动',
    tone: 'orange',
  },
  {
    key: 'hasStyleLora',
    field: 'has_style_lora',
    label: '风格模型训练',
    description: '风格 LoRA 训练与调优',
    tone: 'cyan',
  },
] as const;

/** 项目类型 pill / 卡片主题色注入（对齐 KK projectTypeToneStyle） */
export function projectTypeToneStyle(color?: string | null): CSSProperties {
  return {
    '--template-project-type-color': color?.trim() || 'var(--color-action-primary)',
  } as CSSProperties;
}
