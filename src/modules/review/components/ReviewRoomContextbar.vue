<script setup lang="ts">
import { computed } from 'vue';
import { DownOutlined } from '@ant-design/icons-vue';
import { REVIEW_STATUS_META } from '../constants';
import type { ReviewRoomPageContext } from '../review-room/useReviewRoomPage';

defineOptions({ name: 'ReviewRoomContextbar' });

const props = withDefaults(
  defineProps<{
    ctx: ReviewRoomPageContext;
    /** 顶栏模式：Teleport 到工作台第二行，与面包屑层级同排（对齐 KK is-topbar） */
    isTopbar?: boolean;
  }>(),
  { isTopbar: false }
);

const timelineOptions = computed(() =>
  props.ctx.timelines.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.versionCode}`,
  }))
);

const statusMeta = computed(() =>
  props.ctx.selectedTimeline ? REVIEW_STATUS_META[props.ctx.selectedTimeline.status] : null
);

function handleChange(value: unknown): void {
  void props.ctx.selectTimeline(String(value ?? ''));
}
</script>

<template>
  <div class="rr__contextbar" :class="{ 'rr__contextbar--topbar': isTopbar }">
    <div class="rr__contextbar-left">
      <span v-if="!isTopbar" class="rr__contextbar-label">时间线</span>
      <a-select
        :value="ctx.selectedTimelineId || undefined"
        :options="timelineOptions"
        class="rr__contextbar-picker"
        :class="{ 'rr__contextbar-picker--topbar': isTopbar }"
        :bordered="!isTopbar"
        placeholder="选择审片项"
        @change="handleChange"
      >
        <template #suffixIcon>
          <DownOutlined />
        </template>
      </a-select>
      <span
        v-if="statusMeta"
        class="rr__status-badge"
        :class="{ 'rr__status-badge--topbar': isTopbar }"
        :style="{ color: statusMeta.color, background: statusMeta.bg }"
      >
        {{ statusMeta.label }}
      </span>
    </div>
    <div v-if="ctx.activeClip" class="rr__contextbar-right">
      <span class="rr__contextbar-clip">{{ ctx.activeClip.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.rr__contextbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  min-height: 36px;
}

/* 顶栏模式：无内边距/无底边线，撑满页面上下文槽，左右贴齐 */
.rr__contextbar--topbar {
  width: 100%;
  min-height: 0;
}

.rr__contextbar-left {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
}

.rr__contextbar-label {
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.rr__contextbar-picker {
  min-width: 220px;
}

/* 顶栏选择器：无边框、文字按钮风格（对齐 KK timeline-trigger--topbar） */
.rr__contextbar-picker--topbar {
  min-width: 168px;
}

.rr__contextbar-picker--topbar :deep(.ant-select-selector) {
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  padding-left: 0 !important;
  font-weight: 600;
  font-size: var(--font-size-14);
}

.rr__contextbar-picker--topbar:hover :deep(.ant-select-selector) {
  background: var(--color-bg-hover) !important;
}

.rr__status-badge {
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-12);
  font-weight: 500;
}

.rr__status-badge--topbar {
  padding: 1px 10px;
}

.rr__contextbar-right {
  min-width: 0;
  margin-left: auto;
}

.rr__contextbar-clip {
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
