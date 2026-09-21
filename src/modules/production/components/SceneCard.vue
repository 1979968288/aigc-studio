<script setup lang="ts">
import { computed } from 'vue';
import { message } from 'ant-design-vue';
import { CopyOutlined, EnvironmentOutlined, MoreOutlined, TeamOutlined } from '@ant-design/icons-vue';
import type { PCScene } from '../types';

const props = defineProps<{
  scene: PCScene;
  isSelected: boolean;
  isHighlighted: boolean;
  canMutate: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', payload: MouseEvent): void;
  (e: 'contextmenu', payload: MouseEvent): void;
  (e: 'dragStart', scene: PCScene): void;
  (e: 'dragEnd'): void;
}>();

const sceneCodeLine = computed(() => {
  const code = props.scene.sceneNo || props.scene.id;
  const type = props.scene.type?.trim();
  return type ? `${code} · ${type}` : code;
});

const sceneFields = computed(() => {
  const fields = [
    { key: 'location', label: '地点', value: props.scene.location, icon: EnvironmentOutlined },
    {
      key: 'characters',
      label: '相关角色',
      value: props.scene.characters.join(' · '),
      icon: TeamOutlined,
    },
  ];
  return fields
    .map((field) => ({ ...field, value: String(field.value ?? '').trim() }))
    .filter((field) => field.value.length > 0);
});

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('application/pc-scene', JSON.stringify(props.scene));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
  emit('dragStart', props.scene);
}

async function handleCopy() {
  const text = [props.scene.sceneNo, props.scene.name, props.scene.location, props.scene.characters.join(' ')];
  try {
    await navigator.clipboard.writeText(text.filter(Boolean).join(' - '));
    message.success('信息已复制');
  } catch {
    message.error('复制失败');
  }
}
</script>

<template>
  <div
    :class="[
      'pc-card pc-scene-card',
      { 'pc-card--selected': isSelected, 'pc-card--highlighted': isHighlighted },
    ]"
    data-pc-entity="scene"
    :data-pc-id="scene.id"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="emit('dragEnd')"
    @click="emit('click', $event)"
    @contextmenu="emit('contextmenu', $event)"
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

    <div class="pc-scene-card__heading">
      <div class="pc-scene-card__code">{{ sceneCodeLine }}</div>
    </div>

    <div class="pc-scene-card__fields">
      <div v-for="field in sceneFields" :key="field.key" class="pc-scene-card__field">
        <component :is="field.icon" class="pc-scene-card__field-icon" />
        <span class="pc-scene-card__field-label">{{ field.label }}</span>
        <span class="pc-scene-card__field-value">{{ field.value }}</span>
      </div>
    </div>

    <div v-if="isSelected" class="pc-card__selected-dot" />
  </div>
</template>

<style scoped>
.pc-scene-card {
  padding: var(--spacing-4);
  border-radius: var(--radius-4);
  border: 1px solid var(--color-border-default);
  cursor: grab;
  flex-shrink: 0;
  transition: background 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
  position: relative;
  overflow: hidden;
  background: var(--component-card-background);
  box-shadow: var(--shadow-card);
}

.pc-scene-card:active {
  cursor: grabbing;
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

.pc-scene-card__heading {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
  padding-right: calc(24px * 2 + var(--spacing-3));
}

.pc-scene-card__code {
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.pc-scene-card__fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
}

.pc-scene-card__field {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.pc-scene-card__field-icon {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: 13px;
}

.pc-scene-card__field-label {
  flex: 0 0 56px;
  color: var(--color-text-tertiary);
}

.pc-scene-card__field-value {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  color: var(--color-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
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