<script setup lang="ts">
import { PushpinFilled, PushpinOutlined, UserOutlined } from '@ant-design/icons-vue';
import { computed, reactive, ref, watch } from 'vue';
import { findStaffByRef, readStaffList, resolveStaffName } from '@/modules/staff/api';
import ProjectMemberSection from './ProjectMemberSection.vue';
import { PRODUCTION_SECTIONS } from '../constants';
import type { ProjectSummary, ProductionFieldDef } from '../types';

defineOptions({ name: 'ProjectProductionInfoPanel' });

const props = defineProps<{
  project: ProjectSummary;
  fieldValues: Record<string, string>;
  editValues: Record<string, string>;
  pinnedKeys: string[];
  saving: boolean;
}>();

const emit = defineEmits<{
  (event: 'save', patch: Record<string, unknown>): void;
  (event: 'toggle-pin', fieldKey: string): void;
}>();

const activeSection = ref<string>('basic');
const editingSection = ref<string | null>(null);
const editForm = reactive<Record<string, string>>({});

const sections = computed(() => PRODUCTION_SECTIONS);
const activeSectionDef = computed(
  () => sections.value.find((section) => section.id === activeSection.value) ?? sections.value[0]
);
const isEditing = computed(() => editingSection.value === activeSection.value);
const isMemberSection = computed(() => activeSectionDef.value?.id === 'members');

watch(activeSection, () => {
  editingSection.value = null;
});

/** 负责人按 id/姓名匹配人员，渲染头像 */
const ownerUser = computed(() => findStaffByRef(props.project.owner) ?? null);

/** 人员选择项（在职人员，值为 userId） */
const staffOptions = computed(() =>
  readStaffList()
    .filter((user) => user.employmentStatus === 'active')
    .map((user) => ({ value: user.id, label: user.name }))
);

function startEdit(): void {
  if (isMemberSection.value) return;
  for (const group of activeSectionDef.value?.groups ?? []) {
    for (const field of group.fields) {
      editForm[field.key] =
        props.editValues[field.key] ?? props.fieldValues[field.key] ?? '';
    }
  }
  editingSection.value = activeSection.value;
}

function cancelEdit(): void {
  editingSection.value = null;
}

/** 数字字段：提交时转 number，空串置 null */
const NUMBER_FIELD_KEYS = new Set([
  'total_episodes',
  'episode_duration',
  'duration_minutes',
  'budget',
]);
/** 整型字段（是否类/风险标识）：提交时转 number */
const INT_FIELD_KEYS = new Set(['has_lip_sync', 'has_digital_assets', 'risk_level']);

function submitEdit(): void {
  const patch: Record<string, unknown> = {};
  for (const group of activeSectionDef.value?.groups ?? []) {
    for (const field of group.fields) {
      if (field.immutable) continue;
      const value = editForm[field.key];
      if (NUMBER_FIELD_KEYS.has(field.key)) {
        patch[field.key] = value === '' || value == null ? null : Number(value);
      } else if (INT_FIELD_KEYS.has(field.key)) {
        patch[field.key] = Number(value ?? 0);
      } else {
        patch[field.key] = value ?? '';
      }
    }
  }
  emit('save', patch);
  editingSection.value = null;
}

function isPinned(key: string): boolean {
  return props.pinnedKeys.includes(key);
}

/** KK 状态徽标配色（status-badge） */
function statusBadgeClass(statusKey: string): string {
  if (statusKey === '2') return 'status-badge--success';
  if (statusKey === '3') return 'status-badge--warning';
  if (statusKey === '4') return 'status-badge--primary';
  if (statusKey === '1') return 'status-badge--info';
  return 'status-badge--neutral';
}

function displayValue(field: ProductionFieldDef): string {
  return props.fieldValues[field.key] ?? '-';
}

function isEmpty(value: string): boolean {
  return !value || value === '-';
}
</script>

