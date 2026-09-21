<script setup lang="ts">
import { computed, ref } from 'vue';
import { CheckOutlined, DownOutlined, UpOutlined, AppstoreOutlined } from '@ant-design/icons-vue';
import type { DemoProjectDemand } from '@/shared/mock/db';
import {
  projectTypeToneStyle,
  PROJECT_TYPES,
} from '../../create-project-modal/createProjectModalOptions';
import { useCreateProjectModalContext } from '../../create-project-modal/useCreateProjectModal';

defineOptions({ name: 'CreateProjectTemplateStep' });

const {
  clearFieldError,
  currentTemplates,
  demands,
  fieldHelp,
  formData,
  handleDemandChange,
  handleProjectTypeSelect,
  handleTemplateSelect,
  mappedProjectTypeColor,
  mappedProjectTypeName,
  selectedDemandId,
  selectedTemplateId,
} = useCreateProjectModalContext();

const DEFAULT_PROJECT_TYPE_COLOR = 'var(--color-action-primary)';

const templateSwitcherOpen = ref(false);

const demandOptions = computed(() =>
  demands.value.map((item: DemoProjectDemand) => ({
    label: item.title,
    value: item.id,
  }))
);

const selectedDemand = computed(
  () => demands.value.find((item: DemoProjectDemand) => item.id === selectedDemandId.value) ?? null
);

/** 需求单类型展示（映射 KK OA项目类型只读回显） */
const demandTypeDisplayName = computed(
  () => selectedDemand.value?.project_type ?? ''
);

const switchableProjectTypes = computed(() => {
  const usedTypeIds = new Set(currentTemplates.value.map((item) => item.projectTypeId));
  return PROJECT_TYPES.filter((type) => usedTypeIds.has(type.id));
});

function filterDemandOption(input: string, option: unknown): boolean {
  const keyword = input.trim().toLowerCase();
  if (!keyword) return true;
  const raw = option as { label?: unknown } | undefined;
  return String(raw?.label ?? '')
    .toLowerCase()
    .includes(keyword);
}

function onDemandChange(value: unknown): void {
  const id = Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
  handleDemandChange(id);
}
</script>

<template>
  <div class="step-content">
    <div class="step1-grid">
      <div class="section-block" data-validation-field="demand">
        <label class="section-label">项目需求池 <span class="required-star">*</span></label>
        <a-select
          :value="selectedDemandId || undefined"
          class="full-width"
          placeholder="请选择或搜索待立项需求"
          :options="demandOptions"
          show-search
          :filter-option="filterDemandOption"
          allow-clear
          @change="onDemandChange"
        />
        <p v-if="fieldHelp('demand')" class="form-help">{{ fieldHelp('demand') }}</p>
      </div>

      <div class="section-block">
        <label class="section-label">需求项目类型</label>
        <a-input
          :value="demandTypeDisplayName"
          class="full-width"
          placeholder="选择需求单后自动回填"
          disabled
        />
      </div>
    </div>

    <div class="section-block" data-validation-field="name">
      <label class="section-label">项目标题 <span class="required-star">*</span></label>
      <a-input
        v-model:value="formData.name"
        :maxlength="50"
        class="full-width"
        placeholder="请输入项目标题"
        @update:value="clearFieldError('name')"
      />
      <p v-if="fieldHelp('name')" class="form-help">{{ fieldHelp('name') }}</p>
    </div>

    <div class="section-block" data-validation-field="template">
      <div class="template-type-row">
        <div class="template-type-actions">
          <div
            class="template-type-pill"
            aria-label="AIGC项目类型"
            :style="projectTypeToneStyle(mappedProjectTypeColor)"
          >
            <span class="template-type-pill__label">AIGC项目类型：</span>
            <span class="template-type-pill__value">{{ mappedProjectTypeName }}</span>
            <span class="template-type-pill__required">*</span>
          </div>
          <div v-if="switchableProjectTypes.length > 1" class="template-switch-anchor">
            <button
              type="button"
              class="template-switch-button"
              :aria-expanded="templateSwitcherOpen"
              @click="templateSwitcherOpen = !templateSwitcherOpen"
            >
              <span>切换项目类型</span>
              <UpOutlined v-if="templateSwitcherOpen" />
              <DownOutlined v-else />
            </button>
            <div v-if="templateSwitcherOpen" class="template-switch-panel">
              <button
                v-for="type in switchableProjectTypes"
                :key="type.id"
                type="button"
                class="template-switch-option"
                :style="projectTypeToneStyle(type.color)"
                @click="handleProjectTypeSelect(type.id); templateSwitcherOpen = false"
              >
                <span class="template-switch-option__dot"></span>
                <span class="template-switch-option__content">
                  <span class="template-switch-option__name">{{ type.name }}</span>
                  <span class="template-switch-option__desc">{{ type.description }}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!selectedDemandId" class="template-empty">
        <AppstoreOutlined class="empty-icon" />
        <p>请先选择需求单</p>
      </div>

      <div v-else class="template-picker">
        <div class="template-picker__summary">
          <span class="template-picker__summary-title">可用模板</span>
          <span class="template-picker__summary-count">{{ currentTemplates.length }} 个</span>
        </div>
        <div class="template-grid">
          <div
            v-for="tmpl in currentTemplates"
            :key="tmpl.id"
            :class="['template-card', { selected: selectedTemplateId === tmpl.id }]"
            :style="projectTypeToneStyle(tmpl.projectTypeColor)"
            @click="handleTemplateSelect(tmpl.id)"
          >
            <div class="template-card-thumb">
              <span class="thumb-category">{{ tmpl.projectTypeName }}</span>
              <span v-if="tmpl.isDefault" class="thumb-default">默认</span>
            </div>
            <div class="template-card-body">
              <h4 class="template-card-name">{{ tmpl.name }}</h4>
              <p class="template-card-desc">{{ tmpl.description || '暂无描述' }}</p>
              <div class="template-card-steps">
                <template v-for="(step, index) in tmpl.steps" :key="step">
                  <span class="template-step-chip">{{ step }}</span>
                  <span v-if="index < tmpl.steps.length - 1" class="template-step-arrow">→</span>
                </template>
              </div>
            </div>
            <div v-if="selectedTemplateId === tmpl.id" class="template-card-check">
              <CheckOutlined />
            </div>
          </div>

          <div v-if="currentTemplates.length === 0" class="template-empty">
            <AppstoreOutlined class="empty-icon" />
            <p>当前没有可用模板</p>
          </div>
        </div>
      </div>
      <p v-if="fieldHelp('template')" class="form-help">{{ fieldHelp('template') }}</p>
    </div>
  </div>
