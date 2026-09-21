<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { GridItem, GridLayout } from 'vue-grid-layout-v3';
import { HolderOutlined, RightOutlined } from '@ant-design/icons-vue';
import DashboardCardContent from './DashboardCardContent.vue';
import type {
  DashboardApprovalItem,
  DashboardApprovalSummary,
  DashboardGlobalProductionLane,
  DashboardProjectSummary,
  DashboardShortcutItem,
  DashboardTaskItem,
  LayoutCard,
  VisibleLayoutCard,
} from '../types';

const props = defineProps<{
  approvalItems: DashboardApprovalItem[];
  approvalSummaries: DashboardApprovalSummary[];
  globalProductionBoardLanes: DashboardGlobalProductionLane[];
  gridCols: number;
  isPopupMode: boolean;
  layout: LayoutCard[];
  loadingApprovals: boolean;
  loadingGlobalProductionBoard: boolean;
  loadingProjects: boolean;
  loadingShortcuts: boolean;
  loadingTasks: boolean;
  loadingWatch: boolean;
  projectItems: DashboardProjectSummary[];
  rowHeight: number;
  shortcutItems: DashboardShortcutItem[];
  taskItems: DashboardTaskItem[];
  visibleCards: VisibleLayoutCard[];
  watchProjects: DashboardProjectSummary[];
}>();

const emit = defineEmits<{
  (event: 'update:layout', layout: LayoutCard[]): void;
  (event: 'go-to', route: string): void;
  (event: 'open-card', card: VisibleLayoutCard): void;
  (event: 'remove-shortcut', id: string): void;
}>();

const GridLayoutRuntime = GridLayout as unknown as object;
const GridItemRuntime = GridItem as unknown as object;

/** 拖拽/缩放时的视口边缘自动滚屏（KK 同款体验的简化实现） */
const RESIZE_VIEWPORT_MARGIN = 60;
const RESIZE_SCROLL_STEP = 14;
const DRAG_BOTTOM_SPACER = 320;

const isInteracting = ref(false);
let restorePaddingBottom: string | null = null;

const layoutModel = computed({
  get: () => props.visibleCards.map(({ meta: _meta, ...card }) => card),
  set: (value: LayoutCard[]) => emit('update:layout', value),
});

const spacerStyle = computed(() =>
  !props.isPopupMode && isInteracting.value
    ? { paddingBottom: `${DRAG_BOTTOM_SPACER}px` }
    : undefined
);

function getScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.workbench-content');
}

function handlePointerMove(event: PointerEvent | MouseEvent): void {
  if (!isInteracting.value) return;
  const container = getScrollContainer();
  if (!container) return;

  const distanceToBottom = window.innerHeight - event.clientY;
  const distanceToTop = event.clientY;

  if (distanceToBottom < RESIZE_VIEWPORT_MARGIN) {
    container.scrollTop += RESIZE_SCROLL_STEP;
  } else if (distanceToTop < RESIZE_VIEWPORT_MARGIN) {
    container.scrollTop = Math.max(0, container.scrollTop - RESIZE_SCROLL_STEP);
  }
}

function addSpacer(): void {
  if (props.isPopupMode) return;
  const container = getScrollContainer();
  if (container && restorePaddingBottom === null) {
    restorePaddingBottom = container.style.paddingBottom;
    container.style.paddingBottom = `${DRAG_BOTTOM_SPACER}px`;
  }
}

function removeSpacer(): void {
  const container = getScrollContainer();
  if (container && restorePaddingBottom !== null) {
    container.style.paddingBottom = restorePaddingBottom;
    restorePaddingBottom = null;
  }
}

function handleCardInteractStart(): void {
  isInteracting.value = true;
  addSpacer();
}

function handleCardInteractEnd(): void {
  isInteracting.value = false;
  removeSpacer();
}

function handleLayoutUpdated(value: unknown): void {
  emit('update:layout', value as LayoutCard[]);
}

onMounted(() => {
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('mouseup', handleCardInteractEnd);
  window.addEventListener('pointercancel', handleCardInteractEnd);
});

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('mouseup', handleCardInteractEnd);
  window.removeEventListener('pointercancel', handleCardInteractEnd);
  removeSpacer();
});
</script>

<script lang="ts">
export default { name: 'DashboardCardGrid' };
</script>

<template>
  <component
    :is="GridLayoutRuntime"
    v-model:layout="layoutModel"
    class="db1-layout"
    :style="spacerStyle"
    :col-num="gridCols"
    :row-height="rowHeight"
    :is-draggable="!isPopupMode"
    :is-resizable="!isPopupMode"
    :vertical-compact="true"
    :use-css-transforms="true"
    :prevent-collision="false"
    :restore-on-drag="false"
    :margin="isPopupMode ? [0, 0] : [8, 8]"
    @layout-updated="handleLayoutUpdated"
  >
    <component
      :is="GridItemRuntime"
      v-for="card in visibleCards"
      :key="card.i"
      :x="card.x"
      :y="card.y"
      :w="card.w"
      :h="card.h"
      :i="card.i"
      :min-w="card.meta.minW"
      :min-h="card.meta.defaultH"
      :resizable="!isPopupMode"
      :draggable="!isPopupMode"
      drag-allow-from=".db1-card__header"
      drag-ignore-from=".db1-card__body,.db1-card__action-link,button,a"
      @resize="handleCardInteractStart"
      @resized="handleCardInteractEnd"
      @move="handleCardInteractStart"
      @moved="handleCardInteractEnd"
    >
      <div class="db1-card" :class="{ 'db1-card--popup': isPopupMode }">
        <div
          v-if="!isPopupMode"
          class="db1-card__header"
          title="双击在新窗口打开此卡片"
          @dblclick="emit('open-card', card)"
        >
          <div class="db1-card__title-wrap">
            <HolderOutlined class="db1-card__drag-icon" />
            <span class="db1-card__title">{{ card.meta.title }}</span>
          </div>
          <div class="db1-card__actions">
            <button
              v-if="card.meta.route"
              type="button"
              class="db1-card__action-link"
              @click.stop="emit('go-to', card.meta.route)"
            >
              <span class="db1-card__action-text">查看详情</span>
              <RightOutlined />
            </button>
          </div>
        </div>

        <DashboardCardContent
          :approval-items="approvalItems"
          :approval-summaries="approvalSummaries"
          :card="card"
          :global-production-board-lanes="globalProductionBoardLanes"
          :loading-approvals="loadingApprovals"
          :loading-global-production-board="loadingGlobalProductionBoard"
          :loading-projects="loadingProjects"
          :loading-shortcuts="loadingShortcuts"
          :loading-tasks="loadingTasks"
          :loading-watch="loadingWatch"
          :project-items="projectItems"
          :shortcut-items="shortcutItems"
          :task-items="taskItems"
          :watch-projects="watchProjects"
          @go-to="emit('go-to', $event)"
          @remove-shortcut="emit('remove-shortcut', $event)"
        />
      </div>
    </component>
  </component>
</template>
