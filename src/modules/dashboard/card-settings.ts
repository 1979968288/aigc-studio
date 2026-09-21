import type { LayoutCard } from './types';
import { cardMetaList, GRID_COLS, DASHBOARD_LAYOUT_STORAGE_KEY } from './constants';

/**
 * 卡片可见性与布局持久化（对齐 KK dashboard-card-settings）
 * 布局仅存 localStorage（演示模式无远端偏好 API）。
 */

export interface StoredDashboardLayout {
  version: number;
  visibility: Record<string, boolean>;
  layout: LayoutCard[];
  updatedAt: string;
}

export function createDefaultVisibility(): Record<string, boolean> {
  return Object.fromEntries(cardMetaList.map((meta) => [meta.id, true]));
}

/**
 * KK packLayout 同款贪心装箱：逐卡选择能放置的最靠上位置，
 * 用于默认布局生成与隐藏卡片后的垂直紧缩。
 */
export function packLayout(items: LayoutCard[]): LayoutCard[] {
  const heights = Array<number>(GRID_COLS).fill(0);

  for (const item of items) {
    const width = Math.min(item.w, GRID_COLS);
    let bestX = 0;
    let bestY = Number.POSITIVE_INFINITY;

    for (let x = 0; x <= GRID_COLS - width; x += 1) {
      let top = 0;
      for (let offset = 0; offset < width; offset += 1) {
        top = Math.max(top, heights[x + offset] ?? 0);
      }
      if (top < bestY || (top === bestY && x < bestX)) {
        bestX = x;
        bestY = top;
      }
    }

    item.x = bestX;
    item.y = bestY;
    for (let offset = 0; offset < width; offset += 1) {
      heights[bestX + offset] = bestY + item.h;
    }
  }
  return items;
}

/** 默认布局：各卡按元数据默认尺寸装箱（KK createDefaultLayout 同款） */
export function createDefaultLayout(): LayoutCard[] {
  return packLayout(
    cardMetaList.map((meta) => ({
      i: meta.id,
      x: 0,
      y: 0,
      w: meta.defaultW,
      h: meta.defaultH,
    }))
  );
}

export function readStoredDashboardLayout(): StoredDashboardLayout | null {
  try {
    const raw = localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDashboardLayout>;
    if (!parsed || !Array.isArray(parsed.layout)) return null;
    return {
      version: typeof parsed.version === 'number' ? parsed.version : 1,
      visibility:
        parsed.visibility && typeof parsed.visibility === 'object'
          ? normalizeVisibility(parsed.visibility)
          : createDefaultVisibility(),
      layout: parsed.layout.filter(
        (item): item is LayoutCard => !!item && typeof item.i === 'string'
      ),
      updatedAt:
        typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeStoredDashboardLayout(
  layout: LayoutCard[],
  visibility: Record<string, boolean>
): void {
  const payload: StoredDashboardLayout = {
    version: 1,
    visibility,
    layout,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(payload));
}

export function clearStoredDashboardLayout(): void {
  localStorage.removeItem(DASHBOARD_LAYOUT_STORAGE_KEY);
}

export function normalizeVisibility(value: Record<string, unknown>): Record<string, boolean> {
  const next = createDefaultVisibility();
  for (const key of Object.keys(next)) {
    if (typeof value[key] === 'boolean') {
      next[key] = value[key];
    }
  }
  return next;
}

/** 存储的布局与当前卡片元数据合并：新增卡片装箱追加，移除的卡片剔除 */
export function mergeLayoutWithMeta(stored: LayoutCard[]): LayoutCard[] {
  const valid = stored.filter((item) => cardMetaList.some((meta) => meta.id === item.i));
  const missing = cardMetaList
    .filter((meta) => !valid.some((item) => item.i === meta.id))
    .map((meta) => ({ i: meta.id, x: 0, y: 0, w: meta.defaultW, h: meta.defaultH }));
  return packLayout([...valid, ...missing]);
}
