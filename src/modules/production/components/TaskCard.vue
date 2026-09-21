<script setup lang="ts">
import { computed } from 'vue';
import { message } from 'ant-design-vue';
import {
  BulbOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  MoreOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue';
import type { PCTask } from '../types';
import { resolveStaffName } from '@/modules/staff/api';
import { genModelLabel } from '@/shared/aigc/genConfig';

const props = defineProps<{
  task: PCTask;
  isSelected: boolean;
  isHighlighted: boolean;
  canMutate: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', payload: MouseEvent): void;
  (e: 'contextmenu', payload: MouseEvent): void;
  (e: 'dragStart', task: PCTask): void;
  (e: 'dragEnd'): void;
}>();

const taskCode = computed(() => {
  const code = props.task.code?.trim() || props.task.id;
  return props.task.stage?.trim() ? `${code} · ${props.task.stage}` : code;
});

function formatDuration(seconds?: number): string {
  if (seconds == null) return '';
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} 分钟`;
  return `${Math.floor(totalMinutes / 60)} 小时 ${totalMinutes % 60} 分`;
}

const taskFields = computed(() => {
  const fields = [
    { key: 'stage', label: '工序', value: props.task.stage, icon: ClockCircleOutlined },
    { key: 'responsible', label: '负责人', value: resolveStaffName(props.task.responsible), icon: EnvironmentOutlined },
    { key: 'genModel', label: '模型', value: genModelLabel(props.task.genModel), icon: ThunderboltOutlined },
    { key: 'prompt', label: '提示词', value: props.task.prompt, icon: BulbOutlined, block: true },
    { key: 'description', label: '描述', value: props.task.description, icon: FileTextOutlined, block: true },
  ];
  return fields
    .map((field) => ({ ...field, value: String(field.value ?? '').trim() }))
    .filter((field) => field.value.length > 0);
});

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('application/pc-task', JSON.stringify(props.task));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copyMove';
  emit('dragStart', props.task);
}

async function handleCopy() {
  const text = [
    props.task.code,
    props.task.stage,
    props.task.responsible,
    genModelLabel(props.task.genModel),
    props.task.prompt,
    props.task.description,
  ];
  try {
    await navigator.clipboard.writeText(text.filter(Boolean).join(' - '));
    message.success('信息已复制');
  } catch {
    message.error('复制失败');
  }
}

void formatDuration;
</script>

<template>
  <div
    :class="[
      'pc-card pc-task-card',
      { 'pc-card--selected': isSelected, 'pc-card--highlighted': isHighlighted },
    ]"
    data-pc-entity="task"
    :data-pc-id="task.id"
    draggable="true"
    @click="emit('click', $event)"
    @contextmenu="emit('contextmenu', $event)"
    @dragstart="onDragStart"
    @dragend="emit('dragEnd')"
  >
    <div class="pc-card__actions">
      <a-tooltip title="复制信息">
        <button type="button" class="pc-card__action" @click.stop="handleCopy">
          <CopyOutlined />
        </button>
      </a-tooltip>
      <a-tooltip title="更多操作">
        <button type="button" class="pc-card__action" @click.stop="emit('contextmenu', $event)">
          <MoreOutlined />
        </button>
      </a-tooltip>
    </div>

    <div class="pc-task-card__heading">
      <div class="pc-task-card__code">{{ taskCode }}</div>
    </div>

    <div class="pc-task-card__fields">
      <div
        v-for="field in taskFields"
        :key="field.key"
        :class="['pc-task-card__field', { 'pc-task-card__field--block': field.block }]"
      >
        <component :is="field.icon" class="pc-task-card__field-icon" />
        <span class="pc-task-card__field-label">{{ field.label }}</span>
        <span class="pc-task-card__field-value">{{ field.value }}</span>
      </div>
    </div>

    <div v-if="task.refImages?.length" class="pc-task-card__refs">
      <img
        v-for="(src, index) in task.refImages"
        :key="index"
        :src="src"
        class="pc-task-card__ref"
        alt="参考图"
      />
    </div>

    <div v-if="isSelected" class="pc-card__selected-dot" />
  </div>
</template>

<style scoped>
.pc-task-card {
  padding: var(--spacing-4);
  border-radius: var(--radius-4);
  border: 1px solid var(--color-border-default);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
  position: relative;
  overflow: hidden;
  background: var(--component-card-background);
}

.pc-task-card:hover {
  border-color: var(--color-border-accent);
}

.pc-card--selected,
.pc-card--highlighted {
  background: var(--color-fill-primary-subtle);
  border-color: var(--color-action-primary);
}

.pc-card--selected {
  box-shadow: 0 0 0 2px var(--color-fill-primary-subtle), var(--shadow-card-hover);
}

.pc-card__actions {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  z-index: 2;
  display: inline-flex;
  gap: var(--spacing-1);
}

.pc-card__action {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  color: var(--color-text-tertiary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.pc-card__action:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.pc-task-card__heading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
  padding-right: calc(24px * 2 + var(--spacing-3));
}

.pc-task-card__code {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-14);
  color: var(--color-text-primary);
}

.pc-task-card__fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
}

.pc-task-card__field {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.pc-task-card__field--block {
  align-items: flex-start;
}

.pc-task-card__field-icon {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.pc-task-card__field-label {
  flex: 0 0 56px;
  color: var(--color-text-tertiary);
}

.pc-task-card__field-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-task-card__field--block .pc-task-card__field-value {
  display: -webkit-box;
  white-space: normal;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.pc-task-card__refs {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}

.pc-task-card__ref {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--radius-2);
  background: var(--color-bg-page-alt);
}

.pc-card__selected-dot {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  width: 12px;
  height: 12px;
  background: var(--color-action-primary);
  border-radius: var(--radius-full);
  border: 2px solid var(--color-bg-card);
}

.pc-card__actions ~ .pc-card__selected-dot {
  right: calc(var(--spacing-2) + 24px * 2 + var(--spacing-2));
}
</style>