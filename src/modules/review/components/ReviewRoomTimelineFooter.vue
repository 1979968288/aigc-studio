<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { DownOutlined, RightOutlined } from '@ant-design/icons-vue';
import {
  clampRailLeft,
  createLocalRulerMarks,
  createOverviewRulerMarks,
  formatReviewTimecode,
  RAIL_PIXELS_PER_SECONDS,
} from '../contracts';
import type { ReviewRoomPageContext } from '../review-room/useReviewRoomPage';

defineOptions({ name: 'ReviewRoomTimelineFooter' });

const props = defineProps<{
  ctx: ReviewRoomPageContext;
}>();

const collapsed = ref(false);

/** 剪辑轨道缩放（px/s 倍率：1x / 2x / 4x），默认 2x 拉开与鸟瞰图的精细度差距 */
const TIMELINE_ZOOM_STEPS = [1, 2, 4] as const;
const timelineZoom = ref<number>(2);
const pps = computed(() => RAIL_PIXELS_PER_SECONDS * timelineZoom.value);

function adjustZoom(delta: -1 | 1): void {
  const index = TIMELINE_ZOOM_STEPS.indexOf(timelineZoom.value as (typeof TIMELINE_ZOOM_STEPS)[number]);
  const next = TIMELINE_ZOOM_STEPS[Math.min(TIMELINE_ZOOM_STEPS.length - 1, Math.max(0, index + delta))];
  timelineZoom.value = next;
}

const duration = computed(() => props.ctx.playback.displayDuration);
const playbackSeconds = computed(() => props.ctx.playback.playbackSeconds);

const overviewMarks = computed(() => createOverviewRulerMarks(duration.value));
const localMarks = computed(() => createLocalRulerMarks(duration.value, pps.value));

/** 鸟瞰播放头百分比 */
const overviewPlayheadPercent = computed(() =>
  duration.value > 0 ? (playbackSeconds.value / duration.value) * 100 : 0
);

/** 轨道可视宽度（ResizeObserver 同步） */
const trackRef = ref<HTMLElement | null>(null);
const trackWidth = ref(960);
let trackObserver: ResizeObserver | null = null;

onMounted(() => {
  if (trackRef.value) {
    trackObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) trackWidth.value = entry.contentRect.width;
    });
    trackObserver.observe(trackRef.value);
  }
});

onBeforeUnmount(() => {
  trackObserver?.disconnect();
});

/** 轨道 rail 位移（播放头居中滚动，对齐 KK） */
const railLeft = computed(() =>
  clampRailLeft(playbackSeconds.value, trackWidth.value, duration.value, pps.value)
);
const trackPlayheadX = computed(() => playbackSeconds.value * pps.value + railLeft.value);
const railWidth = computed(() => duration.value * pps.value);

/** 点击 seek */
function seekOverview(event: MouseEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  props.ctx.playback.seekToSeconds(ratio * duration.value);
}

function seekTrack(event: MouseEvent): void {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const seconds = (event.clientX - rect.left - railLeft.value) / pps.value;
  props.ctx.playback.seekToSeconds(seconds);
}

function clipPercent(start: number, end: number): { left: string; width: string } {
  return {
    left: `${(start / duration.value) * 100}%`,
    width: `${((end - start) / duration.value) * 100}%`,
  };
}

function isClipActive(start: number, end: number): boolean {
  return playbackSeconds.value >= start && playbackSeconds.value < end;
}
</script>

