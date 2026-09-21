import { readDB, type DemoTask, type DemoTaskLine, type DemoTaskStatus } from '@/shared/mock/db';
import {
  createTask,
  deleteTask,
  fetchTaskList,
  reworkTask,
  updateTask,
  updateTaskStatus,
  type TaskCreateInput,
  type TaskUpdatePatch,
} from './api';
import { TASK_VIEWS } from './constants';
import type { TaskListMode } from './types';

/**
 * 任务管理页编排（对齐 KK MyTasksPage + useViewManager 精简版）：
 * - 左侧视图栏（所有任务/全局今日看板/生产线）驱动过滤与模式
 * - 表格 / 看板双视图，看板按状态分组
 * - 详情抽屉：字段编辑 / 状态流转 / 发起返工 / 删除
 */
export function useTaskListPage() {
  const route = useRoute();

  const tasks = ref<DemoTask[]>([]);
  const loading = ref(false);

  const activeViewId = ref(
    route.query.view === 'global-production-board' ? 'sys-board' : 'sys-all'
  );
  const activeView = computed(
    () => TASK_VIEWS.find((view) => view.id === activeViewId.value) ?? TASK_VIEWS[0]
  );
  const mode = ref<TaskListMode>(activeView.value.mode);

  // 工具栏筛选
  const keyword = ref('');
  const lineFilter = ref<DemoTaskLine | 'all'>('all');
  const statusFilter = ref<DemoTaskStatus | 'all'>('all');
  const priorityFilter = ref<DemoTask['priority'] | 'all'>('all');

  // 详情抽屉 / 弹窗
  const drawerOpen = ref(false);
  const detailTaskId = ref<string | null>(null);
  const createOpen = ref(false);
  const reworkOpen = ref(false);
  const reworkTaskId = ref<string | null>(null);

  /** 人员名映射（负责人显示） */
  const staffMap = computed(() => {
    const map = new Map<string, string>();
    for (const user of readDB().users) map.set(user.id, user.name);
    return map;
  });

  /** 项目名映射 */
  const projectMap = computed(() => {
    const map = new Map<string, string>();
    for (const project of readDB().projects) map.set(project.id, project.name);
    return map;
  });

  /** 负责人下拉（对齐工坊 staffOptions 模式） */
  const staffOptions = computed(() =>
    readDB()
      .users.filter((user) => user.employmentStatus === 'active')
      .map((user) => ({ value: user.id, label: user.name }))
  );

  /** 项目下拉（新建任务） */
  const projectOptions = computed(() =>
    readDB().projects.map((project) => ({ value: project.id, label: project.name }))
  );

  const detailTask = computed(
    () => tasks.value.find((task) => task.id === detailTaskId.value) ?? null
  );
  const reworkTarget = computed(
    () => tasks.value.find((task) => task.id === reworkTaskId.value) ?? null
  );

  /** 过滤后任务（视图线过滤 + 工具栏筛选） */
  const filteredTasks = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    return tasks.value.filter((task) => {
      if (activeView.value.line && task.line !== activeView.value.line) return false;
      if (lineFilter.value !== 'all' && task.line !== lineFilter.value) return false;
      if (statusFilter.value !== 'all' && task.status !== statusFilter.value) return false;
      if (priorityFilter.value !== 'all' && task.priority !== priorityFilter.value) return false;
      if (kw && !task.name.toLowerCase().includes(kw)) return false;
      return true;
    });
  });

  async function load(): Promise<void> {
    loading.value = true;
    try {
      tasks.value = await fetchTaskList();
    } finally {
      loading.value = false;
    }
  }

  /** 切换左侧视图（本地状态切换；URL query 仅在进入页面时决定初始视图，
   *  不再写回路由——避免 routeViewKey(fullPath) 变化触发整页重建导致「需点两次」） */
  function switchView(viewId: string): void {
    const view = TASK_VIEWS.find((item) => item.id === viewId);
    if (!view) return;
    activeViewId.value = viewId;
    mode.value = view.mode;
    keyword.value = '';
  }

  function setMode(next: TaskListMode): void {
    mode.value = next;
  }

  function openDetail(task: DemoTask): void {
    detailTaskId.value = task.id;
    drawerOpen.value = true;
  }

  function closeDetail(): void {
    drawerOpen.value = false;
    detailTaskId.value = null;
  }

  async function handleSavePatch(patch: TaskUpdatePatch): Promise<void> {
    if (!detailTaskId.value) return;
    await updateTask(detailTaskId.value, patch);
    await load();
  }

  async function handleStatusChange(status: DemoTaskStatus): Promise<void> {
    if (!detailTaskId.value) return;
    await updateTaskStatus(detailTaskId.value, status);
    await load();
  }

  function openRework(task: DemoTask): void {
    reworkTaskId.value = task.id;
    reworkOpen.value = true;
  }

  async function submitRework(reason: string): Promise<void> {
    if (!reworkTaskId.value) return;
    await reworkTask(reworkTaskId.value, reason);
    reworkOpen.value = false;
    reworkTaskId.value = null;
    await load();
  }

  async function handleDelete(task: DemoTask): Promise<void> {
    await deleteTask(task.id);
    if (detailTaskId.value === task.id) closeDetail();
    await load();
  }

  async function handleCreate(input: TaskCreateInput): Promise<void> {
    await createTask(input);
    createOpen.value = false;
    await load();
  }

  onMounted(load);

  // reactive 返回：模板直接解包 ref/computed（对齐 useAssetListPage 模式）
  return reactive({
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    activeViewId,
    activeView,
    mode,
    keyword,
    lineFilter,
    statusFilter,
    priorityFilter,
    staffMap,
    projectMap,
    staffOptions,
    projectOptions,
    detailTask,
    drawerOpen,
    createOpen,
    reworkOpen,
    reworkTarget,
    switchView,
    setMode,
    openDetail,
    closeDetail,
    handleSavePatch,
    handleStatusChange,
    openRework,
    submitRework,
    handleDelete,
    handleCreate,
    reload: load,
  });
}

export type TaskListPageContext = ReturnType<typeof useTaskListPage>;
