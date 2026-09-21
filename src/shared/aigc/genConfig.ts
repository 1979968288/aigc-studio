/**
 * AIGC 生成配方公共配置
 *
 * 生成配方 = 任务提交时记录的最小生成数据：提示词 / 参考图 / 所用模型。
 * 制作工坊（镜头任务）与我的任务（分类任务）共用本配置，避免两处漂移。
 */

/** 生成模型分组（图像 / 视频 / 音频） */
export interface GenModelGroup {
  label: string;
  options: { value: string; label: string }[];
}

export const GEN_MODEL_GROUPS: GenModelGroup[] = [
  {
    label: '图像模型',
    options: [
      { value: 'Midjourney V7', label: 'Midjourney V7' },
      { value: 'Flux 1.1 Pro', label: 'Flux 1.1 Pro' },
      { value: 'Stable Diffusion 3.5', label: 'Stable Diffusion 3.5' },
      { value: 'Seedream 3.0', label: 'Seedream 3.0（即梦）' },
      { value: 'Kolors 2.0', label: 'Kolors 2.0（可图）' },
    ],
  },
  {
    label: '视频模型',
    options: [
      { value: 'Kling 1.6', label: 'Kling 1.6（可灵）' },
      { value: 'Seedance 1.0', label: 'Seedance 1.0（即梦）' },
      { value: 'Runway Gen-4', label: 'Runway Gen-4' },
      { value: 'Luma Dream Machine', label: 'Luma Dream Machine' },
      { value: 'Vidu 2.0', label: 'Vidu 2.0' },
    ],
  },
  {
    label: '音频 / 口型模型',
    options: [
      { value: 'Kling LipSync', label: 'Kling LipSync（对口型）' },
      { value: 'ElevenLabs V3', label: 'ElevenLabs V3（配音）' },
      { value: 'Suno V4', label: 'Suno V4（配乐）' },
    ],
  },
];

/** 扁平模型选项（供普通下拉使用） */
export const GEN_MODEL_OPTIONS = GEN_MODEL_GROUPS.flatMap((group) => group.options);

/** 模型值 → 展示名（未知值原样返回） */
export function genModelLabel(value?: string): string {
  if (!value) return '';
  return GEN_MODEL_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
