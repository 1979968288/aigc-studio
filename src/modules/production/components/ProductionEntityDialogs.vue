<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useProductionCenter } from '../useProductionCenterPage';
import { readStaffList, resolveStaffName } from '@/modules/staff/api';
import RefImageUploader from '@/shared/components/RefImageUploader.vue';
import { GEN_MODEL_GROUPS } from '@/shared/aigc/genConfig';
import {
  ASSET_STATUS_META,
  ASSET_TYPES,
  RISK_LEVEL_META,
  SCENE_STATUS_META,
  TASK_STATUS_META,
} from '../constants';
import type {
  AssetStatus,
  AssetTypeName,
  PCAsset,
  PCScene,
  PCTask,
  RiskLevel,
  SceneStatus,
  TaskStatus,
} from '../types';

defineOptions({ name: 'ProductionEntityDialogs' });

const ctx = useProductionCenter();

const STAGE_OPTIONS = ['美术关键帧', '图生视频', '对口型', '精修合成'];

const sceneStatusOptions = (Object.keys(SCENE_STATUS_META) as SceneStatus[]).map((value) => ({
  value,
  label: SCENE_STATUS_META[value].label,
}));
const taskStatusOptions = (Object.keys(TASK_STATUS_META) as TaskStatus[]).map((value) => ({
  value,
  label: TASK_STATUS_META[value].label,
}));
const riskOptions = (Object.keys(RISK_LEVEL_META) as RiskLevel[]).map((value) => ({
  value,
  label: RISK_LEVEL_META[value].label,
}));
const assetStatusOptions = (Object.keys(ASSET_STATUS_META) as AssetStatus[]).map((value) => ({
  value,
  label: ASSET_STATUS_META[value].label,
}));
const assetTypeOptions = ASSET_TYPES.map((value) => ({ value, label: value }));
const stageOptions = STAGE_OPTIONS.map((value) => ({ value, label: value }));
/** 生成模型分组选项（图像 / 视频 / 音频） */
const genModelGroups = GEN_MODEL_GROUPS.map((group) => ({
  label: group.label,
  options: group.options.map((option) => ({ value: option.value, label: option.label })),
}));

const sceneOptions = computed(() =>
  ctx.scenes.value.map((scene) => ({
    value: scene.id,
    label: `${scene.sceneNo ?? scene.id} · ${scene.name}`,
  }))
);

/** 人员选择项（在职人员，值为 userId） */
const staffOptions = computed(() =>
  readStaffList()
    .filter((user) => user.employmentStatus === 'active')
    .map((user) => ({ value: user.id, label: user.name }))
);

/** ---------- 新建 ---------- */
const createOpen = computed(() => ctx.createDialogType.value !== null);
const createType = computed(() => ctx.createDialogType.value);
const createTitle = computed(() => {
  const map: Record<string, string> = {
    scene: '新建场次',
    task: '新建任务',
    asset: '新建资产',
  };
  return createType.value ? map[createType.value] : '';
});

const createSceneForm = reactive({
  name: '',
  type: '内景·昼戏',
  duration: '0:15',
  status: 'draft' as SceneStatus,
  riskLevel: 'low' as RiskLevel,
  characters: '',
  location: '',
  schedule: '',
  assigneeName: '',
});

const createTaskForm = reactive({
  sceneId: '',
  stage: '美术关键帧',
  status: 'pending' as TaskStatus,
  responsible: '',
  startTime: '09:00',
  endTime: '18:00',
  location: '',
  description: '',
  prompt: '',
  genModel: '',
  refImages: [] as string[],
});

const createAssetForm = reactive({
  name: '',
  assetType: '角色资产' as AssetTypeName,
  version: 'v1.0',
  status: '草稿' as AssetStatus,
  artist: '',
  size: '-',
  format: 'PNG',
});

function resetCreateForms(): void {
  Object.assign(createSceneForm, {
    name: '',
    type: '内景·昼戏',
    duration: '0:15',
    status: 'draft',
    riskLevel: 'low',
    characters: '',
    location: '',
    schedule: '',
    assigneeName: '',
  });
  Object.assign(createTaskForm, {
    sceneId: ctx.scenes.value[0]?.id ?? '',
    stage: '美术关键帧',
    status: 'pending',
    responsible: '',
    startTime: '09:00',
    endTime: '18:00',
    location: '',
    description: '',
    prompt: '',
    genModel: '',
    refImages: [],
  });
  Object.assign(createAssetForm, {
    name: '',
    assetType: '角色资产',
    version: 'v1.0',
    status: '草稿',
    artist: '',
    size: '-',
    format: 'PNG',
  });
}

