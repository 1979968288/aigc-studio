<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { VideoCameraOutlined } from '@ant-design/icons-vue';
import { useReviewRoomPage } from '../review-room/useReviewRoomPage';
import ReviewRoomContextbar from './ReviewRoomContextbar.vue';
import ReviewRoomSidebar from './ReviewRoomSidebar.vue';
import ReviewRoomViewerToolbar from './ReviewRoomViewerToolbar.vue';
import ReviewRoomTimelineFooter from './ReviewRoomTimelineFooter.vue';
import ReviewRoomCommentsPanel from './ReviewRoomCommentsPanel.vue';

defineOptions({ name: 'ReviewRoomWorkspace' });

const props = defineProps<{
  projectId: string;
}>();

const ctx = useReviewRoomPage(props.projectId);

/** 函数 ref：字符串 ref 无法回写 composable 内的 ref（模板会登记为字面量键） */
function setPlayerContainer(el: unknown): void {
  ctx.playback.playerContainerRef = (el as HTMLElement | null) ?? null;
}

function setKonvaStage(el: unknown): void {
  ctx.annotations.konvaStageRef = el as typeof ctx.annotations.konvaStageRef;
}

/** viewer 尺寸监听 → 同步 Konva stage（对齐 KK useResizeObserver） */
const viewerRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  void ctx.load();
  void ctx.loadSidebarResources();
  if (viewerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) ctx.annotations.syncStageSize(entry);
    });
    resizeObserver.observe(viewerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  ctx.playback.destroyPlayer();
});
</script>