</template>

<style scoped>
.step-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
}

.step1-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.section-label {
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.required-star {
  color: var(--color-feedback-error);
  margin-left: 2px;
}

.full-width {
  width: 100%;
}

.form-help {
  margin: 0;
  font-size: 12px;
  color: var(--color-feedback-error);
}

/* 类型 pill 与切换 */
.template-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-3);
}

.template-type-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
  flex-wrap: wrap;
}

.template-type-pill {
  --template-project-type-color: var(--color-action-primary);

  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  border: 1px solid
    color-mix(in srgb, var(--template-project-type-color) 38%, transparent);
  background: color-mix(in srgb, var(--template-project-type-color) 10%, transparent);
  font-size: 12px;
}

.template-type-pill__label {
  color: var(--color-text-tertiary);
}

.template-type-pill__value {
  color: var(--template-project-type-color);
  font-weight: 600;
}

.template-type-pill__required {
  color: var(--color-feedback-error);
}

.template-switch-anchor {
  position: relative;
}

.template-switch-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-full);
  background: var(--component-card-background);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.template-switch-button:hover {
  border-color: var(--color-action-primary);
  color: var(--color-action-primary);
}

.template-switch-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  min-width: 240px;
  padding: var(--spacing-2);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-modal-background, var(--component-card-background));
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.template-switch-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.template-switch-option:hover {
  background: var(--color-bg-hover);
}

.template-switch-option__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--template-project-type-color);
  flex-shrink: 0;
}

.template-switch-option__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.template-switch-option__desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.template-switch-option__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

/* 模板选择器 */
.template-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.template-picker__summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.template-picker__summary-title {
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.template-picker__summary-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-3);
}

.template-card {
  --template-project-type-color: var(--color-action-primary);

  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.template-card:hover {
  border-color: var(--color-border-strong);
}

.template-card.selected {
  border-color: var(--template-project-type-color);
  box-shadow: 0 0 0 1px var(--template-project-type-color);
}

.template-card-thumb {
  position: relative;
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--template-project-type-color) 24%, transparent) 0%,
    color-mix(in srgb, var(--template-project-type-color) 6%, transparent) 100%
  );
}

.thumb-category {
  position: absolute;
  top: 8px;
  left: 8px;
  height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-3);
  background: color-mix(in srgb, var(--color-bg-surface) 88%, transparent);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.thumb-default {
  position: absolute;
  top: 8px;
  right: 8px;
  height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-3);
  background: var(--template-project-type-color);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

.template-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
}

.template-card-name {
  margin: 0;
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.template-card-desc {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1.5;
}

.template-card-steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.template-step-chip {
  height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: 11px;
  font-weight: 600;
}

.template-step-arrow {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.template-card-check {
  position: absolute;
  top: 50px;
  right: 10px;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--template-project-type-color);
  color: #fff;
  font-size: 12px;
}

.template-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-8) var(--spacing-4);
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-4);
  color: var(--color-text-tertiary);
}

.empty-icon {
  font-size: 28px;
  color: var(--color-text-quaternary, var(--color-text-tertiary));
}
</style>