watch(createOpen, (open) => {
  if (open) resetCreateForms();
});

async function handleCreateSave(): Promise<void> {
  if (!createType.value) return;
  let payload: Record<string, unknown>;
  if (createType.value === 'scene') {
    payload = { ...createSceneForm };
  } else if (createType.value === 'task') {
    payload = { ...createTaskForm };
  } else {
    payload = { ...createAssetForm };
  }
  await ctx.submitCreate(createType.value, payload);
}

/** ---------- 编辑 ---------- */
const editOpen = computed(() => ctx.editDialog.value !== null);
const editType = computed(() => ctx.editDialog.value?.type ?? null);
const editTitle = computed(() => {
  const map: Record<string, string> = {
    scene: '编辑场次',
    task: '编辑任务',
    asset: '编辑资产',
  };
  return editType.value ? map[editType.value] : '';
});

const editSceneForm = reactive({
  name: '',
  type: '',
  duration: '',
  status: 'draft' as SceneStatus,
  riskLevel: 'low' as RiskLevel,
  characters: '',
  location: '',
  schedule: '',
  assigneeName: '',
});

const editTaskForm = reactive({
  sceneId: '',
  stage: '',
  status: 'pending' as TaskStatus,
  responsible: '',
  startTime: '',
  endTime: '',
  location: '',
  description: '',
  prompt: '',
  genModel: '',
  refImages: [] as string[],
});

const editAssetForm = reactive({
  name: '',
  assetType: '角色资产' as AssetTypeName,
  version: '',
  status: '草稿' as AssetStatus,
  artist: '',
  size: '',
  format: '',
});

watch(editOpen, (open) => {
  if (!open) return;
  const dialog = ctx.editDialog.value;
  if (!dialog) return;
  if (dialog.type === 'scene') {
    const scene = dialog.item as PCScene;
    Object.assign(editSceneForm, {
      name: scene.name,
      type: scene.type,
      duration: scene.duration,
      status: scene.status,
      riskLevel: scene.riskLevel,
      characters: scene.characters.join('、'),
      location: scene.location,
      schedule: scene.schedule,
      assigneeName: scene.assigneeName ?? '',
    });
  } else if (dialog.type === 'task') {
    const task = dialog.item as PCTask;
    Object.assign(editTaskForm, {
      sceneId: task.sceneId,
      stage: task.stage ?? '',
      status: task.status,
      responsible: task.responsible,
      startTime: task.startTime,
      endTime: task.endTime,
      location: task.location,
      description: task.description ?? '',
      prompt: task.prompt ?? '',
      genModel: task.genModel ?? '',
      refImages: task.refImages ? [...task.refImages] : [],
    });
  } else if (dialog.type === 'asset') {
    const asset = dialog.item as PCAsset;
    Object.assign(editAssetForm, {
      name: asset.name,
      assetType: asset.assetType,
      version: asset.version,
      status: asset.status,
      artist: asset.artist,
      size: asset.size,
      format: asset.format,
    });
  }
});

