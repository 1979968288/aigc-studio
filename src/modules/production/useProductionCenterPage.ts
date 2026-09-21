import { computed, inject, ref, type InjectionKey } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { readDB } from '@/shared/mock/db';
import { resolveStaffName } from '@/modules/staff/api';
import type {
  PCScene,
  PCTask,
  PCAsset,
  PCScriptRecord,
  AssetTypeName,
  ContextMenuState,
  ProductionEntityType,
  SearchField,
  SceneStatus,
  TaskStatus,
  AssetStatus,
  RiskLevel,
} from './types';
import { ASSET_TYPES } from './constants';
import type { CreateDialogType } from './constants';
import {
  fetchProduction,
  addScene,
  updateScene,
  deleteScene,
  addTask,
  updateTask,
  deleteTask,
  addAsset,
  updateAsset,
  deleteAsset,
} from './api';

export function useProductionCenterPage(projectId: string) {
  const route = useRoute();

  /** ---------- 项目元信息（集数） ---------- */
  const project = computed(() => readDB().projects.find((item) => item.id === projectId) ?? null);
  const projectName = computed(() => project.value?.name ?? String(route.query.name ?? ''));
  const totalEpisodes = computed(() => project.value?.total_episodes ?? 1);
  const episodeOptions = computed(() => {
    const total = Math.max(1, totalEpisodes.value);
    return Array.from({ length: total }, (_, index) => ({
      label: `第 ${index + 1} 集`,
      value: index + 1,
    }));
  });
  const selectedEpisode = ref(1);

  /** ---------- 数据 ---------- */
  const loading = ref(true);
  const scripts = ref<PCScriptRecord[]>([]);
  const scenes = ref<PCScene[]>([]);
  const tasks = ref<PCTask[]>([]);
  const assets = ref<PCAsset[]>([]);
  const scriptLayerCollapsed = ref(false);

  /** ---------- 搜索 ---------- */
  const searchField = ref<SearchField>('scene');
  const searchKeyword = ref('');

  /** ---------- 选中 / 高亮 ---------- */
  const selectedEntity = ref<{
    type: ProductionEntityType;
    id: string;
  } | null>(null);
  const highlightedScenes = ref<string[]>([]);
  const highlightedTasks = ref<string[]>([]);
  const highlightedAssets = ref<string[]>([]);

  /** ---------- 拖拽 ---------- */
  const isSceneDragging = ref(false);
  const draggedScene = ref<PCScene | null>(null);

  /** ---------- 右键菜单 ---------- */
  const contextMenu = ref<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'scene',
    item: null,
  });

  /** ---------- 新建 / 编辑弹窗 ---------- */
  const createDialogType = ref<CreateDialogType | null>(null);
  const editDialog = ref<{
    type: ProductionEntityType;
    item: PCScene | PCTask | PCAsset;
  } | null>(null);

  /** ---------- 计算属性 ---------- */
  const keyword = computed(() => searchKeyword.value.trim().toLowerCase());

  const filteredScenes = computed(() => {
    if (!keyword.value || searchField.value !== 'scene') return scenes.value;
    return scenes.value.filter((scene) =>
      [scene.sceneNo, scene.name, scene.location, scene.characters.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(keyword.value)
    );
  });

  const filteredTasks = computed(() => {
    if (!keyword.value || searchField.value !== 'task') return tasks.value;
    return tasks.value.filter((task) =>
      [task.code, task.stage, resolveStaffName(task.responsible), task.description]
        .join(' ')
        .toLowerCase()
        .includes(keyword.value)
    );
  });

  const filteredAssets = computed(() => {
    if (!keyword.value || searchField.value !== 'asset') return assets.value;
    return assets.value.filter((asset) =>
      [asset.id, asset.name, asset.assetType, resolveStaffName(asset.artist)]
        .join(' ')
        .toLowerCase()
        .includes(keyword.value)
    );
  });

  const searchMatchCount = computed(() => {
    if (searchField.value === 'scene') return filteredScenes.value.length;
    if (searchField.value === 'task') return filteredTasks.value.length;
    return filteredAssets.value.length;
  });

  /** 资产按类型分组 */
  const assetGroups = computed(() =>
    ASSET_TYPES.map((type) => ({
      type,
      assets: filteredAssets.value.filter((asset) => asset.assetType === type),
    }))
  );

  /** ---------- 数据加载 ---------- */
  async function load() {
    loading.value = true;
    try {
      const data = await fetchProduction(projectId);
      scripts.value = data.scripts ?? [];
      scenes.value = data.scenes ?? [];
      tasks.value = data.tasks ?? [];
      assets.value = data.assets ?? [];
    } catch (error) {
      console.error('load production failed', error);
      message.error('制作工坊数据加载失败');
    } finally {
      loading.value = false;
    }
  }

  /** ---------- 选择 / 高亮 ---------- */
  function clearSelection() {
    selectedEntity.value = null;
    highlightedScenes.value = [];
    highlightedTasks.value = [];
    highlightedAssets.value = [];
  }

  function selectScene(scene: PCScene) {
    selectedEntity.value = { type: 'scene', id: scene.id };
    highlightedScenes.value = [scene.id];
    highlightedTasks.value = tasks.value
      .filter((task) => task.sceneId === scene.id)
      .map((task) => task.id);
    highlightedAssets.value = assets.value
      .filter((asset) => asset.usedInScenes.includes(scene.id))
      .map((asset) => asset.id);
  }

  function selectTask(task: PCTask) {
    selectedEntity.value = { type: 'task', id: task.id };
    highlightedTasks.value = [task.id];
    highlightedScenes.value = [task.sceneId];
    highlightedAssets.value = assets.value
      .filter((asset) => asset.usedInScenes.includes(task.sceneId))
      .map((asset) => asset.id);
  }

  function selectAsset(asset: PCAsset) {
    selectedEntity.value = { type: 'asset', id: asset.id };
    highlightedAssets.value = [asset.id];
    highlightedScenes.value = asset.usedInScenes;
    highlightedTasks.value = tasks.value
      .filter((task) => asset.usedInScenes.includes(task.sceneId))
      .map((task) => task.id);
  }

  /** ---------- 拖拽 ---------- */
  function onSceneDragStart(scene: PCScene) {
    draggedScene.value = scene;
    isSceneDragging.value = true;
  }

  function onSceneDragEnd() {
    draggedScene.value = null;
    isSceneDragging.value = false;
  }

  function handleDropSceneToTask(raw: string) {
    let scene: PCScene | null = null;
    try {
      scene = JSON.parse(raw) as PCScene;
    } catch {
      return;
    }
    void dropSceneToTask(scene);
  }

  async function dropSceneToTask(scene: PCScene) {
    const firstStage = '美术关键帧';
    const task: PCTask = {
      id: nextTaskId(),
      projectId,
      sceneId: scene.id,
      code: nextTaskId(),
      stage: firstStage,
      status: 'pending',
      responsible: 'u-art',
      department: pipelineStageLine(firstStage),
      startTime: '09:00',
      endTime: '18:00',
      location: `${scene.name} - 生成`,
      progress: '0%',
      durationSec: 3600,
      description: `由场次 ${scene.sceneNo ?? scene.id} 拆解生成的制作工序`,
      dependencies: [],
    };
    try {
      await addTask(projectId, task);
      await reloadLanes();
      message.success(`已为“${scene.name}”创建生成任务`);
    } catch (error) {
      console.error(error);
      message.error('创建任务失败');
    }
  }

  function handleDropSceneToAsset(raw: string, assetType: AssetTypeName) {
    let scene: PCScene | null = null;
    try {
      scene = JSON.parse(raw) as PCScene;
    } catch {
      return;
    }
    void createAssetFromScene(scene, assetType);
  }

  async function createAssetFromScene(scene: PCScene, assetType: AssetTypeName) {
    const asset: PCAsset = {
      id: nextAssetId(),
      projectId,
      name: `${scene.name} - 需求`,
      assetType,
      version: 'v0.1',
      status: '草稿',
      artist: '',
      size: '-',
      format: 'PNG',
      usedInScenes: [scene.id],
      qualityCheck: 'PENDING',
    };
    try {
      await addAsset(projectId, asset);
      await reloadLanes();
      message.success(`已为“${scene.name}”生成${assetType}需求`);
    } catch (error) {
      console.error(error);
      message.error('创建资产需求失败');
    }
  }

  /** ---------- 新建 ---------- */
  function openCreateDialog(type: CreateDialogType) {
    createDialogType.value = type;
  }

  function closeCreateDialog() {
    createDialogType.value = null;
  }

  async function submitCreate(
    type: CreateDialogType,
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      if (type === 'scene') {
        const sceneNo = nextSceneNo();
        const scene: PCScene = {
          id: sceneNo,
          projectId,
          sceneNo,
          name: String(payload.name ?? ''),
          type: String(payload.type ?? '内景·昼戏'),
          duration: String(payload.duration ?? '0:15'),
          status: (payload.status as SceneStatus) ?? 'draft',
          riskLevel: (payload.riskLevel as RiskLevel) ?? 'low',
          characters: payload.characters ? String(payload.characters).split('、') : [],
          location: String(payload.location ?? ''),
          schedule: String(payload.schedule ?? ''),
          complexity: 30,
          tasks: 0,
          assetsReady: 0,
          assetsTotal: 0,
          assigneeName: String(payload.assigneeName ?? ''),
        };
        await addScene(projectId, scene);
        message.success('场次已创建');
      } else if (type === 'task') {
        const sceneId = String(payload.sceneId ?? scenes.value[0]?.id ?? '');
        const task: PCTask = {
          id: nextTaskId(),
          projectId,
          sceneId,
          code: nextTaskId(),
          stage: String(payload.stage ?? '美术关键帧'),
          status: (payload.status as TaskStatus) ?? 'pending',
          responsible: String(payload.responsible ?? ''),
          department: pipelineStageLine(String(payload.stage ?? '')),
          startTime: String(payload.startTime ?? '09:00'),
          endTime: String(payload.endTime ?? '18:00'),
          location: String(payload.location ?? ''),
          progress: '0%',
          description: String(payload.description ?? ''),
          dependencies: [],
          prompt: String(payload.prompt ?? '').trim() || undefined,
          genModel: String(payload.genModel ?? '') || undefined,
          refImages: Array.isArray(payload.refImages) && payload.refImages.length
            ? (payload.refImages as string[])
            : undefined,
        };
        await addTask(projectId, task);
        message.success('生成任务已创建');
      } else if (type === 'asset') {
        const asset: PCAsset = {
          id: nextAssetId(),
          projectId,
          name: String(payload.name ?? ''),
          assetType: (payload.assetType as AssetTypeName) ?? '角色资产',
          version: String(payload.version ?? 'v1.0'),
          status: (payload.status as AssetStatus) ?? '草稿',
          artist: String(payload.artist ?? ''),
          size: String(payload.size ?? '-'),
          format: String(payload.format ?? 'PNG'),
          usedInScenes: [],
          qualityCheck: 'PENDING',
        };
        await addAsset(projectId, asset);
        message.success('资产已创建');
      }
      closeCreateDialog();
      await reloadLanes();
    } catch (error) {
      console.error(error);
      message.error('创建失败，请重试');
    }
  }

  /** ---------- 编辑 ---------- */
  function openEditDialog(type: ProductionEntityType, item: PCScene | PCTask | PCAsset) {
    closeContextMenu();
    editDialog.value = { type, item };
  }

  function closeEditDialog() {
    editDialog.value = null;
  }

  async function submitEdit(item: PCScene | PCTask | PCAsset): Promise<void> {
    try {
      if (editDialog.value?.type === 'scene') {
        await updateScene(projectId, item as PCScene);
        message.success('场次已保存');
      } else if (editDialog.value?.type === 'task') {
        await updateTask(projectId, item as PCTask);
        message.success('任务已保存');
      } else if (editDialog.value?.type === 'asset') {
        await updateAsset(projectId, item as PCAsset);
        message.success('资产已保存');
      }
      closeEditDialog();
      await reloadLanes();
    } catch (error) {
      console.error(error);
      message.error('保存失败，请重试');
    }
  }

  /** ---------- 删除 ---------- */
  async function removeEntity(type: ProductionEntityType, item: PCScene | PCTask | PCAsset) {
    closeContextMenu();
    clearSelection();
    try {
      if (type === 'scene') {
        await deleteScene(projectId, item.id);
      } else if (type === 'task') {
        await deleteTask(projectId, item.id);
      } else if (type === 'asset') {
        await deleteAsset(projectId, item.id);
      }
      await reloadLanes();
      message.success('已删除');
    } catch (error) {
      console.error(error);
      message.error('删除失败');
    }
  }

  /** ---------- 右键菜单 ---------- */
  function showContextMenu(
    e: MouseEvent,
    type: ProductionEntityType,
    item: PCScene | PCTask | PCAsset | PCScriptRecord
  ) {
    contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, type, item };
  }

  function closeContextMenu() {
    contextMenu.value = { ...contextMenu.value, visible: false };
  }

  /** ---------- 重置筛选 ---------- */
  function resetFilters() {
    searchKeyword.value = '';
    searchField.value = 'scene';
    clearSelection();
  }

  /** ---------- 内部工具 ---------- */
  async function reloadLanes() {
    const data = await fetchProduction(projectId);
    scenes.value = data.scenes ?? [];
    tasks.value = data.tasks ?? [];
    assets.value = data.assets ?? [];
    scripts.value = data.scripts ?? [];
  }

  function nextSceneNo() {
    const max = scenes.value.reduce((acc, scene) => {
      const match = /^SC-(\d+)$/.exec(scene.sceneNo ?? '');
      const num = match ? Number(match[1]) : 0;
      return Math.max(acc, num);
    }, 0);
    return `SC-${String(max + 1).padStart(3, '0')}`;
  }

  function nextTaskId() {
    const count = tasks.value.length;
    return `T-${String(count + 1).padStart(3, '0')}`;
  }

  function nextAssetId() {
    const count = assets.value.length;
    return `DA-${String(count + 1).padStart(3, '0')}`;
  }

  return {
    // 项目
    project,
    projectName,
    episodeOptions,
    selectedEpisode,
    // 数据
    loading,
    scripts,
    scenes,
    tasks,
    assets,
    scriptLayerCollapsed,
    // 搜索
    searchField,
    searchKeyword,
    filteredScenes,
    filteredTasks,
    filteredAssets,
    assetGroups,
    searchMatchCount,
    // 选中 / 高亮
    selectedEntity,
    highlightedScenes,
    highlightedTasks,
    highlightedAssets,
    clearSelection,
    selectScene,
    selectTask,
    selectAsset,
    // 拖拽
    isSceneDragging,
    onSceneDragStart,
    onSceneDragEnd,
    handleDropSceneToTask,
    handleDropSceneToAsset,
    // 新建
    createDialogType,
    openCreateDialog,
    closeCreateDialog,
    submitCreate,
    // 编辑
    editDialog,
    openEditDialog,
    closeEditDialog,
    submitEdit,
    // 删除
    removeEntity,
    // 右键菜单
    contextMenu,
    showContextMenu,
    closeContextMenu,
    // 其他
    resetFilters,
    load,
  };
}

export type ProductionCenterPageContext = ReturnType<typeof useProductionCenterPage>;

/** 制作工坊上下文注入 key（ProductionCenterWorkspace provide，子组件 inject） */
export const productionCenterKey: InjectionKey<ProductionCenterPageContext> =
  Symbol('production-center');

export function useProductionCenter(): ProductionCenterPageContext {
  const context = inject(productionCenterKey);
  if (!context) {
    throw new Error('useProductionCenter 必须在 ProductionCenterWorkspace 内使用');
  }
  return context;
}

/** 工序 → 生产线 */
function pipelineStageLine(stage: string): string {
  if (stage.includes('视频')) return '视频线';
  if (stage.includes('精修') || stage.includes('合成') || stage.includes('音')) return '后期线';
  if (stage.includes('口型')) return '视频线';
  return '美术线';
}