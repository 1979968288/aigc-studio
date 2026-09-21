import {
  isNavigationFailure,
  NavigationFailureType,
  type RouteLocationNormalizedLoaded,
  type Router,
} from 'vue-router';
import {
  dedupeTabsByTabKey,
  readWorkbenchTabsStorage,
  resolveRouteByPath,
  resolveTabKey,
  shouldTrackWorkbenchTab,
  sortWorkbenchTabs,
  toTab,
  trimTabsToMax,
  writeWorkbenchTabsStorage,
  type WorkbenchTabItem,
} from './workbenchTabUtils';

/**
 * 工作台标签页控制器（对齐 KMOKE useWorkbenchTabs，裁剪项目域逻辑）
 *
 * 职责：
 * - 跟由路由变化维护 visitedTabs（去重按 tabKey）
 * - 关闭左侧/右侧/其他/全部（固定标签不可关）
 * - 重载当前标签（内容区重挂载）
 * - 标签持久化与恢复
 * - 输出 keep-alive include 的路由名集合
 */
export function useWorkbenchTabs(
  route: RouteLocationNormalizedLoaded,
  router: Router
) {
  const storedTabs = ref<WorkbenchTabItem[]>([]);
  const activeTabKey = ref(route.fullPath);
  /** 重载计数：变更时当前路由组件重建 */
  const reloadCounter = ref(0);

  const persistTabs = (): void => {
    writeWorkbenchTabsStorage(storedTabs.value, activeTabKey.value);
  };

  const cacheableRouteNames = computed(() =>
    storedTabs.value
      .filter((tab) => tab.keepAlive && tab.name && tab.tabKey !== activeTabKey.value)
      .map((tab) => tab.name as string)
  );

  /** 当前路由组件的挂载 key（fullPath + 重载计数） */
  const routeViewKey = computed(() => `${route.fullPath}::${reloadCounter.value}`);

  const pushTabRoute = async (targetPath: string): Promise<void> => {
    const target = storedTabs.value.find((item) => item.fullPath === targetPath);
    if (!target) return;

    const previousActiveTabKey = activeTabKey.value;
    activeTabKey.value = target.fullPath;
    try {
      const failure = await router.push(target.fullPath);
      if (failure && !isNavigationFailure(failure, NavigationFailureType.duplicated)) {
        activeTabKey.value = previousActiveTabKey;
      }
    } catch (error) {
      activeTabKey.value = previousActiveTabKey;
      console.error(error);
    }
  };

  const syncFromRoute = (currentRoute: RouteLocationNormalizedLoaded): void => {
    if (!shouldTrackWorkbenchTab(currentRoute)) {
      activeTabKey.value = currentRoute.fullPath;
      return;
    }

    const tab = toTab(currentRoute);
    const existingIndex = storedTabs.value.findIndex((item) => item.tabKey === tab.tabKey);
    if (existingIndex >= 0) {
      const existing = storedTabs.value[existingIndex];
      existing.tabKey = tab.tabKey;
      existing.fullPath = tab.fullPath;
      existing.path = tab.path;
      existing.name = tab.name;
      existing.title = tab.title;
      existing.moduleTitle = tab.moduleTitle;
      existing.affix = tab.affix;
      existing.keepAlive = tab.keepAlive;
      existing.group = tab.group;
      existing.fixedOrder = tab.fixedOrder;
    } else {
      storedTabs.value.push(tab);
    }

    storedTabs.value = trimTabsToMax(sortWorkbenchTabs(dedupeTabsByTabKey(storedTabs.value)));
    activeTabKey.value = tab.fullPath;
    persistTabs();
  };

  const restoreTabs = (): void => {
    // 固定标签始终存在
    const affixRoutes = router
      .getRoutes()
      .filter((item) => item.meta.affix === true)
      .map((item) => {
        const fullPath = item.path.startsWith('/') ? item.path : `/${item.path}`;
        const resolved = router.resolve(fullPath) as RouteLocationNormalizedLoaded;
        return toTab(resolved);
      });

    const persisted = readWorkbenchTabsStorage();
    if (!persisted) {
      storedTabs.value = sortWorkbenchTabs(dedupeTabsByTabKey(affixRoutes));
      return;
    }

    const restoredTabs: WorkbenchTabItem[] = [];
    for (const tab of persisted.visitedTabs ?? []) {
      if (!tab || typeof tab.fullPath !== 'string') continue;
      const resolved = resolveRouteByPath(router, tab.fullPath);
      if (!resolved || !shouldTrackWorkbenchTab(resolved)) continue;
      const fallback = toTab(resolved);
      restoredTabs.push({
        ...fallback,
        fullPath: tab.fullPath,
      });
    }

    storedTabs.value = trimTabsToMax(
      sortWorkbenchTabs(dedupeTabsByTabKey([...affixRoutes, ...restoredTabs]))
    );

    if (persisted.activeTabKey) {
      const matched = storedTabs.value.find((item) => item.fullPath === persisted.activeTabKey);
      if (matched) {
        activeTabKey.value = matched.fullPath;
      }
    }
  };

  const navigateToTab = (fullPath: string): void => {
    void pushTabRoute(fullPath);
  };

  const removeTab = (fullPath: string): void => {
    const index = storedTabs.value.findIndex((item) => item.fullPath === fullPath);
    if (index < 0) return;
    const target = storedTabs.value[index];
    if (!target || target.affix) return;

    storedTabs.value.splice(index, 1);
    if (activeTabKey.value === target.fullPath) {
      const next = storedTabs.value[index] || storedTabs.value[index - 1] || storedTabs.value[0];
      if (next) {
        void pushTabRoute(next.fullPath);
      }
    }
    persistTabs();
  };

  const ensureActiveTab = (preferredTabPath: string): void => {
    const exists = storedTabs.value.some((item) => item.fullPath === activeTabKey.value);
    if (exists) return;
    const next =
      storedTabs.value.find((item) => item.fullPath === preferredTabPath) ||
      storedTabs.value[0];
    if (next) {
      void pushTabRoute(next.fullPath);
    }
  };

  const closeOthers = (targetPath = activeTabKey.value): void => {
    const target = storedTabs.value.find(
      (item) => item.fullPath === targetPath || resolveRouteTabKey(item) === resolveRouteTabKey({ fullPath: targetPath } as WorkbenchTabItem)
    );
    if (!target) return;
    storedTabs.value = sortWorkbenchTabs(
      storedTabs.value.filter((tab) => tab.affix || tab.tabKey === target.tabKey)
    );
    ensureActiveTab(target.fullPath);
    persistTabs();
  };

  const closeLeft = (targetPath = activeTabKey.value): void => {
    const index = storedTabs.value.findIndex((item) => item.fullPath === targetPath);
    if (index < 0) return;
    storedTabs.value = sortWorkbenchTabs(
      storedTabs.value.filter((tab, tabIndex) => tab.affix || tabIndex >= index)
    );
    ensureActiveTab(targetPath);
    persistTabs();
  };

  const closeRight = (targetPath = activeTabKey.value): void => {
    const index = storedTabs.value.findIndex((item) => item.fullPath === targetPath);
    if (index < 0) return;
    storedTabs.value = sortWorkbenchTabs(
      storedTabs.value.filter((tab, tabIndex) => tab.affix || tabIndex <= index)
    );
    ensureActiveTab(targetPath);
    persistTabs();
  };

  const closeAll = (): void => {
    const affixTabs = storedTabs.value.filter((tab) => tab.affix);
    storedTabs.value = sortWorkbenchTabs(affixTabs);
    const fallback = storedTabs.value[0];
    if (fallback) {
      void pushTabRoute(fallback.fullPath);
    }
    persistTabs();
  };

  const reloadTab = (targetPath = activeTabKey.value): void => {
    if (route.fullPath === targetPath) {
      reloadCounter.value += 1;
    }
  };

  // 辅助：按 fullPath 反查 tabKey（用于 closeOthers 的身份匹配）
  function resolveRouteTabKey(item: Pick<WorkbenchTabItem, 'fullPath'>): string {
    const resolved = resolveRouteByPath(router, item.fullPath);
    return resolved ? resolveTabKey(resolved) : item.fullPath;
  }

  restoreTabs();
  syncFromRoute(route);
  watch(
    () => route.fullPath,
    () => syncFromRoute(route)
  );

  return {
    visitedTabs: storedTabs,
    activeTabKey,
    cacheableRouteNames,
    routeViewKey,
    navigateToTab,
    removeTab,
    closeLeft,
    closeRight,
    closeOthers,
    closeAll,
    reloadTab,
  };
}