async function handleEditSave(): Promise<void> {
  const dialog = ctx.editDialog.value;
  if (!dialog) return;
  const item = dialog.item as PCScene | PCTask | PCAsset;
  let merged: PCScene | PCTask | PCAsset;
  if (dialog.type === 'scene') {
    merged = {
      ...(item as PCScene),
      name: editSceneForm.name,
      type: editSceneForm.type,
      duration: editSceneForm.duration,
      status: editSceneForm.status,
      riskLevel: editSceneForm.riskLevel,
      characters: editSceneForm.characters
        .split(/[、,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
      location: editSceneForm.location,
      schedule: editSceneForm.schedule,
      assigneeName: editSceneForm.assigneeName,
    };
  } else if (dialog.type === 'task') {
    merged = {
      ...(item as PCTask),
      sceneId: editTaskForm.sceneId,
      stage: editTaskForm.stage,
      status: editTaskForm.status,
      responsible: editTaskForm.responsible,
      startTime: editTaskForm.startTime,
      endTime: editTaskForm.endTime,
      location: editTaskForm.location,
      description: editTaskForm.description,
      prompt: editTaskForm.prompt.trim() || undefined,
      genModel: editTaskForm.genModel || undefined,
      refImages: editTaskForm.refImages.length ? [...editTaskForm.refImages] : undefined,
    };
  } else {
    merged = {
      ...(item as PCAsset),
      name: editAssetForm.name,
      assetType: editAssetForm.assetType,
      version: editAssetForm.version,
      status: editAssetForm.status,
      artist: editAssetForm.artist,
      size: editAssetForm.size,
      format: editAssetForm.format,
    };
  }
  await ctx.submitEdit(merged);
}
</script>

<template>
  <!-- 新建 -->
  <a-modal
    :open="createOpen"
    :title="createTitle"
    :footer="null"
    width="520px"
    @cancel="ctx.closeCreateDialog"
  >
    <a-form layout="vertical">
      <template v-if="createType === 'scene'">
        <a-form-item label="场次名称" required>
          <a-input v-model:value="createSceneForm.name" placeholder="请输入场次名称" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="类型">
            <a-input v-model:value="createSceneForm.type" />
          </a-form-item>
          <a-form-item label="时长">
            <a-input v-model:value="createSceneForm.duration" placeholder="如 0:15" />
          </a-form-item>
        </div>
        <div class="pc-dialog-grid">
          <a-form-item label="状态">
            <a-select v-model:value="createSceneForm.status" :options="sceneStatusOptions" />
          </a-form-item>
          <a-form-item label="风险">
            <a-select v-model:value="createSceneForm.riskLevel" :options="riskOptions" />
          </a-form-item>
        </div>
        <a-form-item label="相关角色">
          <a-input v-model:value="createSceneForm.characters" placeholder="用、分隔，如 白小满、萤络" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="地点">
            <a-input v-model:value="createSceneForm.location" />
          </a-form-item>
          <a-form-item label="排期">
            <a-input v-model:value="createSceneForm.schedule" placeholder="如 2026-09-02" />
          </a-form-item>
        </div>
        <a-form-item label="负责人">
          <a-select
            v-model:value="createSceneForm.assigneeName"
            :options="staffOptions"
            placeholder="请选择负责人"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </template>

      <template v-else-if="createType === 'task'">
        <a-form-item label="所属场次" required>
          <a-select v-model:value="createTaskForm.sceneId" :options="sceneOptions" placeholder="请选择场次" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="工序">
            <a-select v-model:value="createTaskForm.stage" :options="stageOptions" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="createTaskForm.status" :options="taskStatusOptions" />
          </a-form-item>
        </div>
        <a-form-item label="负责人">
          <a-select
            v-model:value="createTaskForm.responsible"
            :options="staffOptions"
            placeholder="请选择负责人"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="开始">
            <a-input v-model:value="createTaskForm.startTime" />
          </a-form-item>
          <a-form-item label="结束">
            <a-input v-model:value="createTaskForm.endTime" />
          </a-form-item>
        </div>
        <a-form-item label="地点">
          <a-input v-model:value="createTaskForm.location" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="createTaskForm.description" :rows="2" />
        </a-form-item>

        <div class="pc-dialog-section">生成数据</div>
        <a-form-item label="提示词">
          <a-textarea
            v-model:value="createTaskForm.prompt"
            :rows="3"
            placeholder="记录该镜头 / 图像的生成提示词，便于复现与追溯"
          />
        </a-form-item>
        <a-form-item label="所用模型">
          <a-select
            v-model:value="createTaskForm.genModel"
            :options="genModelGroups"
            placeholder="选择生成模型"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <a-form-item label="参考图">
          <RefImageUploader v-model="createTaskForm.refImages" :max="3" />
        </a-form-item>
      </template>

      <template v-else-if="createType === 'asset'">
        <a-form-item label="资产名称" required>
          <a-input v-model:value="createAssetForm.name" placeholder="请输入资产名称" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="资产类型">
            <a-select v-model:value="createAssetForm.assetType" :options="assetTypeOptions" />
          </a-form-item>
          <a-form-item label="版本">
            <a-input v-model:value="createAssetForm.version" />
          </a-form-item>
        </div>
        <a-form-item label="状态">
          <a-select v-model:value="createAssetForm.status" :options="assetStatusOptions" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="制作">
            <a-select
              v-model:value="createAssetForm.artist"
              :options="staffOptions"
              placeholder="请选择制作人员"
              allow-clear
              show-search
              option-filter-prop="label"
            />
          </a-form-item>
          <a-form-item label="格式">
            <a-input v-model:value="createAssetForm.format" />
          </a-form-item>
        </div>
        <a-form-item label="大小">
          <a-input v-model:value="createAssetForm.size" />
        </a-form-item>
      </template>
    </a-form>
    <div class="pc-dialog-actions">
      <a-button @click="ctx.closeCreateDialog">取消</a-button>
      <a-button type="primary" @click="handleCreateSave">确定</a-button>
    </div>
  </a-modal>

  <!-- 编辑 -->
  <a-modal
    :open="editOpen"
    :title="editTitle"
    :footer="null"
    width="520px"
    @cancel="ctx.closeEditDialog"
  >
    <a-form layout="vertical">
      <template v-if="editType === 'scene'">
        <a-form-item label="场次名称" required>
          <a-input v-model:value="editSceneForm.name" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="类型">
            <a-input v-model:value="editSceneForm.type" />
          </a-form-item>
          <a-form-item label="时长">
            <a-input v-model:value="editSceneForm.duration" />
          </a-form-item>
        </div>
        <div class="pc-dialog-grid">
          <a-form-item label="状态">
            <a-select v-model:value="editSceneForm.status" :options="sceneStatusOptions" />
          </a-form-item>
          <a-form-item label="风险">
            <a-select v-model:value="editSceneForm.riskLevel" :options="riskOptions" />
          </a-form-item>
        </div>
        <a-form-item label="相关角色">
          <a-input v-model:value="editSceneForm.characters" placeholder="用、分隔" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="地点">
            <a-input v-model:value="editSceneForm.location" />
          </a-form-item>
          <a-form-item label="排期">
            <a-input v-model:value="editSceneForm.schedule" />
          </a-form-item>
        </div>
        <a-form-item label="负责人">
          <a-select
            v-model:value="editSceneForm.assigneeName"
            :options="staffOptions"
            placeholder="请选择负责人"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </template>

      <template v-else-if="editType === 'task'">
        <a-form-item label="所属场次" required>
          <a-select v-model:value="editTaskForm.sceneId" :options="sceneOptions" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="工序">
            <a-select v-model:value="editTaskForm.stage" :options="stageOptions" />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="editTaskForm.status" :options="taskStatusOptions" />
          </a-form-item>
        </div>
        <a-form-item label="负责人">
          <a-select
            v-model:value="editTaskForm.responsible"
            :options="staffOptions"
            placeholder="请选择负责人"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="开始">
            <a-input v-model:value="editTaskForm.startTime" />
          </a-form-item>
          <a-form-item label="结束">
            <a-input v-model:value="editTaskForm.endTime" />
          </a-form-item>
        </div>
        <a-form-item label="地点">
          <a-input v-model:value="editTaskForm.location" />
        </a-form-item>
        <a-form-item label="描述">
          <a-textarea v-model:value="editTaskForm.description" :rows="2" />
        </a-form-item>

        <div class="pc-dialog-section">生成数据</div>
        <a-form-item label="提示词">
          <a-textarea
            v-model:value="editTaskForm.prompt"
            :rows="3"
            placeholder="记录该镜头 / 图像的生成提示词，便于复现与追溯"
          />
        </a-form-item>
        <a-form-item label="所用模型">
          <a-select
            v-model:value="editTaskForm.genModel"
            :options="genModelGroups"
            placeholder="选择生成模型"
            allow-clear
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <a-form-item label="参考图">
          <RefImageUploader v-model="editTaskForm.refImages" :max="3" />
        </a-form-item>
      </template>

      <template v-else-if="editType === 'asset'">
        <a-form-item label="资产名称" required>
          <a-input v-model:value="editAssetForm.name" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="资产类型">
            <a-select v-model:value="editAssetForm.assetType" :options="assetTypeOptions" />
          </a-form-item>
          <a-form-item label="版本">
            <a-input v-model:value="editAssetForm.version" />
          </a-form-item>
        </div>
        <a-form-item label="状态">
          <a-select v-model:value="editAssetForm.status" :options="assetStatusOptions" />
        </a-form-item>
        <div class="pc-dialog-grid">
          <a-form-item label="制作">
            <a-select
              v-model:value="editAssetForm.artist"
              :options="staffOptions"
              placeholder="请选择制作人员"
              allow-clear
              show-search
              option-filter-prop="label"
            />
          </a-form-item>
          <a-form-item label="格式">
            <a-input v-model:value="editAssetForm.format" />
          </a-form-item>
        </div>
        <a-form-item label="大小">
          <a-input v-model:value="editAssetForm.size" />
        </a-form-item>
      </template>
    </a-form>
    <div class="pc-dialog-actions">
      <a-button @click="ctx.closeEditDialog">取消</a-button>
      <a-button type="primary" @click="handleEditSave">保存</a-button>
    </div>
  </a-modal>
</template>

<style scoped>
.pc-dialog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.pc-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-4);
}

.pc-dialog-section {
  margin: var(--spacing-2) 0 var(--spacing-4);
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-secondary);
}
</style>