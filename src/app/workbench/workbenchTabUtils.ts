import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';

/**
 * 工作台标签页模型与工具（对齐 KMOKE WorkbenchTab 体系）
 *
 * - tabKey：标签唯一身份（决定"新开标签"还是"复用标签"）
 * - group：home（工作台，固定）/ global-fixed（全局固定）/ normal（普通标签）
 * - affix：固定标签，不可关闭
 * - keepAlive：路由名进入 keep-alive include 列表
 * - 持久化到 localStorage，刷新后标签恢复
 */

export type WorkbenchTabGroup = 'home' | 'global-fixed' | 'project' | 'normal';

export interface WorkbenchTabItem {
  tabKey: string;
  fullPath: string;
  path: string;
  name?: string;
  title: string;
  moduleTitle?: string;
  affix: boolean;
  keepAlive: boolean;
  group: WorkbenchTabGroup;
  fixedOrder?: number;
}

export interface PersistedWorkbenchTabsState {
  visitedTabs?: Array<Partial<WorkbenchTabItem> & Pick<WorkbenchTabItem, 'fullPath'>>;
  activeTabKey?: string;
}

const STORAGE_KEY = 'aigc_studio_workbench_tabs_v1';
const MAX_WORKBENCH_TABS = 12;

export function normalizeRouteName(name: RouteLocationNormalizedLoaded['name']): string | undefined {
  if (!name) return undefined;
  return typeof name === 'string' ? name : String(name);
}

function resolveTabTitle(route: RouteLocationNormalizedLoaded): string {
  // 项目类页面：标签标题用项目名（对齐 KK updateProjectName，项目名经 query.name 传递）
  const queryName = typeof route.query.name === 'string' ? route.query.name.trim() : '';
  if (queryName && /^\/projects\/[^/]+\//.test(route.path)) {
    return queryName;
  }
  const tabTitle = typeof route.meta.tabTitle === 'string' ? route.meta.tabTitle.trim() : '';
  if (tabTitle) return tabTitle;
  const title = typeof route.meta.title === 'string' ? route.meta.title.trim() : '';
  return title || route.path;
}

function resolveModuleTitle(route: RouteLocationNormalizedLoaded): string | undefined {
  const moduleTitle =
    typeof route.meta.moduleTitle === 'string' ? route.meta.moduleTitle.trim() : '';
  return moduleTitle || undefined;
}

function resolveTabGroup(route: RouteLocationNormalizedLoaded): WorkbenchTabGroup {
  const group = route.meta.workbenchTabGroup;
  if (
    group === 'home' ||
    group === 'global-fixed' ||
    group === 'project' ||
    group === 'normal'
  ) {
    return group;
  }
  return 'normal';
}

function resolveFixedOrder(route: RouteLocationNormalizedLoaded): number | undefined {
  return typeof route.meta.workbenchTabFixedOrder === 'number'
    ? route.meta.workbenchTabFixedOrder
    : undefined;
}

export function shouldTrackWorkbenchTab(route: RouteLocationNormalizedLoaded): boolean {
  return route.meta.hideWorkbenchTab !== true;
}

export function resolveTabKey(route: RouteLocationNormalizedLoaded): string {
  const group = resolveTabGroup(route);
  if (group === 'home') return 'home';
  if (group === 'global-fixed') {
    return ['global', normalizeRouteName(route.name) ?? route.path].join(':');
  }
  // 项目域页面（详情/镜头线/资产线/数据清单）归并为同一标签：
  // 一个项目 = 顶栏一个标签，子页面在项目标签内部切换（对齐 KK）
  if (group === 'project') {
    const projectMatch = /^\/projects\/([^/]+)/.exec(route.path);
    if (projectMatch) return `project:${projectMatch[1]}`;
  }
  return `fullPath:${route.fullPath}`;
}

export function toTab(route: RouteLocationNormalizedLoaded): WorkbenchTabItem {
  return {
    tabKey: resolveTabKey(route),
    fullPath: route.fullPath,
    path: route.path,
    name: normalizeRouteName(route.name),
    title: resolveTabTitle(route),
    moduleTitle: resolveModuleTitle(route),
    affix: route.meta.affix === true,
    keepAlive: route.meta.keepAlive === true,
    group: resolveTabGroup(route),
    fixedOrder: resolveFixedOrder(route),
  };
}

export function resolveRouteByPath(
  router: Router,
  fullPath: string
): RouteLocationNormalizedLoaded | null {
  const resolved = router.resolve(fullPath) as RouteLocationNormalizedLoaded;
  if (!resolved.matched || resolved.matched.length === 0) return null;
  return resolved;
}

export function dedupeTabsByTabKey(tabs: WorkbenchTabItem[]): WorkbenchTabItem[] {
  const map = new Map<string, WorkbenchTabItem>();
  for (const tab of tabs) {
    map.set(tab.tabKey, tab);
  }
  return Array.from(map.values());
}

/** 超出上限时从最早的普通标签开始裁剪（固定/工作台标签不裁） */
export function trimTabsToMax(tabs: WorkbenchTabItem[]): WorkbenchTabItem[] {
  const nextTabs = [...tabs];
  while (nextTabs.length > MAX_WORKBENCH_TABS) {
    const firstClosableIndex = nextTabs.findIndex(
      (tab) => !tab.affix && tab.group === 'normal'
    );
    if (firstClosableIndex < 0) break;
    nextTabs.splice(firstClosableIndex, 1);
  }
  return nextTabs;
}

/** 排序：home/affix 在前 → global-fixed（按 fixedOrder）→ 普通标签（保持访问顺序） */
export function sortWorkbenchTabs(tabs: WorkbenchTabItem[]): WorkbenchTabItem[] {
  const homeTabs = tabs.filter((tab) => tab.affix || tab.group === 'home');
  const homeKeys = new Set(homeTabs.map((tab) => tab.tabKey));
  const globalTabs = tabs
    .filter((tab) => !homeKeys.has(tab.tabKey) && tab.group === 'global-fixed')
    .sort((a, b) => (a.fixedOrder ?? 999) - (b.fixedOrder ?? 999));
  const globalKeys = new Set(globalTabs.map((tab) => tab.tabKey));
  const otherTabs = tabs.filter((tab) => !homeKeys.has(tab.tabKey) && !globalKeys.has(tab.tabKey));
  return [...homeTabs, ...globalTabs, ...otherTabs];
}

export function writeWorkbenchTabsStorage(
  visitedTabs: WorkbenchTabItem[],
  activeTabKey: string
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ visitedTabs, activeTabKey } satisfies PersistedWorkbenchTabsState)
  );
}

export function readWorkbenchTabsStorage(): PersistedWorkbenchTabsState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedWorkbenchTabsState) : null;
  } catch {
    return null;
  }
}

export function clearWorkbenchTabsStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildWorkbenchTabShareUrl(fullPath: string, origin?: string): string {
  const baseOrigin =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  return new URL(fullPath, baseOrigin).toString();
}