<template>
  <div class="production-info-page">
    <!-- 左侧信息模块导航（KK section-nav） -->
    <div class="section-nav">
      <div class="nav-header">
        <span class="nav-header-title">信息模块分类</span>
      </div>
      <nav class="nav-list">
        <button
          v-for="section in sections"
          :key="section.id"
          type="button"
          class="nav-item"
          :class="{ 'nav-item--active': activeSection === section.id }"
          @click="activeSection = section.id"
        >
          <component :is="section.icon" class="nav-item__icon" />
          <span>{{ section.title }}</span>
        </button>
      </nav>
    </div>

    <!-- 右侧内容 -->
    <div class="section-content">
      <div class="section-header">
        <div class="section-header-left">
          <h2 class="section-title">{{ activeSectionDef?.title }}</h2>
          <span v-if="isMemberSection" class="section-title-tip">
            项目成员决定谁参与项目，环节负责人决定谁在哪道工序负责
          </span>
        </div>
        <div v-if="!isMemberSection" class="section-header-actions">
          <template v-if="isEditing">
            <a-button @click="cancelEdit">取消</a-button>
            <a-button type="primary" :loading="saving" @click="submitEdit">保存更改</a-button>
          </template>
          <a-button v-else type="primary" ghost @click="startEdit">编辑内容</a-button>
        </div>
      </div>

      <!-- 项目成员（双轨：项目成员 / 环节负责人） -->
      <ProjectMemberSection
        v-if="isMemberSection"
        :project="project"
        :saving="saving"
        @save="emit('save', $event)"
      />

      <!-- 字段分组 -->
      <div v-else class="field-groups">
        <section
          v-for="group in activeSectionDef?.groups ?? []"
          :key="group.id"
          class="field-group"
        >
          <div v-if="group.title" class="field-group-title">{{ group.title }}</div>
          <div class="fields-grid">
            <div
              v-for="field in group.fields"
              :key="field.key"
              :class="['field-item', { 'full-width': field.fullWidth }]"
            >
              <div class="field-label-row">
                <div class="field-label-main">
                  <span class="field-label">{{ field.label }}</span>
                  <span v-if="field.immutable" class="field-tag field-tag--immutable">不可编辑</span>
                </div>
                <a-tooltip :title="isPinned(field.key) ? '取消置顶' : '置顶到项目面板'">
                  <button
                    type="button"
                    :class="['field-pin-btn', { active: isPinned(field.key) }]"
                    :aria-label="isPinned(field.key) ? '取消置顶' : '置顶到项目面板'"
                    @click="emit('toggle-pin', field.key)"
                  >
                    <PushpinFilled v-if="isPinned(field.key)" />
                    <PushpinOutlined v-else />
                  </button>
                </a-tooltip>
              </div>
              <p v-if="field.hint" class="field-hint">{{ field.hint }}</p>

              <div class="field-value-area">
                <!-- 编辑态 -->
                <template v-if="isEditing && !field.immutable">
                  <a-textarea
                    v-if="field.type === 'textarea'"
                    v-model:value="editForm[field.key]"
                    :rows="3"
                    :placeholder="`请输入${field.label}`"
                  />
                  <a-date-picker
                    v-else-if="field.type === 'date'"
                    :value="editForm[field.key] || undefined"
                    value-format="YYYY-MM-DD"
                    @change="(_: unknown, dateStr: string) => (editForm[field.key] = dateStr)"
                  />
                  <a-select
                    v-else-if="field.type === 'select'"
                    v-model:value="editForm[field.key]"
                    :options="field.options"
                    :placeholder="`请选择${field.label}`"
                  />
                  <a-select
                    v-else-if="field.type === 'staff'"
                    v-model:value="editForm[field.key]"
                    :options="staffOptions"
                    :placeholder="`请选择${field.label}`"
                    allow-clear
                    show-search
                    option-filter-prop="label"
                  />
                  <a-input
                    v-else
                    v-model:value="editForm[field.key]"
                    :placeholder="`请输入${field.label}`"
                  />
                </template>

                <!-- 只读态 -->
                <template v-else>
                  <!-- 项目状态徽标 -->
                  <span
                    v-if="field.key === 'status'"
                    :class="['status-badge', statusBadgeClass(fieldValues.status ?? '0')]"
                  >
                    {{ project.statusLabel }}
                  </span>
                  <!-- 负责人头像 -->
                  <span v-else-if="field.key === 'owner'" class="user-value">
                    <span
                      class="user-value__avatar"
                      :style="{ background: ownerUser?.color ?? 'var(--color-fill-primary-subtle)' }"
                    >
                      <UserOutlined />
                    </span>
                    {{ ownerUser?.name ?? resolveStaffName(project.owner) }}
                  </span>
                  <!-- 多行文本 -->
                  <div v-else-if="field.type === 'textarea'" class="textarea-readonly">
                    {{ displayValue(field) }}
                  </div>
                  <!-- 普通文本 -->
                  <span
                    v-else
                    :class="['text-value', { 'text-empty': isEmpty(displayValue(field)) }]"
                  >
                    {{ displayValue(field) }}
                  </span>
                </template>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== 布局（对齐 KK production-info-page） ===== */