<template>
  <footer class="rr__timeline" :class="{ 'rr__timeline--collapsed': collapsed }">
    <button type="button" class="rr__timeline-label rr__timeline-label--toggle" @click="collapsed = !collapsed">
      <DownOutlined v-if="!collapsed" />
      <RightOutlined v-else />
      鸟瞰图
    </button>
    <div v-if="!collapsed" class="rr__timeline-overview" role="button" tabindex="0" @click="seekOverview">
      <div class="rr__timeline-ruler">
        <span
          v-for="mark in overviewMarks"
          :key="mark.seconds"
          class="rr__timeline-ruler-mark"
          :style="{ left: `${mark.left}%` }"
        >
          {{ mark.label }}
        </span>
      </div>
      <div class="rr__overview-sections">
        <div
          v-for="clip in ctx.selectedTimeline?.clips ?? []"
          :key="clip.id"
          class="rr__overview-section"
          :class="{ 'rr__overview-section--active': isClipActive(clip.startSec, clip.endSec) }"
          :style="clipPercent(clip.startSec, clip.endSec)"
          :title="clip.label"
        />
      </div>
      <div class="rr__playhead" :style="{ left: `${overviewPlayheadPercent}%` }" />
    </div>

    <template v-if="!collapsed">
      <div class="rr__timeline-cell">
        <span class="rr__timeline-label rr__timeline-label--clip">剪辑</span>
        <div class="rr__timeline-zoom">
          <button
            type="button"
            class="rr__timeline-zoom-btn"
            :disabled="timelineZoom === TIMELINE_ZOOM_STEPS[0]"
            title="缩小"
            @click="adjustZoom(-1)"
          >
            −
          </button>
          <span class="rr__timeline-zoom-label">{{ timelineZoom }}x</span>
          <button
            type="button"
            class="rr__timeline-zoom-btn"
            :disabled="timelineZoom === TIMELINE_ZOOM_STEPS[TIMELINE_ZOOM_STEPS.length - 1]"
            title="放大"
            @click="adjustZoom(1)"
          >
            ＋
          </button>
        </div>
      </div>
      <div ref="trackRef" class="rr__timeline-track" role="button" tabindex="0" @click="seekTrack">
        <div
          class="rr__timeline-rail"
          :style="{ width: `${railWidth}px`, transform: `translateX(${railLeft}px)` }"
        >
          <div class="rr__timeline-ruler rr__timeline-ruler--local">
            <span
              v-for="mark in localMarks"
              :key="mark.seconds"
              class="rr__timeline-ruler-mark"
              :style="{ left: `${mark.x}px` }"
            >
              {{ mark.label }}
            </span>
          </div>
          <div
            v-for="clip in ctx.selectedTimeline?.clips ?? []"
            :key="clip.id"
            class="rr__clip"
            :class="{ 'rr__clip--active': isClipActive(clip.startSec, clip.endSec) }"
            :style="{
              left: `${clip.startSec * pps}px`,
              width: `${(clip.endSec - clip.startSec) * pps}px`,
            }"
          >
            <span class="rr__clip-start">{{ formatReviewTimecode(clip.startSec) }}</span>
            <span class="rr__clip-name">{{ clip.label }}</span>
          </div>
        </div>
        <div class="rr__playhead rr__playhead--clip" :style="{ left: `${trackPlayheadX}px` }" />
      </div>
    </template>
  </footer>
</template>

<style scoped>
.rr__timeline {
  grid-area: timeline;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  grid-template-rows: 36px 72px;
  gap: var(--spacing-2) var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-5);
  background: var(--component-panel-background);
}

.rr__timeline--collapsed {
  grid-template-rows: 28px;
}

.rr__timeline-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  font-size: var(--font-size-12);
  font-weight: 600;
  color: var(--color-text-secondary);
  padding: 0 var(--spacing-2);
}

.rr__timeline-label--toggle {
  cursor: pointer;
}

/* 剪辑列（左列第二行）：标签 + 缩放控件纵向排布 */
.rr__timeline-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding-top: 2px;
}

.rr__timeline-zoom {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 var(--spacing-2);
}

.rr__timeline-zoom-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-2);
  background: var(--color-bg-container);
  font-size: var(--font-size-12);
  line-height: 1;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0;
}

.rr__timeline-zoom-btn:hover:not(:disabled) {
  border-color: var(--color-action-primary);
  color: var(--color-action-primary);
}

.rr__timeline-zoom-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rr__timeline-zoom-label {
  min-width: 26px;
  text-align: center;
  font-size: var(--font-size-11);
  color: var(--color-text-tertiary);
  font-family: 'SF Mono', Consolas, monospace;
}

.rr__timeline-overview {
  position: relative;
  border-radius: var(--radius-3);
  background: var(--color-bg-hover);
  cursor: pointer;
  overflow: hidden;
}

.rr__timeline-ruler {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 18px;
}

.rr__timeline-ruler-mark {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--color-text-tertiary);
  font-family: 'SF Mono', Consolas, monospace;
  white-space: nowrap;
}

.rr__timeline-ruler--local {
  height: 24px;
}

.rr__overview-sections {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 14px;
}

.rr__overview-section {
  position: absolute;
  top: 0;
  bottom: 0;
  border-right: 1px solid var(--color-border-default);
  background: var(--color-fill-primary-subtle);
}

.rr__overview-section--active {
  background: var(--color-action-primary);
  opacity: 0.75;
}

.rr__playhead {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-feedback-error);
  pointer-events: none;
}

.rr__playhead::before {
  content: '';
  position: absolute;
  top: 0;
  left: -4px;
  border: 5px solid transparent;
  border-top: 7px solid var(--color-feedback-error);
}

.rr__timeline-track {
  position: relative;
  border-radius: var(--radius-3);
  background: var(--color-bg-hover);
  cursor: pointer;
  overflow: hidden;
}

.rr__timeline-rail {
  position: absolute;
  top: 0;
  bottom: 0;
}

.rr__clip {
  position: absolute;
  top: 46px;
  height: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border: 1px solid var(--color-status-info);
  border-radius: var(--radius-2);
  background: color-mix(in srgb, var(--color-status-info) 18%, transparent);
  overflow: hidden;
  white-space: nowrap;
}

.rr__clip--active {
  border-color: var(--color-action-primary);
  background: var(--color-fill-primary-subtle);
}

.rr__clip-start {
  font-size: 10px;
  font-family: 'SF Mono', Consolas, monospace;
  color: var(--color-status-info);
  flex-shrink: 0;
}

.rr__clip-name {
  font-size: 11px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
}

.rr__playhead--clip {
  z-index: 2;
}
</style>