<template>
  <div
    class="rr"
    :class="{
      'rr--left-collapsed': ctx.leftCollapsed,
      'rr--right-collapsed': ctx.rightCollapsed,
    }"
    :style="ctx.panelStyle"
  >
    <!-- 左侧资源栏 -->
    <ReviewRoomSidebar v-if="!ctx.leftCollapsed" :ctx="ctx" />
    <div
      class="rr__panel-resizer rr__panel-resizer--left"
      role="separator"
      aria-label="调整左侧面板"
      tabindex="0"
      @pointerdown="ctx.onResizerPointerDown('left', $event)"
      @pointermove="ctx.onResizerPointerMove($event)"
      @pointerup="ctx.onResizerPointerUp"
      @dblclick="ctx.togglePanel('left')"
      @keydown="ctx.onResizerKeydown('left', $event)"
    />

    <!-- 审片对象选择器/状态：Teleport 到工作台第二行页面上下文槽，与面包屑层级同排（对齐 KK） -->
    <Teleport v-if="ctx.topbarContextTarget" :to="ctx.topbarContextTarget">
      <ReviewRoomContextbar :ctx="ctx" is-topbar />
    </Teleport>

    <!-- 中央主区 -->
    <section class="rr__main">
      <!-- 兜底：顶栏槽未就绪时渲染在主区顶部 -->
      <ReviewRoomContextbar v-if="!ctx.topbarContextTarget" :ctx="ctx" />

      <div v-if="ctx.selectedTimeline" class="rr__viewer-shell">
        <div ref="viewerRef" class="rr__viewer" @wheel="ctx.playback.onWheel">
          <!-- 播放器 / 图片预览 -->
          <div
            v-if="ctx.selectedTimeline.videoUrl"
            :ref="setPlayerContainer"
            class="rr__player-container"
          />
          <div v-else class="rr__viewer-inner">
            <img
              v-if="ctx.selectedTimeline.thumbnailUrl"
              class="rr__preview-img"
              :src="ctx.selectedTimeline.thumbnailUrl"
              :style="{ transform: `scale(${ctx.playback.zoomLevel})` }"
              alt="预览图"
            />
            <div v-else class="rr__preview-placeholder">
              <VideoCameraOutlined />
              <span>暂无预览</span>
            </div>
          </div>

          <!-- 圈注层（默认穿透，激活工具时接管） -->
          <KonvaStage
            :ref="setKonvaStage"
            :config="ctx.annotations.stageConfig"
            class="rr__annotate-stage"
            :class="{ 'rr__annotate-stage--active': ctx.annotations.activeTool !== null }"
            @mousedown="ctx.annotations.onStageMouseDown"
            @mousemove="ctx.annotations.onStageMouseMove"
            @mouseup="ctx.annotations.onStageMouseUp"
            @mouseleave="ctx.annotations.onStageMouseUp"
          >
            <KonvaLayer>
              <KonvaLine v-for="line in ctx.annotations.konvaLines" :key="line.id" :config="line.config" />
              <KonvaRect v-for="rect in ctx.annotations.konvaRects" :key="rect.id" :config="rect.config" />
              <KonvaArrow v-for="arrow in ctx.annotations.konvaArrows" :key="arrow.id" :config="arrow.config" />
              <KonvaText v-for="txt in ctx.annotations.konvaTexts" :key="txt.id" :config="txt.config" />
              <KonvaLine
                v-if="ctx.annotations.currentDrawing?.type === 'line'"
                :config="ctx.annotations.currentDrawing.config"
              />
              <KonvaRect
                v-if="ctx.annotations.currentDrawing?.type === 'rect'"
                :config="ctx.annotations.currentDrawing.config"
              />
              <KonvaArrow
                v-if="ctx.annotations.currentDrawing?.type === 'arrow'"
                :config="ctx.annotations.currentDrawing.config"
              />
            </KonvaLayer>
          </KonvaStage>

          <!-- 文字标注输入浮层 -->
          <div
            v-if="ctx.annotations.textInputVisible"
            class="rr__text-input-overlay"
            :style="{ left: `${ctx.annotations.textInputPos.x}px`, top: `${ctx.annotations.textInputPos.y}px` }"
          >
            <input
              v-model="ctx.annotations.textInputValue"
              class="rr__text-input"
              placeholder="输入文字..."
              :style="{ color: ctx.annotations.annotateColor, caretColor: ctx.annotations.annotateColor }"
              autofocus
              @keydown.enter="ctx.annotations.confirmTextAnnotation"
              @keydown.esc="ctx.annotations.cancelTextAnnotation"
              @blur="ctx.annotations.confirmTextAnnotation"
            />
          </div>

          <!-- 视频画面评论标记轨道 -->
          <div v-if="ctx.commentMarkers.length > 0" class="rr__video-comment-markers">
            <a-tooltip
              v-for="marker in ctx.commentMarkers"
              :key="marker.comment.id"
              :title="`${marker.timecode} ${marker.comment.content.slice(0, 40)}`"
              :placement="marker.align === 'left' ? 'topLeft' : marker.align === 'right' ? 'topRight' : 'top'"
            >
              <button
                type="button"
                class="rr__video-comment-marker"
                :style="{ left: `${marker.left}%` }"
                @click="ctx.seekToComment(marker.comment, marker.index)"
              >
                #{{ marker.index + 1 }}
              </button>
            </a-tooltip>
          </div>
        </div>

        <!-- 播放下工具条 -->
        <ReviewRoomViewerToolbar :ctx="ctx" />
      </div>

      <!-- 空态 -->
      <div v-else class="rr__empty">
        <VideoCameraOutlined class="rr__empty-icon" />
        <p>{{ ctx.emptyText }}</p>
      </div>
    </section>

    <div
      class="rr__panel-resizer rr__panel-resizer--right"
      role="separator"
      aria-label="调整右侧面板"
      tabindex="0"
      @pointerdown="ctx.onResizerPointerDown('right', $event)"
      @pointermove="ctx.onResizerPointerMove($event)"
      @pointerup="ctx.onResizerPointerUp"
      @dblclick="ctx.togglePanel('right')"
      @keydown="ctx.onResizerKeydown('right', $event)"
    />

    <!-- 右侧评论区 -->
    <ReviewRoomCommentsPanel v-if="!ctx.rightCollapsed" :ctx="ctx" />

    <!-- 底部时间线 -->
    <ReviewRoomTimelineFooter v-if="ctx.selectedTimeline" :ctx="ctx" />
  </div>
