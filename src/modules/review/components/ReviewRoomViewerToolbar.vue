<script setup lang="ts">
import { computed } from 'vue';
import { message } from 'ant-design-vue';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  SearchOutlined,
  UndoOutlined,
} from '@ant-design/icons-vue';
import {
  REVIEW_ANNOTATE_COLORS,
  REVIEW_DRAW_TOOLS,
  REVIEW_TIME_DISPLAY_OPTIONS,
} from '../constants';
import type { ReviewRoomPageContext } from '../review-room/useReviewRoomPage';

defineOptions({ name: 'ReviewRoomViewerToolbar' });

const props = defineProps<{
  ctx: ReviewRoomPageContext;
}>();

const playback = computed(() => props.ctx.playback);
const annotations = computed(() => props.ctx.annotations);

const timeDisplayLabel = computed(
  () =>
    REVIEW_TIME_DISPLAY_OPTIONS.find((item) => item.key === playback.value.timeDisplayMode)?.label ??
    ''
);

function handleTimecodeSubmit(): void {
  const error = playback.value.submitTimecodeSearch();
  if (error) message.warning(error);
}
</script>

<template>
  <div class="rr__time-display">
    <!-- 时间显示切换 -->
    <a-popover trigger="click" placement="topLeft">
      <template #content>
        <div class="rr__time-display-menu">
          <button
            v-for="option in REVIEW_TIME_DISPLAY_OPTIONS"
            :key="option.key"
            type="button"
            class="rr__time-display-option"
            :class="{ 'rr__time-display-option--active': playback.timeDisplayMode === option.key }"
            @click="playback.setTimeDisplayMode(option.key)"
          >
            <CheckOutlined v-if="playback.timeDisplayMode === option.key" />
            <span v-else class="rr__time-display-option-placeholder" />
            {{ option.label }}
          </button>
        </div>
      </template>
      <button type="button" class="rr__time-display-trigger">
        <span class="rr__timecode">{{ playback.displayCurrentTime }}</span>
        <span class="rr__timecode rr__timecode--total">/ {{ playback.displayTotalTime }}</span>
        <DownOutlined class="rr__time-display-caret" />
      </button>
    </a-popover>

    <!-- 时间码搜索（仅 timecode 模式） -->
    <form
      v-if="playback.timeDisplayMode === 'timecode'"
      class="rr__timecode-search-form"
      @submit.prevent="handleTimecodeSubmit"
    >
      <SearchOutlined class="rr__timecode-search-icon" />
      <input
        v-model="playback.timecodeSearch"
        class="rr__timecode-search-input"
        placeholder="00000000"
        maxlength="11"
      />
      <button
        v-if="playback.timecodeSearch"
        type="button"
        class="rr__timecode-search-clear"
        @click="playback.timecodeSearch = ''"
      >
        <CloseOutlined />
      </button>
    </form>

    <div class="rr__time-display-spacer" />

    <!-- 圈注工具条 -->
    <div class="rr__time-annotation-toolbar">
      <div class="rr__draw-tools">
        <a-tooltip v-for="tool in REVIEW_DRAW_TOOLS" :key="tool.key" :title="tool.label">
          <button
            type="button"
            class="rr__tool-btn"
            :class="{ 'rr__tool-btn--active': annotations.activeTool === tool.key }"
            @click="annotations.toggleTool(tool.key)"
          >
            <component :is="tool.icon" :style="tool.rotate ? { transform: 'rotate(45deg)' } : undefined" />
          </button>
        </a-tooltip>
      </div>
      <div class="rr__utility-tools">
        <a-tooltip title="撤销">
          <button type="button" class="rr__tool-btn" @click="annotations.undo">
            <UndoOutlined />
          </button>
        </a-tooltip>
        <a-tooltip title="清空标注">
          <button type="button" class="rr__tool-btn" @click="annotations.clearAnnotations">
            <DeleteOutlined />
          </button>
        </a-tooltip>
      </div>
      <div class="rr__color-presets">
        <button
          v-for="color in REVIEW_ANNOTATE_COLORS"
          :key="color.key"
          type="button"
          class="rr__color-preset"
          :class="{ 'rr__color-preset--active': annotations.annotateColorKey === color.key }"
          :title="color.label"
          :style="{ background: color.token }"
          @click="annotations.setColor(color.key)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.rr__time-display {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background: rgba(255, 255, 255, 0.06);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.rr__time-display-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease;
}

.rr__time-display-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
}

.rr__timecode {
  font-family: 'SF Mono', Consolas, monospace;
  font-size: var(--font-size-13);
  color: #fff;
}

.rr__timecode--total {
  color: rgba(255, 255, 255, 0.55);
}

.rr__time-display-caret {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.55);
}

.rr__time-display-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 160px;
}

.rr__time-display-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  font-size: var(--font-size-13);
  color: var(--color-text-primary);
  cursor: pointer;
  text-align: left;
}

.rr__time-display-option:hover {
  background: var(--color-bg-hover);
}

.rr__time-display-option--active {
  color: var(--color-action-primary);
}

.rr__time-display-option-placeholder {
  width: 14px;
}

.rr__timecode-search-form {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: var(--radius-2);
  background: rgba(255, 255, 255, 0.1);
}

.rr__timecode-search-icon {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.rr__timecode-search-input {
  width: 88px;
  border: 0;
  background: transparent;
  color: #fff;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: var(--font-size-12);
  outline: none;
}

.rr__timecode-search-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.rr__timecode-search-clear {
  display: inline-flex;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-size: 10px;
  cursor: pointer;
  padding: 0;
}

.rr__time-display-spacer {
  flex: 1;
}

.rr__time-annotation-toolbar {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3);
}

.rr__draw-tools,
.rr__utility-tools {
  display: inline-flex;
  gap: 2px;
}

.rr__utility-tools {
  padding-left: var(--spacing-2);
  border-left: 1px solid rgba(255, 255, 255, 0.15);
}

.rr__tool-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.rr__tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.rr__tool-btn--active {
  background: var(--color-action-primary);
  color: #fff;
}

.rr__color-presets {
  display: inline-flex;
  gap: 6px;
  padding-left: var(--spacing-2);
  border-left: 1px solid rgba(255, 255, 255, 0.15);
}

.rr__color-preset {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.rr__color-preset:hover {
  transform: scale(1.15);
}

.rr__color-preset--active {
  border-color: #fff;
}
</style>
