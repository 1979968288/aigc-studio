<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { fetchPipelineTemplates } from '../../api';
import type { PipelineTemplate, ProjectSummary } from '../../types';
import { SETTINGS_MENU_GROUPS } from '../constants';

defineOptions({ name: 'ProjectSettingsPanel' });

const props = defineProps<{
  project: ProjectSummary;
  saving: boolean;
}>();

const emit = defineEmits<{
  (event: 'save', patch: Record<string, unknown>): void;
}>();

const activePanel = ref<string>('segments');
const templates = ref<PipelineTemplate[]>([]);

const expandedGroups = ref<string[]>(SETTINGS_MENU_GROUPS.map((group) => group.key));

watch(
  () => props.project.id,
  async () => {
    templates.value = await fetchPipelineTemplates();
  },
  { immediate: true }
);

const settingsGroups = computed(() => SETTINGS_MENU_GROUPS);

const infoForm = reactive({
  name: '',
  type_name: '',
  status: 1,
  description: '',
  planned_delivery: '',
});

watch(
  () => props.project,
  (project) => {
    infoForm.name = project.name;
    infoForm.type_name = project.type_name;
    infoForm.status = project.status;
    infoForm.description = project.description;
    infoForm.planned_delivery = project.planned_delivery;
  },
  { immediate: true }
);

function toggleGroup(key: string): void {
  const index = expandedGroups.value.indexOf(key);
  if (index >= 0) {
    expandedGroups.value.splice(index, 1);
  } else {
    expandedGroups.value.push(key);
  }
}

function isGroupExpanded(key: string): boolean {
  return expandedGroups.value.includes(key);
}

function submitInfo(): void {
  if (!infoForm.name.trim()) {
    message.warning('项目名称不能为空');
    return;
  }
  emit('save', {
    name: infoForm.name.trim(),
    type_name: infoForm.type_name,
    status: infoForm.status,
    description: infoForm.description,
    planned_delivery: infoForm.planned_delivery,
  });
}
</script>