.production-info-page {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.section-nav {
  width: 200px;
  flex-shrink: 0;
  min-height: 0;
  border-right: 1px solid var(--color-border-default);
  display: flex;
  flex-direction: column;
  background: var(--component-card-background-soft);
}

.nav-header {
  padding: var(--spacing-4) var(--spacing-4) var(--spacing-3);
  border-bottom: 1px solid var(--color-border-default);
}

.nav-header-title {
  font-size: 12px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.05em;
  color: var(--color-text-quaternary, var(--color-text-tertiary));
}

.nav-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-2);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  text-align: left;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.nav-item--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 600;
}

.nav-item__icon {
  font-size: 15px;
  flex-shrink: 0;
}

.section-content {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  padding: var(--spacing-5);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-5);
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.section-title-tip {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.section-header-actions {
  display: flex;
  gap: var(--spacing-2);
}

/* ===== 字段分组（KK field-groups） ===== */
.field-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding-bottom: var(--spacing-6);
  border-bottom: 1px solid var(--color-border-default);
}

.field-group:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.field-group-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-tertiary);
}

.field-group-title::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-action-primary);
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4) var(--spacing-5);
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.field-item.full-width {
  grid-column: 1 / -1;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  min-height: var(--control-height-sm);
}

.field-label-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.field-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-medium);
}

.field-tag {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 0 var(--spacing-2);
  border-radius: var(--radius-3);
  border: 1px solid transparent;
  font-size: 12px;
  line-height: 1;
  font-weight: var(--font-weight-medium);
}

.field-tag--immutable {
  color: var(--color-text-tertiary);
  border-color: var(--color-border-default);
  background: var(--component-tag-default-background, var(--color-bg-disabled));
}

.field-pin-btn {
  width: var(--control-height-sm);
  height: var(--control-height-sm);
  min-width: var(--control-height-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-quaternary, var(--color-text-tertiary));
  font-size: 13px;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

.field-item:hover .field-pin-btn,
.field-pin-btn:focus-visible,
.field-pin-btn.active {
  opacity: 1;
}

.field-pin-btn:hover {
  color: var(--color-action-primary);
  background: var(--color-fill-primary-subtle);
}

.field-pin-btn.active {
  color: var(--color-action-primary);
  background: var(--color-fill-primary-subtle);
}

.field-hint {
  font-size: 12px;
  color: var(--color-text-quaternary, var(--color-text-tertiary));
  margin: 0;
  line-height: 1.4;
}

.field-value-area {
  min-height: var(--control-height, 36px);
  display: flex;
  align-items: center;
}

.field-value-area :deep(.ant-input),
.field-value-area :deep(.ant-select),
.field-value-area :deep(.ant-picker),
.field-value-area :deep(.ant-input-affix-wrapper) {
  width: 100%;
}

/* ===== 只读值渲染（KK 特殊字段） ===== */
.text-value {
  font-size: 14px;
  color: var(--color-text-primary);
}

.text-empty {
  color: var(--color-text-tertiary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}

.status-badge--success {
  background: var(--color-fill-success-subtle);
  color: var(--color-feedback-success);
}

.status-badge--warning {
  background: var(--color-fill-warning-subtle);
  color: var(--color-feedback-warning);
}

.status-badge--primary {
  background: var(--color-fill-info-subtle);
  color: var(--color-action-primary);
}

.status-badge--info {
  background: var(--color-fill-info-subtle);
  color: var(--color-status-info);
}

.status-badge--neutral {
  background: var(--color-bg-disabled);
  color: var(--color-text-tertiary);
}

.user-value {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
}

.user-value__avatar {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: #fff;
  font-size: 13px;
  flex-shrink: 0;
}

.textarea-readonly {
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
