import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { fetchProduction } from '@/modules/production/api';
import {
  ASSET_STATUS_META,
  SCENE_STATUS_META,
  TASK_STATUS_META,
} from '@/modules/production/constants';
import type {
  PCAsset,
  PCScene,
  PCTask,
  PCScriptRecord,
} from '@/modules/production/types';
import type {
  CheckStatus,
  DataListAllRow,
  DataListAssetRow,
  DataListSceneRow,
  DataListScriptRow,
  DataListTab,
  DataListTaskRow,
  ProgressStatus,
  TabProgressStats,
} from './types';

/**
 * 核对判定规则（AIGC 管线断链检测）：
 * - 场次：未拆任务（下游无生成任务）、资产未就绪（就绪 < 需求）
 * - 任务：场次缺失（上游场次被删/不存在）、依赖未完成（前置工序未完成）
 * - 资产：未被引用（孤儿资产）、质检未过
 */
function computeSceneIssues(scene: PCScene, taskCount: number): string[] {
  const issues: string[] = [];
  if (taskCount === 0) issues.push('未拆任务');
  if (scene.assetsTotal > 0 && scene.assetsReady < scene.assetsTotal) issues.push('资产未就绪');
  return issues;
}

function computeTaskIssues(task: PCTask, sceneExists: boolean, taskDone: Map<string, boolean>): string[] {
  const issues: string[] = [];
  if (!sceneExists) issues.push('场次缺失');
  if ((task.dependencies ?? []).some((id) => !(taskDone.get(id) ?? true))) {
    issues.push('依赖未完成');
  }
  return issues;
}

function computeAssetIssues(asset: PCAsset): string[] {
  const issues: string[] = [];
  if ((asset.usedInScenes ?? []).length === 0) issues.push('未被引用');
  if (asset.qualityCheck !== 'PASS') issues.push('质检未过');
  return issues;
}

/** 进度状态映射（四段式统计，对齐 KK progress_status 自动计算） */
function sceneProgressOf(scene: PCScene): ProgressStatus {
  if (scene.status === 'completed') return 'completed';
  if (scene.status === 'in_progress') return 'in_progress';
  return 'not_started';
}

function taskProgressOf(task: PCTask): ProgressStatus {
  if (task.status === 'completed') return 'completed';
  if (task.status === 'in_progress') return 'in_progress';
  return 'not_started';
}

function assetProgressOf(asset: PCAsset): ProgressStatus {
  if (asset.status === '已发布') return 'completed';
  if (asset.status === '制作中' || asset.status === '审核中' || asset.status === '修订中') {
    return 'in_progress';
  }
  return 'not_started';
}

/** 核对状态：有断链问题即需要修复 */
function checkOf(issues: string[]): CheckStatus {
  return issues.length > 0 ? 'need_fix' : 'ok';
}

function summarize(rows: { progressStatus: ProgressStatus }[]): TabProgressStats {
  return {
    total: rows.length,
    notStarted: rows.filter((row) => row.progressStatus === 'not_started').length,
    inProgress: rows.filter((row) => row.progressStatus === 'in_progress').length,
    completed: rows.filter((row) => row.progressStatus === 'completed').length,
  };
}