<template>
  <div class="project-settings">
    <!-- 左侧分组导航 -->
    <nav class="settings-nav">
      <div v-for="group in settingsGroups" :key="group.key" class="settings-nav__group">
        <button
          type="button"
          class="settings-nav__group-label"
          :aria-expanded="isGroupExpanded(group.key)"
          @click="toggleGroup(group.key)"
        >
          <span>{{ group.label }}</span>
          <span class="settings-nav__group-count">{{ group.children.length }}</span>
        </button>
        <div v-if="isGroupExpanded(group.key)" class="settings-nav__children">
          <button
            v-for="child in group.children"
            :key="child.key"
            type="button"
            class="settings-nav__item"
            :class="{ 'settings-nav__item--active': activePanel === child.key }"
            @click="activePanel = child.key"
          >
            {{ child.label }}
          </button>
        </div>
      </div>
    </nav>

    <!-- 右侧面板 -->
    <div class="settings-content">
      <!-- 环节配置 -->
      <template v-if="activePanel === 'segments'">
        <div class="settings-header">
          <h3>环节配置</h3>
          <p>环节按当前管线模板自动生成，切换模板请前往「管线管理」或制作信息。</p>
        </div>
        <div class="segment-chain">
          <template v-for="(step, index) in project.pipelineSteps" :key="step">
            <span class="segment-node">
              <span class="segment-node__index">{{ index + 1 }}</span>
              {{ step }}
            </span>
            <span v-if="index < project.pipelineSteps.length - 1" class="segment-arrow">→</span>
          </template>
        </div>
        <div class="settings-hint">
          当前模板：<strong>{{ project.pipelineLabel }}</strong>
        </div>
      </template>

      <!-- 管线管理 -->
      <template v-else-if="activePanel === 'pipelines'">
        <div class="settings-header">
          <h3>管线管理</h3>
          <p>项目可用的生产管线模板，切换后项目的工序链随之更新。</p>
        </div>
        <div class="template-list">
          <div
            v-for="template in templates"
            :key="template.key"
            class="template-card"
            :class="{ 'template-card--active': template.key === project.pipeline_template }"
          >
            <div class="template-card__head">
              <h4>{{ template.label }}</h4>
              <a-tag v-if="template.key === project.pipeline_template" color="geekblue">
                当前使用
              </a-tag>
            </div>
            <p class="template-card__desc">{{ template.description }}</p>
            <div class="template-card__steps">
              <template v-for="(step, index) in template.steps" :key="step">
                <span class="template-step">{{ step }}</span>
                <span v-if="index < template.steps.length - 1" class="template-arrow">→</span>
              </template>
            </div>
            <a-button
              v-if="template.key !== project.pipeline_template"
              size="small"
              class="template-card__switch"
              :loading="saving"
              @click="emit('save', { pipeline_template: template.key })"
            >
              切换为该模板
            </a-button>
          </div>
        </div>
      </template>

      <!-- 项目信息 -->
      <template v-else>
        <div class="settings-header">
          <h3>项目信息</h3>
          <p>项目的基础信息编辑，保存后全站同步生效。</p>
        </div>
        <a-form layout="vertical" class="info-form">
          <a-form-item label="项目名称" required>
            <a-input v-model:value="infoForm.name" :maxlength="40" show-count />
          </a-form-item>
          <div class="form-row">
            <a-form-item label="项目类型" class="form-row-item">
              <a-select
                v-model:value="infoForm.type_name"
                :options="['短片', 'TVC', '漫剧', '演示视频', '宣传片'].map((t) => ({ label: t, value: t }))"
              />
            </a-form-item>
            <a-form-item label="项目状态" class="form-row-item">
              <a-select
                v-model:value="infoForm.status"
                :options="[
                  { label: '草稿', value: 0 },
                  { label: '筹备中', value: 1 },
                  { label: '制作中', value: 2 },
                  { label: '已暂停', value: 3 },
                  { label: '已归档', value: 4 },
                  { label: '已取消', value: 5 },
                ]"
              />
            </a-form-item>
          </div>
          <a-form-item label="计划交付日期">
            <a-date-picker
              :value="infoForm.planned_delivery || undefined"
              value-format="YYYY-MM-DD"
              style="width: 100%"
              @change="(_: unknown, dateStr: string) => (infoForm.planned_delivery = dateStr)"
            />
          </a-form-item>
          <a-form-item label="项目描述">
            <a-textarea v-model:value="infoForm.description" :rows="4" :maxlength="120" show-count />
          </a-form-item>
          <a-button type="primary" :loading="saving" @click="submitInfo">保存修改</a-button>
        </a-form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.project-settings {
  display: flex;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--component-panel-border);
  border-radius: var(--radius-4);
  background: var(--component-panel-background);
  overflow: hidden;
}

.settings-nav {
  width: 190px;
  flex-shrink: 0;
  padding: var(--spacing-3) var(--spacing-2);
  border-right: 1px solid var(--color-border-divider);
  overflow-y: auto;
}

.settings-nav__group {
  margin-bottom: var(--spacing-2);
}

.settings-nav__group-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.settings-nav__group-label:hover {
  background: var(--color-bg-hover);
}

.settings-nav__group-count {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.settings-nav__children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 10px;
}

.settings-nav__item {
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.settings-nav__item:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.settings-nav__item--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 600;
}

.settings-content {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: var(--spacing-5) var(--spacing-6);
}

.settings-header h3 {
  margin: 0;
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.settings-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.settings-header {
  margin-bottom: var(--spacing-4);
  padding-bottom: var(--spacing-3);
  border-bottom: 1px solid var(--color-border-divider);
}

/* 环节链 */
.segment-chain {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
}

.segment-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--color-action-primary) 38%, transparent);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: 13px;
  font-weight: 600;
}

.segment-node__index {
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-action-primary);
  color: #fff;
  font-size: 11px;
}

.segment-arrow {
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.settings-hint {
  margin-top: var(--spacing-3);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.settings-hint strong {
  color: var(--color-action-primary);
}

/* 模板列表 */
.template-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.template-card {
  padding: var(--spacing-4);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
}

.template-card--active {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 1px var(--color-action-primary);
}

.template-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.template-card__head h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.template-card__desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.template-card__steps {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: var(--spacing-3);
}

.template-step {
  height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: 12px;
  font-weight: 600;
}

.template-arrow {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.template-card__switch {
  margin-top: var(--spacing-3);
}

/* 项目信息表单 */
.info-form {
  max-width: 520px;
}

.form-row {
  display: flex;
  gap: var(--spacing-4);
}

.form-row-item {
  flex: 1;
  min-width: 0;
}
</style>
