import { computed, ref, inject, type InjectionKey } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { readDB } from '@/shared/mock/db';
import type { AssetListItem, AssetFormModel, AssetStats, AssetViewMode } from './types';
import { ASSET_STATUS_GROUP } from './constants';
import { fetchAssets, createAsset, updateAsset, deleteAsset } from './api';

/** 新建资产默认表单 */
function emptyForm(): AssetFormModel {
  return {
    name: '',
    assetType: '角色资产',
    version: 'v1.0',
    status: '草稿',
    artist: '',
    size: '-',
    format: 'PNG',
    usedInScenes: [],
    qualityCheck: 'PENDING',
  };
}

/**
 * 资产清单页面级组合式函数
 * 结构对齐 KK useAssetListPage：统计 + 三视图 + 详情抽屉 + 新建/编辑。
 */
export function useAssetListPage(projectId: string) {
  const route = useRoute();

  /** ---------- 项目元信息 ---------- */
  const project = computed(() => readDB().projects.find((p) => p.id === projectId) ?? null);
  const projectName = computed(() => project.value?.name ?? String(route.query.name ?? ''));

  /** ---------- 数据 ---------- */
  const loading = ref(true);
  const assets = ref<AssetListItem[]>([]);

  /** ---------- 视图与筛选 ---------- */
  const viewMode = ref<AssetViewMode>('table');
  const typeFilter = ref<string>('all');
  const statusFilter = ref<string>('all');
  const keyword = ref('');

  const filteredAssets = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    return assets.value.filter((asset) => {
      if (typeFilter.value !== 'all' && asset.assetType !== typeFilter.value) return false;
      if (statusFilter.value !== 'all' && asset.status !== statusFilter.value) return false;
      if (kw) {
        const hay = [asset.id, asset.name, asset.assetType, asset.artist, asset.format]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  });

  /** 顶层统计：资产总量 / 未开始 / 进行中 / 已完成 */
  const stats = computed<AssetStats>(() => ({
    total: assets.value.length,
    notStarted: assets.value.filter((a) => ASSET_STATUS_GROUP[a.status] === 'notStarted').length,
    inProgress: assets.value.filter((a) => ASSET_STATUS_GROUP[a.status] === 'inProgress').length,
    completed: assets.value.filter((a) => ASSET_STATUS_GROUP[a.status] === 'completed').length,
  }));

  /** ---------- 场次（详情引用 & 表单回填） ---------- */
  const sceneOptions = computed(() => {
    const scenes = readDB().production[projectId]?.scenes ?? [];
    return scenes.map((s) => ({ label: `${s.sceneNo ?? s.id} ${s.name}`, value: s.id }));
  });

  function sceneLabel(id: string): string {
    const scenes = readDB().production[projectId]?.scenes ?? [];
    const scene = scenes.find((s) => s.id === id);
    return scene ? `${scene.sceneNo ?? scene.id} ${scene.name}` : id;
  }

  /** ---------- 详情抽屉 ---------- */
  const detailAsset = ref<AssetListItem | null>(null);
  function openDetail(asset: AssetListItem) {
    detailAsset.value = asset;
  }
  function closeDetail() {
    detailAsset.value = null;
  }

  /** ---------- 新建 / 编辑弹窗 ---------- */
  const modalVisible = ref(false);
  const modalMode = ref<'create' | 'edit'>('create');
  const editingId = ref<string | null>(null);
  const modalModel = ref<AssetFormModel>(emptyForm());

  function openCreate() {
    modalMode.value = 'create';
    editingId.value = null;
    modalModel.value = emptyForm();
    modalVisible.value = true;
  }

  function openEdit(asset: AssetListItem) {
    modalMode.value = 'edit';
    editingId.value = asset.id;
    modalModel.value = {
      name: asset.name,
      assetType: asset.assetType,
      version: asset.version,
      status: asset.status,
      artist: asset.artist,
      size: asset.size,
      format: asset.format,
      usedInScenes: [...asset.usedInScenes],
      qualityCheck: asset.qualityCheck,
    };
    modalVisible.value = true;
  }

  function closeModal() {
    modalVisible.value = false;
  }

  async function submitModal() {
    const m = modalModel.value;
    if (!m.name.trim()) {
      message.warning('请填写资产名称');
      return;
    }
    const payload = {
      id: editingId.value ?? nextAssetId(),
      projectId,
      name: m.name.trim(),
      assetType: m.assetType,
      version: m.version,
      status: m.status,
      artist: m.artist,
      size: m.size,
      format: m.format,
      usedInScenes: m.usedInScenes,
      qualityCheck: m.qualityCheck,
    };
    try {
      if (modalMode.value === 'create') {
        await createAsset(projectId, payload);
        message.success('资产已创建');
      } else {
        await updateAsset(projectId, payload);
        message.success('资产已保存');
      }
      closeModal();
      await reload();
    } catch (error) {
      console.error(error);
      message.error('保存失败，请重试');
    }
  }

  /** ---------- 删除 ---------- */
  async function remove(asset: AssetListItem) {
    try {
      await deleteAsset(projectId, asset.id);
      if (detailAsset.value?.id === asset.id) detailAsset.value = null;
      await reload();
      message.success('已删除');
    } catch (error) {
      console.error(error);
      message.error('删除失败');
    }
  }

  /** ---------- 重置筛选 ---------- */
  function resetFilters() {
    keyword.value = '';
    typeFilter.value = 'all';
    statusFilter.value = 'all';
  }

  /** ---------- 数据加载 ---------- */
  async function load() {
    loading.value = true;
    try {
      assets.value = await fetchAssets(projectId);
    } catch (error) {
      console.error('load assets failed', error);
      message.error('资产清单加载失败');
    } finally {
      loading.value = false;
    }
  }

  async function reload() {
    assets.value = await fetchAssets(projectId);
  }

  function nextAssetId(): string {
    const count = assets.value.length;
    return `DA-${String(count + 1).padStart(3, '0')}`;
  }

  return {
    project,
    projectName,
    // 数据
    loading,
    assets,
    filteredAssets,
    stats,
    // 视图与筛选
    viewMode,
    typeFilter,
    statusFilter,
    keyword,
    resetFilters,
    // 场次
    sceneOptions,
    sceneLabel,
    // 详情
    detailAsset,
    openDetail,
    closeDetail,
    // 弹窗
    modalVisible,
    modalMode,
    modalModel,
    openCreate,
    openEdit,
    closeModal,
    submitModal,
    // 删除
    remove,
    // 加载
    load,
  };
}

export type AssetListPageContext = ReturnType<typeof useAssetListPage>;

export const assetListPageKey: InjectionKey<AssetListPageContext> = Symbol('asset-list-page');

export function useAssetListPageContext(): AssetListPageContext {
  const context = inject(assetListPageKey);
  if (!context) {
    throw new Error('useAssetListPageContext 必须在 AssetListWorkspace 内使用');
  }
  return context;
}