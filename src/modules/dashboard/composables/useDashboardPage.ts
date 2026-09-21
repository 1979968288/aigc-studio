import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { GRID_COLS, ROW_HEIGHT, cardMetaList } from '../constants';
import { useDashboardLayout } from './useDashboardLayout';
import {
  useDashboardProjects,
  useDashboardTasks,
  useDashboardApprovals,
  useDashboardGlobalProductionBoard,
  useDashboardShortcuts,
} from './useDashboardData';
import type { LayoutCard, VisibleLayoutCard } from '../types';

/**
 * 首页总编排（对齐 KK useDashboardPage）：
 * 聚合布局与各卡片数据 composable；按卡片可见性决定加载哪些数据。
 */
export function useDashboardPage() {
  const router = useRouter();

  const {
    layout,
    visibility,
    visibleCards,
    showDashboardCardEmpty,
    isPopupMode,
    initLayout,
    initPopupMode,
    setCardVisible,
    resetLayoutToDefault,
  } = useDashboardLayout();

  const {
    watchProjects,
    projectItems,
    loadingWatch,
    loadingProjects,
    loadWatch,
    loadProjects,
  } = useDashboardProjects();

  const { taskItems, loadingTasks, loadTasks } = useDashboardTasks();

  const { approvalItems, approvalSummaries, loadingApprovals, loadApprovals } =
    useDashboardApprovals();

  const {
    globalProductionBoardLanes,
    loadingGlobalProductionBoard,
    loadGlobalProductionBoard,
  } = useDashboardGlobalProductionBoard();

  const {
    shortcutItems,
    loadingShortcuts,
    loadShortcuts,
    removeShortcutById,
    addShortcutByRoute,
  } = useDashboardShortcuts();

  const visibilityOptions = computed(() =>
    cardMetaList.map((meta) => ({
      id: meta.id,
      title: meta.title,
      visible: visibility.value[meta.id] === true,
    }))
  );

  const shouldLoadCard = (cardId: string): boolean =>
    visibleCards.value.some((card) => card.i === cardId);

  function goTo(routeTarget?: string): void {
    if (routeTarget) {
      void router.push(routeTarget);
    }
  }

  function openCardInWindow(card: VisibleLayoutCard): void {
    if (isPopupMode.value) return;
    const url = `${window.location.origin}/dashboard?cardId=${card.i}&cardType=${card.meta.type}&popup=1`;
    const width = 900;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes`;
    window.open(url, '_blank', features);
  }

  function updateLayout(nextLayout: LayoutCard[]): void {
    const updates = new Map(nextLayout.map((item) => [item.i, item]));
    layout.value = layout.value.map((item) => {
      const updated = updates.get(item.i);
      return updated ? { ...item, ...updated } : item;
    });
  }

  async function loadDashboardData(): Promise<void> {
    const tasks: Array<Promise<unknown>> = [];
    if (shouldLoadCard('watch')) tasks.push(loadWatch());
    if (shouldLoadCard('project')) tasks.push(loadProjects());
    if (shouldLoadCard('task')) tasks.push(loadTasks());
    if (shouldLoadCard('global-production-board')) tasks.push(loadGlobalProductionBoard());
    if (shouldLoadCard('review')) tasks.push(loadApprovals());
    if (shouldLoadCard('shortcuts')) tasks.push(loadShortcuts());
    await Promise.all(tasks);
  }

  async function resetLayout(): Promise<void> {
    resetLayoutToDefault();
    await loadDashboardData();
  }

  onMounted(() => {
    initPopupMode();
    initLayout();
    void loadDashboardData();
  });

  return {
    GRID_COLS,
    ROW_HEIGHT,
    approvalItems,
    approvalSummaries,
    addShortcutByRoute,
    globalProductionBoardLanes,
    goTo,
    isPopupMode,
    layout,
    loadingApprovals,
    loadingGlobalProductionBoard,
    loadingProjects,
    loadingShortcuts,
    loadingTasks,
    loadingWatch,
    openCardInWindow,
    projectItems,
    removeShortcutById,
    resetLayout,
    setCardVisible,
    shortcutItems,
    showDashboardCardEmpty,
    taskItems,
    updateLayout,
    visibilityOptions,
    visibleCards,
    watchProjects,
  };
}
