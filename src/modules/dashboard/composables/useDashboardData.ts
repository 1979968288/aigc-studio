import { ref } from 'vue';
import {
  fetchWatchProjects,
  fetchProjects,
  fetchMyTasks,
  fetchApprovals,
  fetchApprovalSummaries,
  fetchGlobalProductionBoard,
  fetchShortcuts,
  removeShortcut,
  addShortcut,
} from '../api';
import { useAuthStore } from '@/stores/auth';
import type {
  DashboardApprovalItem,
  DashboardApprovalSummary,
  DashboardGlobalProductionLane,
  DashboardProjectSummary,
  DashboardShortcutItem,
  DashboardTaskItem,
} from '../types';

/** 关注项目卡数据 */
export function useDashboardProjects() {
  const watchProjects = ref<DashboardProjectSummary[]>([]);
  const projectItems = ref<DashboardProjectSummary[]>([]);
  const loadingWatch = ref(false);
  const loadingProjects = ref(false);

  async function loadWatch(): Promise<void> {
    loadingWatch.value = true;
    try {
      watchProjects.value = await fetchWatchProjects();
    } finally {
      loadingWatch.value = false;
    }
  }

  async function loadProjects(): Promise<void> {
    loadingProjects.value = true;
    try {
      projectItems.value = await fetchProjects();
    } finally {
      loadingProjects.value = false;
    }
  }

  return {
    watchProjects,
    projectItems,
    loadingWatch,
    loadingProjects,
    loadWatch,
    loadProjects,
  };
}

/** 任务管理卡数据（按角色过滤生产线） */
export function useDashboardTasks() {
  const authStore = useAuthStore();
  const taskItems = ref<DashboardTaskItem[]>([]);
  const loadingTasks = ref(false);

  async function loadTasks(): Promise<void> {
    loadingTasks.value = true;
    try {
      const role = authStore.currentUser?.role;
      if (!role) {
        taskItems.value = [];
        return;
      }
      taskItems.value = await fetchMyTasks(role);
    } finally {
      loadingTasks.value = false;
    }
  }

  return { taskItems, loadingTasks, loadTasks };
}

/** 审核管理卡数据 */
export function useDashboardApprovals() {
  const approvalItems = ref<DashboardApprovalItem[]>([]);
  const approvalSummaries = ref<DashboardApprovalSummary[]>([]);
  const loadingApprovals = ref(false);

  async function loadApprovals(): Promise<void> {
    loadingApprovals.value = true;
    try {
      const [items, summaries] = await Promise.all([
        fetchApprovals(),
        fetchApprovalSummaries(),
      ]);
      approvalItems.value = items;
      approvalSummaries.value = summaries;
    } finally {
      loadingApprovals.value = false;
    }
  }

  return { approvalItems, approvalSummaries, loadingApprovals, loadApprovals };
}

/** 全局今日看板卡数据 */
export function useDashboardGlobalProductionBoard() {
  const globalProductionBoardLanes = ref<DashboardGlobalProductionLane[]>([]);
  const loadingGlobalProductionBoard = ref(false);

  async function loadGlobalProductionBoard(): Promise<void> {
    loadingGlobalProductionBoard.value = true;
    try {
      globalProductionBoardLanes.value = await fetchGlobalProductionBoard();
    } finally {
      loadingGlobalProductionBoard.value = false;
    }
  }

  return { globalProductionBoardLanes, loadingGlobalProductionBoard, loadGlobalProductionBoard };
}

/** 收藏/捷径卡数据（来自"收藏标签页"动作） */
export function useDashboardShortcuts() {
  const shortcutItems = ref<DashboardShortcutItem[]>([]);
  const loadingShortcuts = ref(false);

  async function loadShortcuts(): Promise<void> {
    loadingShortcuts.value = true;
    try {
      shortcutItems.value = await fetchShortcuts();
    } finally {
      loadingShortcuts.value = false;
    }
  }

  async function removeShortcutById(id: string): Promise<void> {
    shortcutItems.value = await removeShortcut(id);
  }

  async function addShortcutByRoute(label: string, route: string): Promise<void> {
    shortcutItems.value = await addShortcut(label, route);
  }

  return {
    shortcutItems,
    loadingShortcuts,
    loadShortcuts,
    removeShortcutById,
    addShortcutByRoute,
  };
}
