<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import TaskCard from './TaskCard.vue';
import { useProductionCenter } from '../useProductionCenterPage';

defineOptions({ name: 'TaskCardList' });

const ctx = useProductionCenter();

const tasks = computed(() => ctx.filteredTasks.value);
const selectedIds = computed(() =>
  ctx.selectedEntity.value?.type === 'task' ? [ctx.selectedEntity.value.id] : []
);
const highlightedIds = computed(() => ctx.highlightedTasks.value);
const isSceneDragging = computed(() => ctx.isSceneDragging.value);

const laneBodyRef = ref<HTMLElement | null>(null);
const isDragOver = ref(false);
const dragEnterDepth = ref(0);
const overlayCardStyle = ref<Record<string, string>>({});

const showOverlay = computed(() => isSceneDragging.value && isDragOver.value);

function isSceneDragEvent(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('application/pc-scene');
}

function updateOverlayPosition(): void {
  const element = laneBodyRef.value;
  if (!element) return;

  const centerX = element.scrollLeft + element.clientWidth / 2;
  const centerY = element.scrollTop + element.clientHeight / 2;
  const width = Math.max(Math.min(element.clientWidth - 32, 420), 240);

  overlayCardStyle.value = {
    left: `${centerX}px`,
    top: `${centerY}px`,
    width: `${width}px`,
  };
}

function onDragEnter(event: DragEvent): void {
  if (!isSceneDragEvent(event)) return;
  dragEnterDepth.value += 1;
  isDragOver.value = true;
  updateOverlayPosition();
}

function onDragOver(event: DragEvent): void {
  if (!isSceneDragEvent(event)) return;
  isDragOver.value = true;
  updateOverlayPosition();
}

function onDragLeave(event: DragEvent): void {
  if (!isSceneDragEvent(event)) return;
  dragEnterDepth.value = Math.max(0, dragEnterDepth.value - 1);
  if (dragEnterDepth.value === 0) {
    isDragOver.value = false;
  }
}

function onDrop(event: DragEvent): void {
  dragEnterDepth.value = 0;
  isDragOver.value = false;
  const raw = event.dataTransfer?.getData('application/pc-scene');
  if (raw) {
    ctx.handleDropSceneToTask(raw);
  }
}

function handleViewportChange(): void {
  if (showOverlay.value) {
    updateOverlayPosition();
  }
}

watch(
  isSceneDragging,
  (dragging) => {
    if (!dragging) {
      dragEnterDepth.value = 0;
      isDragOver.value = false;
      overlayCardStyle.value = {};
    }
  },
  { immediate: true }
);

watch(showOverlay, (active) => {
  if (active) {
    updateOverlayPosition();
  }
});

onMounted(() => {
  window.addEventListener('resize', handleViewportChange);
  laneBodyRef.value?.addEventListener('scroll', handleViewportChange, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleViewportChange);
  laneBodyRef.value?.removeEventListener('scroll', handleViewportChange);
});
</script>

<template>
  <div class="pc-workspace-panel pc-lane pc-task-list">
    <div class="pc-lane__header">
      <h2 class="pc-lane__title">任务层</h2>
      <span class="pc-task-list__count">{{ tasks.length }} 项</span>
    </div>

    <div
      ref="laneBodyRef"
      class="pc-lane__body pc-task-list__body"
      :class="{ 'pc-lane__body--drag-active': showOverlay }"
      @dragenter="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <div v-if="showOverlay" class="pc-task-list__drop-overlay" aria-hidden="true">
        <div class="pc-task-list__drop-overlay-card" :style="overlayCardStyle">
          <span class="pc-task-list__drop-overlay-title">在当前列松开即可创建生成任务</span>
        </div>
      </div>

      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :is-selected="selectedIds.includes(task.id)"
        :is-highlighted="highlightedIds.includes(task.id)"
        :can-mutate="true"
        @click="ctx.selectTask(task)"
        @contextmenu="(e: MouseEvent) => ctx.showContextMenu(e, 'task', task)"
      />
      <a-empty v-if="tasks.length === 0" description="暂无生成任务" />
    </div>
  </div>
</template>

<style scoped>
.pc-task-list__count {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
}

.pc-task-list__body {
  position: relative;
}

.pc-lane__body--drag-active {
  border-radius: var(--radius-4);
  outline: 1px solid color-mix(in srgb, var(--color-action-primary) 55%, transparent);
}

.pc-lane__body--drag-active :deep(.pc-task-card) {
  opacity: 0.2;
  filter: saturate(0.6) blur(1px);
}

.pc-task-list__drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: var(--radius-4);
  background: color-mix(in srgb, var(--component-card-background) 52%, transparent);
}

.pc-task-list__drop-overlay-card {
  position: absolute;
  padding: var(--spacing-5) var(--spacing-6);
  border: 2px dashed color-mix(in srgb, var(--color-action-primary) 65%, white);
  border-radius: var(--radius-5);
  background: var(--component-card-background);
  box-shadow: var(--shadow-card-hover);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transform: translate(-50%, -50%);
}

.pc-task-list__drop-overlay-title {
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
</style>