</template>

<style scoped>
.rr {
  --rr-sidebar-width: clamp(220px, 13vw, 272px);
  --rr-comments-width: clamp(340px, 20vw, 420px);
  --rr-panel-resizer-width: var(--spacing-2);
  display: grid;
  grid-template:
    'sidebar left-resizer main right-resizer comments' minmax(0, 1fr)
    'timeline timeline timeline timeline timeline' auto
    / var(--rr-sidebar-width) var(--rr-panel-resizer-width) minmax(0, 1fr)
    var(--rr-panel-resizer-width) var(--rr-comments-width);
  gap: var(--spacing-3);
  height: 100%;
  overflow: hidden;
  padding: var(--spacing-4);
  background: var(--color-bg-page);
}

.rr--left-collapsed {
  grid-template:
    'left-resizer main right-resizer comments' minmax(0, 1fr)
    'timeline timeline timeline timeline' auto
    / var(--rr-panel-resizer-width) minmax(0, 1fr) var(--rr-panel-resizer-width)
    var(--rr-comments-width);
}

.rr--right-collapsed {
  grid-template:
    'sidebar left-resizer main right-resizer' minmax(0, 1fr)
    'timeline timeline timeline timeline' auto
    / var(--rr-sidebar-width) var(--rr-panel-resizer-width) minmax(0, 1fr)
    var(--rr-panel-resizer-width);
}

.rr--left-collapsed.rr--right-collapsed {
  grid-template:
    'left-resizer main right-resizer' minmax(0, 1fr)
    'timeline timeline timeline' auto
    / var(--rr-panel-resizer-width) minmax(0, 1fr) var(--rr-panel-resizer-width);
}

.rr__panel-resizer {
  cursor: col-resize;
  border-radius: var(--radius-full);
  background: transparent;
  transition: background 0.15s ease;
}

.rr__panel-resizer:hover,
.rr__panel-resizer:focus-visible {
  background: var(--color-fill-primary-subtle);
  outline: none;
}

.rr__panel-resizer--left {
  grid-area: left-resizer;
}

.rr__panel-resizer--right {
  grid-area: right-resizer;
}

.rr__main {
  grid-area: main;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.rr__viewer-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-5);
  background: #000;
  overflow: hidden;
}

.rr__viewer {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.rr__player-container {
  position: absolute;
  inset: 0;
}

.rr__viewer-inner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.rr__preview-img {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.15s ease;
}

.rr__preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  color: rgba(255, 255, 255, 0.45);
  font-size: var(--font-size-13);
}

.rr__preview-placeholder :first-child {
  font-size: 32px;
}

.rr__annotate-stage {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.rr__annotate-stage--active {
  pointer-events: auto;
  cursor: crosshair;
}

.rr__text-input-overlay {
  position: absolute;
  z-index: 20;
}

.rr__text-input {
  min-width: 120px;
  padding: 2px 6px;
  border: 1px dashed currentColor;
  border-radius: var(--radius-2);
  background: rgba(0, 0, 0, 0.45);
  font-size: 16px;
  outline: none;
}

.rr__video-comment-markers {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 34px;
  height: 18px;
  z-index: 12;
  pointer-events: none;
}

.rr__video-comment-marker {
  position: absolute;
  transform: translateX(-50%);
  pointer-events: auto;
  min-width: 20px;
  height: 18px;
  padding: 0 4px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-feedback-error);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.rr__video-comment-marker:hover {
  transform: translateX(-50%) scale(1.15);
}

.rr__empty {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-5);
  color: var(--color-text-tertiary);
  background: var(--component-panel-background);
}

.rr__empty-icon {
  font-size: 36px;
}

/* xgplayer 大播放键隐藏（对齐 KK） */
.rr__player-container :deep(xg-start),
.rr__player-container :deep(.xgplayer-start) {
  display: none !important;
}
</style>
