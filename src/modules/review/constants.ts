import { markRaw, type Component } from 'vue';
import {
  ArrowUpOutlined,
  BorderOutlined,
  ClearOutlined,
  FontSizeOutlined,
  HighlightOutlined,
} from '@ant-design/icons-vue';
import type {
  ReviewAssetTab,
  ReviewDrawTool,
  ReviewShotColorKey,
  ReviewShotRating,
  ReviewStatus,
  ReviewTimeDisplayMode,
} from './types';

/** 审片状态元数据 */
export const REVIEW_STATUS_META: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待审', color: 'var(--color-text-tertiary)', bg: 'var(--color-bg-hover)' },
  in_review: { label: '审片中', color: 'var(--color-feedback-warning)', bg: 'var(--color-fill-warning-subtle)' },
  approved: { label: '已通过', color: 'var(--color-feedback-success)', bg: 'var(--color-fill-success-subtle)' },
  rework: { label: '返工', color: 'var(--color-feedback-error)', bg: 'var(--color-fill-error-subtle)' },
};

/** 侧栏资产 Tab（对齐 KK：数字资产为开发中占位） */
export const REVIEW_ASSET_TABS: { key: ReviewAssetTab; label: string }[] = [
  { key: 'shot', label: '镜头' },
  { key: 'script', label: '剧本' },
  { key: 'digital', label: '数字资产' },
];

/** 圈注工具（对齐 KK 五工具；箭头图标旋转 45° 呈现斜向） */
export const REVIEW_DRAW_TOOLS: { key: ReviewDrawTool; label: string; icon: Component; rotate?: boolean }[] = [
  { key: 'pen', label: '画笔', icon: markRaw(HighlightOutlined) },
  { key: 'rect', label: '矩形框选', icon: markRaw(BorderOutlined) },
  { key: 'arrow', label: '箭头', icon: markRaw(ArrowUpOutlined), rotate: true },
  { key: 'text', label: '文字标注', icon: markRaw(FontSizeOutlined) },
  { key: 'eraser', label: '橡皮擦', icon: markRaw(ClearOutlined) },
];

/** 圈注色板（对齐 KK 五色，token 运行时解析） */
export const REVIEW_ANNOTATE_COLORS: { key: string; label: string; token: string }[] = [
  { key: 'error', label: '红色', token: 'var(--color-feedback-error)' },
  { key: 'warning', label: '黄色', token: 'var(--color-feedback-warning)' },
  { key: 'success', label: '绿色', token: 'var(--color-feedback-success)' },
  { key: 'info', label: '蓝色', token: 'var(--color-status-info)' },
  { key: 'muted', label: '灰色', token: 'var(--color-text-tertiary)' },
];

/** 时间显示模式选项 */
export const REVIEW_TIME_DISPLAY_OPTIONS: { key: ReviewTimeDisplayMode; label: string }[] = [
  { key: 'seconds', label: '秒(seconds)' },
  { key: 'timecode', label: '时间码(timecode)' },
  { key: 'frames', label: '帧(frames)' },
];

/** 快捷表情（对齐 KK 8 个快捷 emoji） */
export const REVIEW_QUICK_EMOJIS = ['👍', '🙏', '❤️', '😂', '🔥', '🎉', '✨', '👏'];

/** 镜头颜色分类（5 色圆点） */
export const REVIEW_SHOT_COLORS: { key: ReviewShotColorKey; label: string; color: string }[] = [
  { key: 'red', label: '红色', color: 'var(--color-feedback-error)' },
  { key: 'yellow', label: '黄色', color: 'var(--color-feedback-warning)' },
  { key: 'green', label: '绿色', color: 'var(--color-feedback-success)' },
  { key: 'blue', label: '蓝色', color: 'var(--color-status-info)' },
  { key: 'gray', label: '灰色', color: 'var(--color-text-tertiary)' },
];

/** 镜头评级档位 */
export const REVIEW_SHOT_RATINGS: ReviewShotRating[] = ['S', 'A', 'B', 'C', 'N'];

/** 评论筛选：时间范围 */
export const REVIEW_COMMENT_TIME_FILTERS = [
  { key: 'all', label: '全部时间' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '近 7 天' },
  { key: 'month', label: '近 30 天' },
] as const;

export type ReviewCommentTimeFilter = (typeof REVIEW_COMMENT_TIME_FILTERS)[number]['key'];
