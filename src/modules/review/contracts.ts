import type { ReviewComment, ReviewCommentMarker, ReviewTimeline } from './types';

/**
 * 审片室契约层（对齐 KK contracts.ts）：
 * - 时间码格式 HH:MM:SS:FF，小时位自带 +1 偏移（0 秒显示为 01:00:00:00）
 * - 时间轴 = 视频真实时长（1:1），评论时间戳/seek 均基于真实秒数
 */

export const TIMELINE_DEFAULT_DURATION = 90;
export const RAIL_PIXELS_PER_SECONDS = 30;
export const RAIL_RULER_STEP_SECONDS = 5;
export const ANNOTATION_TIME_TOLERANCE_SECONDS = 0.25;
export const DEFAULT_FRAME_RATE = 24;

/** 秒 → 帧 */
export function secondsToFrame(seconds: number, frameRate: number = DEFAULT_FRAME_RATE): number {
  return Math.round(seconds * frameRate);
}

/** 帧 → 秒 */
export function frameToSeconds(frame: number, frameRate: number = DEFAULT_FRAME_RATE): number {
  return frame / frameRate;
}

/** 秒 → 时间码 HH:MM:SS:FF（带 +1 小时偏移，对齐 KK） */
export function formatReviewTimecode(seconds: number, frameRate: number = DEFAULT_FRAME_RATE): string {
  const totalSeconds = 3600 + Math.max(0, seconds);
  const whole = Math.floor(totalSeconds);
  const frames = Math.floor((totalSeconds - whole) * frameRate);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(frames)}`;
}

/** 时间码 → 秒（hours>=1 时减回 3600 偏移） */
export function parseReviewTimecode(timecode: string, frameRate: number = DEFAULT_FRAME_RATE): number | null {
  const match = /^(\d{2}):(\d{2}):(\d{2}):(\d{2})$/.exec(timecode.trim());
  if (!match) return null;
  const [, hh, mm, ss, ff] = match;
  const hours = Number(hh);
  const seconds = hours * 3600 + Number(mm) * 60 + Number(ss) + Number(ff) / frameRate;
  return hours >= 1 ? seconds - 3600 : seconds;
}

/** 时间码搜索输入归一化：8 位纯数字 → HH:MM:SS:FF */
export function normalizeReviewTimecodeInput(input: string): string {
  const trimmed = input.trim();
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 2)}:${trimmed.slice(2, 4)}:${trimmed.slice(4, 6)}:${trimmed.slice(6, 8)}`;
  }
  return trimmed;
}

/** 秒 → MM:SS 显示 */
export function formatReviewSeconds(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 刻度尺标签 00:MM:SS */
export function formatRulerLabel(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `00:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 评论的绑定秒数（兜底：16 + index*8，对齐 KK commentSeconds） */
export function commentSeconds(comment: ReviewComment, index: number): number {
  return comment.timeSeconds ?? 16 + index * 8;
}

/** 评论时间码 */
export function commentTimecode(comment: ReviewComment, index: number): string {
  return formatReviewTimecode(commentSeconds(comment, index));
}

/** 视频画面评论标记（对齐 KK createCommentMarkers） */
export function createCommentMarkers(comments: ReviewComment[], duration: number): ReviewCommentMarker[] {
  const safeDuration = duration > 0 ? duration : TIMELINE_DEFAULT_DURATION;
  return comments.map((comment, index) => {
    const seconds = commentSeconds(comment, index);
    const ratio = seconds / safeDuration;
    return {
      comment,
      index,
      timecode: formatReviewTimecode(seconds),
      left: Math.min(98, Math.max(2, ratio * 100)),
      align: ratio < 0.22 ? 'left' : ratio > 0.78 ? 'right' : 'center',
    };
  });
}

/** 鸟瞰图刻度（5s 步进，标签最小间距去重，对齐 KK overviewRulerMarks） */
export interface RulerMark {
  seconds: number;
  left: number;
  label: string;
}

export function createOverviewRulerMarks(duration: number): RulerMark[] {
  const marks: RulerMark[] = [];
  const step = RAIL_RULER_STEP_SECONDS;
  for (let t = 0; t <= duration; t += step) {
    marks.push({ seconds: t, left: (t / duration) * 100, label: formatRulerLabel(t) });
  }
  // 标签最小间距约 15% 去重，避免拥挤
  return marks.filter((mark, index) => index % 3 === 0 || index === marks.length - 1);
}

/** 轨道刻度（5s 步进，像素定位；pps 支持缩放） */
export function createLocalRulerMarks(
  duration: number,
  pps: number = RAIL_PIXELS_PER_SECONDS
): { seconds: number; x: number; label: string }[] {
  const marks: { seconds: number; x: number; label: string }[] = [];
  for (let t = 0; t <= duration; t += RAIL_RULER_STEP_SECONDS) {
    marks.push({ seconds: t, x: t * pps, label: formatRulerLabel(t) });
  }
  return marks;
}

/** 轨道播放头居中滚动：railLeft 计算（对齐 KK syncTimelineViewport；pps 支持缩放） */
export function clampRailLeft(
  playSeconds: number,
  visibleWidth: number,
  duration: number,
  pps: number = RAIL_PIXELS_PER_SECONDS
): number {
  const railWidth = duration * pps;
  const maxRailLeft = Math.max(0, railWidth - visibleWidth);
  const ideal = visibleWidth / 2 - playSeconds * pps;
  return Math.min(0, Math.max(-maxRailLeft, ideal));
}

/** 当前播放所在的 clip */
export function activeClipOf(timeline: ReviewTimeline | null, seconds: number) {
  if (!timeline) return null;
  return timeline.clips.find((clip) => seconds >= clip.startSec && seconds < clip.endSec) ?? null;
}