export function useDataListPage(projectId: string) {
  const loading = ref(true);
  const activeTab = ref<DataListTab>('all');
  const keyword = ref('');
  /** 统计卡点击施加的进度筛选（仅作用于当前 Tab，对齐 KK 统计卡点击过滤） */
  const statusFilter = ref<ProgressStatus | null>(null);
  /** 统计区折叠态（对齐 KK CollapsibleStatsSection） */
  const statsCollapsed = ref(false);

  const scripts = ref<PCScriptRecord[]>([]);
  const scenes = ref<PCScene[]>([]);
  const tasks = ref<PCTask[]>([]);
  const assets = ref<PCAsset[]>([]);

  const kw = computed(() => keyword.value.trim().toLowerCase());

  /** 切 Tab 时清空进度筛选（筛选仅属于当前 Tab） */
  watch(activeTab, () => {
    statusFilter.value = null;
  });

  const sceneMap = computed(() => {
    const map = new Map<string, PCScene>();
    scenes.value.forEach((scene) => map.set(scene.id, scene));
    return map;
  });

  const taskCountByScene = computed(() => {
    const map = new Map<string, number>();
    tasks.value.forEach((task) => map.set(task.sceneId, (map.get(task.sceneId) ?? 0) + 1));
    return map;
  });

  const taskDoneMap = computed(() => {
    const map = new Map<string, boolean>();
    tasks.value.forEach((task) => map.set(task.id, task.status === 'completed'));
    return map;
  });

  /** 剧本 → 打平成段落行 */
  const scriptRows = computed<DataListScriptRow[]>(() => {
    const rows: DataListScriptRow[] = [];
    scripts.value.forEach((script) => {
      script.acts.forEach((act) => {
        act.scenes.forEach((text) => {
          rows.push({
            id: text.id,
            scriptName: script.name,
            versionNo: script.versionNo,
            actName: act.name,
            sceneTitle: text.title,
            preview: text.paragraphs.join(' '),
          });
        });
      });
    });
    return rows;
  });

  const sceneRows = computed<DataListSceneRow[]>(() =>
    scenes.value.map((scene) => {
      const issues = computeSceneIssues(scene, taskCountByScene.value.get(scene.id) ?? 0);
      return {
        ...scene,
        issues,
        progressStatus: sceneProgressOf(scene),
        checkStatus: checkOf(issues),
      };
    })
  );

  const taskRows = computed<DataListTaskRow[]>(() =>
    tasks.value.map((task) => {
      const issues = computeTaskIssues(task, sceneMap.value.has(task.sceneId), taskDoneMap.value);
      return {
        ...task,
        sceneNo: sceneMap.value.get(task.sceneId)?.sceneNo ?? '',
        sceneName: sceneMap.value.get(task.sceneId)?.name ?? '',
        issues,
        progressStatus: taskProgressOf(task),
        checkStatus: checkOf(issues),
      };
    })
  );

  const assetRows = computed<DataListAssetRow[]>(() =>
    assets.value.map((asset) => {
      const issues = computeAssetIssues(asset);
      return {
        ...asset,
        issues,
        progressStatus: assetProgressOf(asset),
        checkStatus: checkOf(issues),
      };
    })
  );

  /** 全部 Tab：四类对象打平为同一张表（不分类分区） */
  const allRows = computed<DataListAllRow[]>(() => {
    const rows: DataListAllRow[] = [];

    scriptRows.value.forEach((row) => {
      rows.push({
        id: `script-${row.id}`,
        category: '剧本',
        code: '—',
        name: `${row.actName} · ${row.sceneTitle}`,
        // 剧本段为已产出文本内容，无制作进度与断链检测
        statusText: '—',
        statusColor: 'var(--color-text-tertiary)',
        progressStatus: 'completed',
        issues: [],
        checkStatus: 'ok',
      });
    });

    sceneRows.value.forEach((row) => {
      rows.push({
        id: `scene-${row.id}`,
        category: '场次',
        code: row.sceneNo ?? '—',
        name: row.name,
        statusText: SCENE_STATUS_META[row.status].label,
        statusColor: SCENE_STATUS_META[row.status].color,
        progressStatus: row.progressStatus,
        issues: row.issues,
        checkStatus: row.checkStatus,
      });
    });

    taskRows.value.forEach((row) => {
      rows.push({
        id: `task-${row.id}`,
        category: '任务',
        code: row.code ?? '—',
        name: row.stage || row.description || '—',
        statusText: TASK_STATUS_META[row.status].label,
        statusColor: TASK_STATUS_META[row.status].color,
        progressStatus: row.progressStatus,
        issues: row.issues,
        checkStatus: row.checkStatus,
      });
    });

    assetRows.value.forEach((row) => {
      rows.push({
        id: `asset-${row.id}`,
        category: '资产',
        code: row.id,
        name: row.name,
        statusText: ASSET_STATUS_META[row.status].label,
        statusColor: ASSET_STATUS_META[row.status].color,
        progressStatus: row.progressStatus,
        issues: row.issues,
        checkStatus: row.checkStatus,
      });
    });

    return rows;
  });

  const filteredScripts = computed(() => {
    if (!kw.value) return scriptRows.value;
    return scriptRows.value.filter((row) =>
      [row.scriptName, row.actName, row.sceneTitle, row.preview]
        .join(' ')
        .toLowerCase()
        .includes(kw.value)
    );
  });

  const filteredScenes = computed(() => {
    let rows = sceneRows.value;
    if (statusFilter.value) {
      rows = rows.filter((row) => row.progressStatus === statusFilter.value);
    }
    if (!kw.value) return rows;
    return rows.filter((scene) =>
      [scene.sceneNo, scene.name, scene.type, scene.location, scene.assigneeName, scene.characters.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(kw.value)
    );
  });

  const filteredTasks = computed(() => {
    let rows = taskRows.value;
    if (statusFilter.value) {
      rows = rows.filter((row) => row.progressStatus === statusFilter.value);
    }
    if (!kw.value) return rows;
    return rows.filter((task) =>
      [task.code, task.sceneNo, task.sceneName, task.stage, task.responsible, task.department, task.description]
        .join(' ')
        .toLowerCase()
        .includes(kw.value)
    );
  });

  const filteredAssets = computed(() => {
    let rows = assetRows.value;
    if (statusFilter.value) {
      rows = rows.filter((row) => row.progressStatus === statusFilter.value);
    }
    if (!kw.value) return rows;
    return rows.filter((asset) =>
      [asset.id, asset.name, asset.assetType, asset.artist]
        .join(' ')
        .toLowerCase()
        .includes(kw.value)
    );
  });

  const filteredAll = computed(() => {
    let rows = allRows.value;
    if (statusFilter.value) {
      rows = rows.filter((row) => row.progressStatus === statusFilter.value);
    }
    if (!kw.value) return rows;
    return rows.filter((row) =>
      [row.category, row.code, row.name, row.statusText]
        .join(' ')
        .toLowerCase()
        .includes(kw.value)
    );
  });

  /** 各 Tab 四段式统计 */
  const allStats = computed(() => summarize(allRows.value));
  const sceneStats = computed(() => summarize(sceneRows.value));
  const taskStats = computed(() => summarize(taskRows.value));
  const assetStats = computed(() => summarize(assetRows.value));
  const scriptCount = computed(() => scriptRows.value.length);

  /** 当前 Tab 统计（剧本 Tab 无进度统计，返回 null） */
  const activeStats = computed<TabProgressStats | null>(() => {
    switch (activeTab.value) {
      case 'all':
        return allStats.value;
      case 'scene':
        return sceneStats.value;
      case 'task':
        return taskStats.value;
      case 'asset':
        return assetStats.value;
      default:
        return null;
    }
  });

  /** 统计卡点击：施加/取消进度筛选（再点一次取消） */
  function applyStatusFilter(status: ProgressStatus | null): void {
    if (status === null || statusFilter.value === status) {
      statusFilter.value = null;
    } else {
      statusFilter.value = status;
    }
  }

  async function load(): Promise<void> {
    loading.value = true;
    try {
      const data = await fetchProduction(projectId);
      scripts.value = data.scripts ?? [];
      scenes.value = data.scenes ?? [];
      tasks.value = data.tasks ?? [];
      assets.value = data.assets ?? [];
    } catch (error) {
      console.error('load data list failed', error);
      message.error('数据清单加载失败');
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    activeTab,
    keyword,
    statusFilter,
    statsCollapsed,
    filteredAll,
    filteredScripts,
    filteredScenes,
    filteredTasks,
    filteredAssets,
    activeStats,
    scriptCount,
    applyStatusFilter,
    load,
  };
}

export type DataListPageContext = ReturnType<typeof useDataListPage>;
