import type { ReviewAnnotationShape, ReviewAnnotationSnapshot } from './types';

/**
 * 圈注坐标归一化契约（对齐 KK annotation-contracts.ts）：
 * 存储前把像素坐标归一化为 0~1 相对坐标并记录画面尺寸，
 * 回显时按当前画面尺寸反归一化，圈注可随窗口缩放正确还原。
 */

const POINT_KEYS = new Set(['points']);
const X_KEYS = new Set(['x', 'width']);
const Y_KEYS = new Set(['y', 'height']);

/** 归一化单个图形 config（像素 → 0~1） */
export function normalizeAnnotationConfig(
  config: Record<string, unknown>,
  mediaWidth: number,
  mediaHeight: number
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (POINT_KEYS.has(key) && Array.isArray(value)) {
      next[key] = value.map((point, index) =>
        typeof point === 'number'
          ? index % 2 === 0
            ? point / mediaWidth
            : point / mediaHeight
          : point
      );
    } else if (X_KEYS.has(key) && typeof value === 'number') {
      next[key] = value / mediaWidth;
    } else if (Y_KEYS.has(key) && typeof value === 'number') {
      next[key] = value / mediaHeight;
    } else {
      next[key] = value;
    }
  }
  return next;
}

/** 反归一化单个图形 config（0~1 → 当前画面像素） */
export function denormalizeAnnotationConfig(
  config: Record<string, unknown>,
  mediaWidth: number,
  mediaHeight: number
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (POINT_KEYS.has(key) && Array.isArray(value)) {
      next[key] = value.map((point, index) =>
        typeof point === 'number'
          ? index % 2 === 0
            ? point * mediaWidth
            : point * mediaHeight
          : point
      );
    } else if (X_KEYS.has(key) && typeof value === 'number') {
      next[key] = value * mediaWidth;
    } else if (Y_KEYS.has(key) && typeof value === 'number') {
      next[key] = value * mediaHeight;
    } else {
      next[key] = value;
    }
  }
  return next;
}

/** 由内存态图形生成归一化快照 */
export function createAnnotationSnapshot(
  shapes: ReviewAnnotationShape[],
  mediaWidth: number,
  mediaHeight: number
): ReviewAnnotationSnapshot {
  return {
    media_width: mediaWidth,
    media_height: mediaHeight,
    shapes: shapes.map((shape) => ({
      ...shape,
      config: normalizeAnnotationConfig(shape.config, mediaWidth, mediaHeight),
    })),
  };
}

/** 快照还原为当前画面下的内存态图形 */
export function restoreAnnotationSnapshot(
  snapshot: ReviewAnnotationSnapshot,
  viewportWidth: number,
  viewportHeight: number
): ReviewAnnotationShape[] {
  return snapshot.shapes.map((shape) => ({
    ...shape,
    config: denormalizeAnnotationConfig(shape.config, viewportWidth, viewportHeight),
  }));
}
