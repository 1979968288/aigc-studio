import { readDB } from '@/shared/mock/db';
import type { DemoApproval, DemoApprovalCategory } from '@/shared/mock/db';
import { APPROVAL_CATEGORIES, APPROVAL_STATUS_META, APPROVAL_TYPE_META } from './constants';
import {
  approveApproval,
  batchDecideApprovals,
  categoryOf,
  describeTarget,
  fetchApprovals,
  fetchApprovalSummary,
  isOverdue,
  rejectApproval,
} from './api';
import type { ApprovalCategory, ApprovalStatusFilter, ApprovalView } from './types';

/**
 * 审批中心编排（对齐 KK ApprovalCenter 精简版）：
 * - 侧栏分类（任务审核/管理审批，带待办角标）+ 状态 Tab（全部/待处理/已处理）
 * - 表格 / 看板双视图 + 类型筛选 + 搜索 + 批量通过/驳回
 * - 详情抽屉：单据信息 + 目标内容 + 通过/驳回（写回业务对象）
 */
export function useApprovalCenterPage() {
  const category = ref<ApprovalCategory>('task');
  const statusFilter = ref<ApprovalStatusFilter>('pending');
  const view = ref<ApprovalView>('table');
  const keyword = ref('');
  const typeFilter = ref<DemoApprovalCategory | 'all'>('all');

  const approvals = ref<DemoApproval[]>([]);
  const loading = ref(false);
  const summaries = ref<Record<ApprovalCategory, number>>({ task: 0, management: 0 });

  const selectedKeys = ref<string[]>([]);

  const drawerOpen = ref(false);
  const detailId = ref<string | null>(null);
  const decisionOpen = ref(false);
  const decisionAction = ref<'approve' | 'reject'>('approve');

  const activeCategory = computed(
    () => APPROVAL_CATEGORIES.find((item) => item.key === category.value)!
  );

  /** 当前分类待处理数（Tab 角标） */
  const pendingCount = computed(() => summaries.value[category.value] ?? 0);

  const detailApproval = computed(
    () => approvals.value.find((item) => item.id === detailId.value) ?? null
  );

  const filteredApprovals = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    return approvals.value.filter((item) => {
      if (statusFilter.value === 'pending' && item.status !== 'pending') return false;
      if (statusFilter.value === 'processed' && item.status === 'pending') return false;
      if (typeFilter.value !== 'all' && item.type !== typeFilter.value) return false;
      if (kw && !item.title.toLowerCase().includes(kw)) return false;
      return true;
    });
  });

  const selectedApprovals = computed(() =>
    approvals.value.filter((item) => selectedKeys.value.includes(item.id))
  );

  async function load(): Promise<void> {
    loading.value = true;
    try {
      approvals.value = await fetchApprovals(category.value);
      summaries.value = await fetchApprovalSummary();
    } finally {
      loading.value = false;
    }
  }

  async function switchCategory(next: ApprovalCategory): Promise<void> {
    if (next === category.value) return;
    category.value = next;
    selectedKeys.value = [];
    typeFilter.value = 'all';
    await load();
  }

  function setStatusFilter(next: ApprovalStatusFilter): void {
    statusFilter.value = next;
  }

  function setView(next: ApprovalView): void {
    view.value = next;
  }

  function openDetail(item: DemoApproval): void {
    detailId.value = item.id;
    drawerOpen.value = true;
  }

  function closeDetail(): void {
    drawerOpen.value = false;
    detailId.value = null;
  }

  function openDecision(item: DemoApproval, action: 'approve' | 'reject'): void {
    detailId.value = item.id;
    decisionAction.value = action;
    decisionOpen.value = true;
  }

  async function submitDecision(comment?: string): Promise<void> {
    if (!detailId.value) return;
    const action = decisionAction.value;
    if (action === 'approve') {
      await approveApproval(detailId.value, comment);
    } else {
      await rejectApproval(detailId.value, comment || '驳回');
    }
    decisionOpen.value = false;
    closeDetail();
    await load();
  }

  async function batchDecide(action: 'approve' | 'reject'): Promise<void> {
    const ids = [...selectedKeys.value];
    if (ids.length === 0) return;
    await batchDecideApprovals(ids, action, action === 'approve' ? undefined : '批量驳回');
    selectedKeys.value = [];
    await load();
  }

  function toggleSelect(id: string): void {
    selectedKeys.value = selectedKeys.value.includes(id)
      ? selectedKeys.value.filter((key) => key !== id)
      : [...selectedKeys.value, id];
  }

  onMounted(load);

  // reactive 返回：模板直接解包 ref/computed
  return reactive({
    approvals: filteredApprovals,
    allApprovals: approvals,
    loading,
    category,
    activeCategory,
    summaries,
    pendingCount,
    statusFilter,
    view,
    keyword,
    typeFilter,
    selectedKeys,
    selectedApprovals,
    drawerOpen,
    detailApproval,
    decisionOpen,
    decisionAction,
    switchCategory,
    setStatusFilter,
    setView,
    openDetail,
    closeDetail,
    openDecision,
    submitDecision,
    batchDecide,
    toggleSelect,
    reload: load,
  });
}

export type ApprovalCenterPageContext = ReturnType<typeof useApprovalCenterPage>;

/** 视图辅助：类型/状态/逾期/目标描述（供组件展示） */
export function approvalTypeLabel(type: DemoApprovalCategory): string {
  return APPROVAL_TYPE_META[type]?.label ?? type;
}

export function approvalStatusMeta(status: DemoApproval['status']) {
  return APPROVAL_STATUS_META[status] ?? { label: status, color: '', bg: '' };
}

export function approvalCategoryOf(type: DemoApprovalCategory): ApprovalCategory {
  return categoryOf(type);
}

export function approvalTargetText(item: DemoApproval): string {
  return describeTarget(item).label;
}

export function approvalIsOverdue(item: DemoApproval): boolean {
  return isOverdue(item);
}

export function approvalTargetExtra(item: DemoApproval): string {
  return describeTarget(item).extra;
}

export function approvalProjectName(projectId: string): string {
  return readDB().projects.find((p) => p.id === projectId)?.name ?? projectId;
}

export function approvalStaffName(userId: string): string {
  return readDB().users.find((u) => u.id === userId)?.name ?? userId;
}
