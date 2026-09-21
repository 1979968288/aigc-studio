import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message, Modal } from 'ant-design-vue';
import { fetchProjects, deleteProject, toggleFavorite } from '../api';
import {
  PROJECT_TYPE_OPTIONS,
  type ProjectSummary,
  type ProjectCreateInput,
} from '../types';
import {
  PROJECT_STATUS_META,
  PROJECT_VIEW_MODE_OPTIONS,
  PROJECT_VIEW_MODE_STORAGE_KEY,
  type ProjectViewMode,
} from '../constants';

/** 筛选状态（演示版固定条件：类型 / 状态 / 仅收藏） */
export interface ProjectListFilterState {
  type: string | undefined;
  status: string | undefined;
  favoritedOnly: boolean;
}

function loadStoredViewMode(): ProjectViewMode {
  try {
    const stored = localStorage.getItem(PROJECT_VIEW_MODE_STORAGE_KEY);
    if (stored && PROJECT_VIEW_MODE_OPTIONS.some((option) => option.key === stored)) {
      return stored as ProjectViewMode;
    }
  } catch {
    // localStorage 不可用时回退默认卡片视图
  }
  return 'card';
}

export function useProjectListPage() {
  const router = useRouter();

  const loading = ref(false);
  const projects = ref<ProjectSummary[]>([]);
  const keyword = ref('');
  const viewMode = ref<ProjectViewMode>(loadStoredViewMode());
  const createProjectModalVisible = ref(false);
  const filterPopoverVisible = ref(false);
  const filterDraft = reactive<ProjectListFilterState>({
    type: undefined,
    status: undefined,
    favoritedOnly: false,
  });
  const appliedFilters = reactive<ProjectListFilterState>({
    type: undefined,
    status: undefined,
    favoritedOnly: false,
  });

  /** 竞态保护：仅接受最新一次请求的结果 */
  let latestRequestId = 0;

  const statusOptions = Object.entries(PROJECT_STATUS_META).map(([value, meta]) => ({
    label: meta.label,
    value,
  }));

  const typeOptions = [...PROJECT_TYPE_OPTIONS];

  const activeFilterCount = computed(
    () =>
      (appliedFilters.type ? 1 : 0) +
      (appliedFilters.status ? 1 : 0) +
      (appliedFilters.favoritedOnly ? 1 : 0)
  );

  const filteredProjects = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    return projects.value.filter((project) => {
      if (kw && !project.name.toLowerCase().includes(kw)) return false;
      if (appliedFilters.type && project.type_name !== appliedFilters.type) return false;
      if (
        appliedFilters.status &&
        String(project.status) !== appliedFilters.status
      ) {
        return false;
      }
      if (appliedFilters.favoritedOnly && !project.favorited) return false;
      return true;
    });
  });

  const hasActiveQuery = computed(
    () => Boolean(keyword.value.trim()) || activeFilterCount.value > 0
  );

  const emptyTitle = computed(() =>
    hasActiveQuery.value ? '暂无匹配项目' : '暂无项目'
  );

  const emptyHint = computed(() =>
    hasActiveQuery.value
      ? '没有找到符合当前搜索或筛选条件的项目，试试清空条件后重新查看。'
      : '当前还没有可展示的项目，创建项目后会显示在这里。'
  );

  async function loadProjects() {
    const requestId = ++latestRequestId;
    loading.value = true;
    try {
      const list = await fetchProjects();
      if (requestId !== latestRequestId) return;
      projects.value = list;
    } catch (error) {
      if (requestId !== latestRequestId) return;
      console.error('load projects failed', error);
      message.error('项目列表加载失败');
      projects.value = [];
    } finally {
      if (requestId === latestRequestId) {
        loading.value = false;
      }
    }
  }

  function selectViewMode(mode: ProjectViewMode) {
    viewMode.value = mode;
    try {
      localStorage.setItem(PROJECT_VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // 持久化失败不影响当前会话
    }
  }

  function applyFilterDraft() {
    appliedFilters.type = filterDraft.type;
    appliedFilters.status = filterDraft.status;
    appliedFilters.favoritedOnly = filterDraft.favoritedOnly;
    filterPopoverVisible.value = false;
  }

  function resetFilters() {
    filterDraft.type = undefined;
    filterDraft.status = undefined;
    filterDraft.favoritedOnly = false;
    appliedFilters.type = undefined;
    appliedFilters.status = undefined;
    appliedFilters.favoritedOnly = false;
    filterPopoverVisible.value = false;
  }

  function clearQuery() {
    keyword.value = '';
    resetFilters();
  }

  function handleCreateProject() {
    createProjectModalVisible.value = true;
  }

  async function handleCreateSuccess(input: ProjectCreateInput) {
    createProjectModalVisible.value = false;
    message.success(`项目「${input.name}」已创建`);
    await loadProjects();
  }

  function handleDelete(projectId: string) {
    const project = projects.value.find((item) => item.id === projectId);
    if (!project) return;
    Modal.confirm({
      title: '确认删除项目',
      content: `删除「${project.name}」后不可恢复，是否继续？`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProject(projectId);
          message.success('项目已删除');
          await loadProjects();
        } catch (error) {
          console.error('delete project failed', error);
          message.error('项目删除失败');
        }
      },
    });
  }

  async function handleFavorite(projectId: string) {
    const project = projects.value.find((item) => item.id === projectId);
    if (!project) return;
    // 乐观更新：先翻转 UI 再落库，失败回滚
    project.favorited = !project.favorited;
    try {
      await toggleFavorite(projectId);
      message.success(project.favorited ? '已收藏项目' : '已取消收藏');
    } catch (error) {
      project.favorited = !project.favorited;
      console.error('favorite operation failed', error);
      message.error('收藏操作失败');
    }
  }

  function goToDetail(project: ProjectSummary) {
    void router.push({
      path: `/projects/${project.id}/detail`,
      query: { name: project.name },
    });
  }

  onMounted(() => {
    void loadProjects();
  });

  return {
    // 状态
    loading,
    projects,
    filteredProjects,
    keyword,
    viewMode,
    createProjectModalVisible,
    filterPopoverVisible,
    filterDraft,
    appliedFilters,
    activeFilterCount,
    hasActiveQuery,
    emptyTitle,
    emptyHint,
    statusOptions,
    typeOptions,
    // 动作
    loadProjects,
    selectViewMode,
    applyFilterDraft,
    resetFilters,
    clearQuery,
    handleCreateProject,
    handleCreateSuccess,
    handleDelete,
    handleFavorite,
    goToDetail,
  };
}

export type ProjectListPageContext = ReturnType<typeof useProjectListPage>;
