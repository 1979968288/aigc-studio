import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import type { DemoProject } from '@/shared/mock/db';
import { resolveStaffName } from '@/modules/staff/api';
import { toggleFavorite } from '../api';
import {
  fetchProjectDetail,
  loadPinnedKeys,
  savePinnedKeys,
  updateProjectDetail,
} from './api';
import { DETAIL_MENU_ITEMS, PRODUCTION_SECTIONS, RISK_LEVEL_LABELS, healthScoreLabel } from './constants';
import type {
  ProjectDetail,
  ProjectDetailMenuKey,
  ProductionPinnedItem,
} from './types';

const VALID_MENU_KEYS = new Set<string>([
  ...DETAIL_MENU_ITEMS.map((item) => item.key),
  'settings',
]);

export function useProjectDetailPage(projectId: string) {
  const route = useRoute();
  const router = useRouter();

  const loading = ref(true);
  const detail = ref<ProjectDetail | null>(null);
  const activeMenu = ref<ProjectDetailMenuKey>('overview');
  const headerExpanded = ref(true);
  const sidebarCollapsed = ref(false);
  const saving = ref(false);

  /** 竞态保护 */
  let latestRequestId = 0;

  const project = computed(() => detail.value?.project ?? null);
  const outputs = computed(() => detail.value?.outputs ?? []);
  const stats = computed(() => detail.value?.stats ?? null);

  /** 字段值聚合（制作信息展示 + 置顶 chips） */
  const fieldValues = computed<Record<string, string>>(() => {
    const p = project.value;
    const s = stats.value;
    const empty: Record<string, string> = {};
    if (!p || !s) return empty;
    const num = (v: number | null): string => (v != null ? String(v) : '-');
    const str = (v: string): string => (v ? v : '-');
    return {
      name: p.name,
      project_alias: str(p.project_alias),
      nicknames: str(p.nicknames),
      type_name: p.type_name,
      project_level: p.project_level,
      product_name: str(p.product_name),
      status: String(p.status),
      pipeline_template: p.pipelineLabel,
      owner: resolveStaffName(p.owner),
      director: p.director ? resolveStaffName(p.director) : '-',
      producer: p.producer ? resolveStaffName(p.producer) : '-',
      create_by: p.create_by ? resolveStaffName(p.create_by) : '-',
      create_time: p.create_time,
      approval_date: str(p.approval_date),
      planned_delivery: str(p.planned_delivery),
      actual_delivery: str(p.actual_delivery),
      health_score: healthScoreLabel(p.health_score),
      risk_level: RISK_LEVEL_LABELS[String(p.risk_level)] ?? '-',
      description: str(p.description),
      references: str(p.references),
      total_episodes: num(p.total_episodes),
      episode_duration: num(p.episode_duration),
      duration_minutes: num(p.duration_minutes),
      schedule: str(p.schedule),
      languages: str(p.languages),
      resolution: str(p.resolution),
      frame_rate: str(p.frame_rate),
      budget: p.budget != null ? `¥${p.budget.toLocaleString()}` : '-',
      has_lip_sync: p.has_lip_sync === 1 ? '是' : '否',
      has_digital_assets: p.has_digital_assets === 1 ? '是' : '否',
      gen_model: str(p.gen_model),
      pipeline_steps: p.pipelineSteps.join(' → ') || '-',
      progress: `${p.progress}%`,
      shots_progress: `${s.shotsDone} / ${s.shotsTotal}`,
      todo_tasks: `${s.todoTasks} 项`,
      member_count: `${s.memberCount} 人`,
    };
  });

  /** 编辑态原始值（未格式化，供表单回填） */
  const editValues = computed<Record<string, string>>(() => {
    const p = project.value;
    const empty: Record<string, string> = {};
    if (!p) return empty;
    const num = (v: number | null): string => (v != null ? String(v) : '');
    return {
      project_alias: p.project_alias,
      nicknames: p.nicknames,
      project_level: p.project_level,
      product_name: p.product_name,
      pipeline_template: p.pipeline_template,
      director: p.director,
      producer: p.producer,
      approval_date: p.approval_date,
      planned_delivery: p.planned_delivery,
      actual_delivery: p.actual_delivery,
      risk_level: String(p.risk_level),
      description: p.description,
      references: p.references,
      total_episodes: num(p.total_episodes),
      episode_duration: num(p.episode_duration),
      duration_minutes: num(p.duration_minutes),
      schedule: p.schedule,
      languages: p.languages,
      resolution: p.resolution,
      frame_rate: p.frame_rate,
      budget: num(p.budget),
      has_lip_sync: String(p.has_lip_sync),
      has_digital_assets: String(p.has_digital_assets),
      gen_model: p.gen_model,
    };
  });

  const pinnedKeys = ref<string[]>([]);

  const pinnedItems = computed<ProductionPinnedItem[]>(() => {
    const map = new Map<string, string>();
    for (const section of PRODUCTION_SECTIONS) {
      for (const group of section.groups) {
        for (const field of group.fields) {
          map.set(field.key, field.label);
        }
      }
    }
    return pinnedKeys.value
      .map((key) => ({ key, label: map.get(key) ?? key, value: fieldValues.value[key] ?? '-' }))
      .filter((item) => map.has(item.key));
  });

  function loadPinned() {
    pinnedKeys.value = loadPinnedKeys(projectId);
  }

  function togglePinned(fieldKey: string) {
    const keys = [...pinnedKeys.value];
    const index = keys.indexOf(fieldKey);
    if (index >= 0) {
      keys.splice(index, 1);
      message.success('已取消置顶');
    } else {
      keys.push(fieldKey);
      message.success('已添加到项目面板');
    }
    pinnedKeys.value = keys;
    savePinnedKeys(projectId, keys);
  }

  async function loadProject() {
    const requestId = ++latestRequestId;
    loading.value = true;
    try {
      const data = await fetchProjectDetail(projectId);
      if (requestId !== latestRequestId) return;
      detail.value = data;
      // 手动输 URL 进入时补写项目名到 query，保证标签页显示项目名（对齐 KK）
      if (data && !route.query.name) {
        void router.replace({ query: { ...route.query, name: data.project.name } });
      }
    } catch (error) {
      console.error('load project detail failed', error);
      message.error('项目详情加载失败');
    } finally {
      if (requestId === latestRequestId) {
        loading.value = false;
      }
    }
  }

  async function handleFavorite() {
    const p = project.value;
    if (!p) return;
    p.favorited = !p.favorited;
    try {
      await toggleFavorite(p.id);
      message.success(p.favorited ? '收藏成功' : '已取消收藏');
    } catch (error) {
      p.favorited = !p.favorited;
      console.error('favorite operation failed', error);
      message.error('收藏操作失败');
    }
  }

  async function saveDetailPatch(
    patch: Record<string, unknown>,
    successText = '已保存'
  ): Promise<boolean> {
    if (saving.value) return false;
    saving.value = true;
    try {
      const updated = await updateProjectDetail(
        projectId,
        patch as Partial<Omit<DemoProject, 'id'>>
      );
      if (updated && detail.value) {
        detail.value.project = updated;
        message.success(successText);
        return true;
      }
      return false;
    } catch (error) {
      console.error('update project detail failed', error);
      message.error('保存失败，请重试');
      return false;
    } finally {
      saving.value = false;
    }
  }

  function handleMenuClick(key: ProjectDetailMenuKey) {
    activeMenu.value = key;
    headerExpanded.value = key === 'overview';
    void router.replace({ query: { ...route.query, menu: key } });
  }

  function resolveMenuFromRoute() {
    const menu = String(route.query.menu || '').trim();
    if (menu && VALID_MENU_KEYS.has(menu)) {
      activeMenu.value = menu as ProjectDetailMenuKey;
    } else {
      activeMenu.value = 'overview';
    }
    headerExpanded.value = activeMenu.value === 'overview';
  }

  watch(
    () => route.query.menu,
    () => resolveMenuFromRoute(),
    { immediate: true }
  );

  onMounted(() => {
    loadPinned();
    void loadProject();
  });

  return {
    loading,
    detail,
    project,
    outputs,
    stats,
    fieldValues,
    editValues,
    pinnedKeys,
    pinnedItems,
    activeMenu,
    headerExpanded,
    sidebarCollapsed,
    saving,
    loadProject,
    loadPinned,
    handleFavorite,
    handleMenuClick,
    saveDetailPatch,
    togglePinned,
  };
}

export type ProjectDetailPageContext = ReturnType<typeof useProjectDetailPage>;
