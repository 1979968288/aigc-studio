<script setup lang="ts">
import { ref } from 'vue';
import {
  AppstoreOutlined,
  CaretRightOutlined,
  DownOutlined,
  FilterOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue';
import {
  REVIEW_ASSET_TABS,
  REVIEW_SHOT_COLORS,
  REVIEW_SHOT_RATINGS,
} from '../constants';
import type { ReviewRoomPageContext } from '../review-room/useReviewRoomPage';
import type { ReviewAssetTab } from '../types';

defineOptions({ name: 'ReviewRoomSidebar' });

const props = defineProps<{
  ctx: ReviewRoomPageContext;
}>();

const hiddenThumbnailIds = ref<Set<string>>(new Set());

function handleTabChange(key: ReviewAssetTab): void {
  if (key === 'digital') {
    props.ctx.handleDigitalTab();
    return;
  }
  props.ctx.activeAssetTab = key;
}

function onThumbnailError(id: string): void {
  hiddenThumbnailIds.value = new Set([...hiddenThumbnailIds.value, id]);
}

const colorOptions = REVIEW_SHOT_COLORS;
const ratingOptions = REVIEW_SHOT_RATINGS;
</script>

<template>
  <aside class="rr__sidebar">
    <!-- 资产 Tab -->
    <div class="rr__asset-tabs">
      <button
        v-for="tab in REVIEW_ASSET_TABS"
        :key="tab.key"
        type="button"
        class="rr__asset-tab"
        :class="{ 'rr__asset-tab--active': ctx.activeAssetTab === tab.key }"
        @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 镜头 Tab -->
    <template v-if="ctx.activeAssetTab === 'shot'">
      <a-input
        v-model:value="ctx.shotKeyword"
        class="rr__search"
        placeholder="搜索镜头编号 / 素材名"
        allow-clear
      />
      <div class="rr__shot-toolbar">
        <a-segmented
          :value="ctx.shotViewMode"
          :options="[
            { value: 'card', label: '卡片' },
            { value: 'list', label: '列表' },
          ]"
          size="small"
          @change="(value: string | number) => (ctx.shotViewMode = value as 'card' | 'list')"
        />
        <a-popover trigger="click" placement="bottomRight">
          <template #content>
            <div class="rr__shot-filter">
              <button
                v-for="color in colorOptions"
                :key="color.key"
                type="button"
                class="rr__shot-filter-dot"
                :class="{ 'rr__shot-filter-dot--active': ctx.shotColorFilter === color.key }"
                :title="color.label"
                :style="{ background: color.color }"
                @click="ctx.shotColorFilter = ctx.shotColorFilter === color.key ? null : color.key"
              />
            </div>
          </template>
          <a-button size="small">
            <template #icon><FilterOutlined /></template>
            分类
          </a-button>
        </a-popover>
      </div>

      <!-- 资源列表 -->
      <div class="rr__queue" :class="`rr__queue--${ctx.shotViewMode}`">
        <div v-if="ctx.sidebarLoading" class="rr__shot-skeleton-list">
          <div v-for="i in 3" :key="i" class="rr__shot-skeleton" />
        </div>
        <template v-else-if="ctx.visibleShotResources.length > 0">
          <a-tooltip
            v-for="item in ctx.visibleShotResources"
            :key="item.id"
            :title="`${item.subtitle}（${item.title}）`"
            placement="right"
          >
            <button
              type="button"
              class="rr__shot-item"
              :class="{ 'rr__shot-item--active': ctx.activeShotResourceId === item.id }"
              @click="ctx.selectSidebarResource(item)"
            >
              <span class="rr__shot-thumb">
                <img
                  v-if="!hiddenThumbnailIds.has(item.id)"
                  :src="item.thumbnailUrl ?? ''"
                  :alt="item.title"
                  loading="lazy"
                  @error="onThumbnailError(item.id)"
                />
              </span>
              <span v-if="ctx.playingShotResourceId === item.id" class="rr__shot-playing">
                <CaretRightOutlined />
                正在播放
              </span>
              <span
                v-if="item.colorCategory"
                class="rr__shot-color-pin"
                :style="{
                  background: colorOptions.find((c) => c.key === item.colorCategory)?.color,
                }"
              />
              <span class="rr__shot-card-title">{{ item.title }}</span>
              <span v-if="ctx.shotViewMode === 'list'" class="rr__shot-card-meta">
                {{ item.subtitle }} · {{ item.meta }}
              </span>
              <span v-if="item.rating" class="rr__shot-rating">{{ item.rating }}</span>
            </button>
          </a-tooltip>
        </template>
        <a-empty v-else description="暂无镜头" :image-style="{ height: '60px' }" />
      </div>

      <!-- 镜头详情卡 -->
      <div v-if="ctx.activeShotResource?.detail" class="rr__shot-detail">
        <button
          type="button"
          class="rr__shot-detail-head"
          @click="ctx.shotDetailCollapsed = !ctx.shotDetailCollapsed"
        >
          <span>镜头详情</span>
          <DownOutlined v-if="!ctx.shotDetailCollapsed" />
          <RightOutlined v-else />
        </button>
        <div v-if="!ctx.shotDetailCollapsed" class="rr__shot-detail-body">
          <div class="rr__shot-detail-grid">
            <div class="rr__shot-detail-item">
              <span>镜号</span>
              <strong>{{ ctx.activeShotResource.detail.code }}</strong>
            </div>
            <div class="rr__shot-detail-item">
              <span>时间</span>
              <strong>{{ ctx.activeShotResource.detail.timeRange }}</strong>
            </div>
            <div class="rr__shot-detail-item">
              <span>素材名</span>
              <strong>{{ ctx.activeShotResource.detail.fileName }}</strong>
            </div>
            <div class="rr__shot-detail-item">
              <span>帧长</span>
              <strong>{{ ctx.activeShotResource.detail.frameLength }}</strong>
            </div>
            <div class="rr__shot-detail-item">
              <span>开始帧</span>
              <strong>{{ ctx.activeShotResource.detail.startFrame }}</strong>
            </div>
            <div class="rr__shot-detail-item">
              <span>结束帧</span>
              <strong>{{ ctx.activeShotResource.detail.endFrame }}</strong>
            </div>
          </div>
          <div class="rr__shot-detail-row">
            <span class="rr__shot-detail-row-label">颜色分类</span>
            <div class="rr__shot-detail-colors">
              <button
                v-for="color in colorOptions"
                :key="color.key"
                type="button"
                class="rr__shot-detail-color"
                :class="{ 'rr__shot-detail-color--active': ctx.activeShotResource.colorCategory === color.key }"
                :title="color.label"
                :style="{ background: color.color }"
                @click="ctx.setShotColor(ctx.activeShotResource, color.key)"
              />
            </div>
          </div>
          <div class="rr__shot-detail-row">
            <span class="rr__shot-detail-row-label">等级评级</span>
            <div class="rr__shot-detail-ratings">
              <button
                v-for="rating in ratingOptions"
                :key="rating"
                type="button"
                class="rr__shot-detail-rating"
                :class="{ 'rr__shot-detail-rating--active': ctx.activeShotResource.rating === rating }"
                @click="ctx.setShotRating(ctx.activeShotResource, rating)"
              >
                {{ rating }}
              </button>
            </div>
          </div>
          <div v-if="ctx.activeShotResource.directorComments" class="rr__shot-detail-comments">
            <span>场记修改意见</span>
            <p>{{ ctx.activeShotResource.directorComments }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 剧本 Tab -->
    <div v-else-if="ctx.activeAssetTab === 'script'" class="rr__script-panel">
      <div v-if="ctx.sidebarLoading" class="rr__shot-skeleton-list">
        <div v-for="i in 3" :key="i" class="rr__shot-skeleton" />
      </div>
      <template v-else-if="ctx.scriptResources.length > 0">
        <article v-for="item in ctx.scriptResources" :key="item.id" class="rr__script-card">
          <strong>{{ item.title }}</strong>
          <span class="rr__script-card-meta">{{ item.subtitle }}</span>
          <p>{{ item.scriptContent }}</p>
        </article>
      </template>
      <a-empty v-else description="暂无剧本" :image-style="{ height: '60px' }" />
    </div>

    <!-- 数字资产 Tab（对齐 KK 占位） -->
    <div v-else class="rr__digital-panel">
      <a-empty description="功能开发中" :image-style="{ height: '60px' }">
        <template #image>
          <AppstoreOutlined style="font-size: 40px; color: var(--color-text-tertiary)" />
        </template>
      </a-empty>
    </div>
  </aside>
</template>

<style scoped>
.rr__sidebar {
  grid-area: sidebar;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-5);
  background: var(--component-panel-background);
  overflow: hidden;
}

.rr__asset-tabs {
  display: flex;
  gap: var(--spacing-4);
  border-bottom: 1px solid var(--color-border-divider);
}

.rr__asset-tab {
  position: relative;
  padding: var(--spacing-1) 0 var(--spacing-2);
  border: 0;
  background: transparent;
  font-size: var(--font-size-13);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.rr__asset-tab--active {
  color: var(--color-action-primary);
  font-weight: 600;
}

.rr__asset-tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: var(--radius-full);
  background: var(--color-action-primary);
}

.rr__search {
  flex: 0 0 auto;
}

.rr__shot-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rr__shot-filter {
  display: flex;
  gap: 8px;
  padding: 4px;
}

.rr__shot-filter-dot {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
}

.rr__shot-filter-dot--active {
  border-color: var(--color-text-primary);
}

.rr__queue {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  gap: var(--spacing-2);
  align-content: start;
}

.rr__queue--card {
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
}

.rr__queue--list {
  grid-template-columns: 1fr;
}

.rr__shot-skeleton-list {
  display: grid;
  gap: var(--spacing-2);
}

.rr__shot-skeleton {
  height: 84px;
  border-radius: var(--radius-3);
  background: var(--color-bg-hover);
  animation: rr-skeleton 1.2s ease-in-out infinite;
}

@keyframes rr-skeleton {
  50% {
    opacity: 0.5;
  }
}

.rr__shot-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--spacing-2);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-3);
  background: var(--component-card-background);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease;
}

.rr__shot-item:hover {
  border-color: var(--color-action-primary);
}

.rr__shot-item--active {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 1px var(--color-action-primary);
}

.rr__shot-thumb {
  display: block;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-2);
  background: var(--color-bg-hover);
  overflow: hidden;
}

.rr__shot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rr__shot-playing {
  position: absolute;
  left: var(--spacing-2);
  top: var(--spacing-2);
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: rgba(0, 0, 0, 0.55);
  color: var(--color-feedback-success);
  font-size: 10px;
}

.rr__shot-color-pin {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  border: 1.5px solid #fff;
}

.rr__shot-card-title {
  font-size: var(--font-size-12);
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rr__shot-card-meta {
  font-size: 11px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rr__shot-rating {
  position: absolute;
  bottom: 6px;
  right: 6px;
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-2);
  background: var(--color-action-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.rr__shot-detail {
  flex: 0 0 auto;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-3);
  background: var(--component-card-background);
  overflow: hidden;
}

.rr__shot-detail-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  border: 0;
  background: var(--color-bg-hover);
  font-size: var(--font-size-12);
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.rr__shot-detail-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  max-height: 260px;
  overflow-y: auto;
}

.rr__shot-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.rr__shot-detail-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.rr__shot-detail-item span {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.rr__shot-detail-item strong {
  font-size: var(--font-size-12);
  color: var(--color-text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rr__shot-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.rr__shot-detail-row-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.rr__shot-detail-colors {
  display: flex;
  gap: 6px;
}

.rr__shot-detail-color {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  cursor: pointer;
}

.rr__shot-detail-color--active {
  border-color: var(--color-text-primary);
}

.rr__shot-detail-ratings {
  display: flex;
  gap: 4px;
}

.rr__shot-detail-rating {
  width: 22px;
  height: 22px;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-2);
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.rr__shot-detail-rating--active {
  border-color: var(--color-action-primary);
  background: var(--color-action-primary);
  color: #fff;
}

.rr__shot-detail-comments {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border-divider);
}

.rr__shot-detail-comments span {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.rr__shot-detail-comments p {
  margin: 0;
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
}

.rr__script-panel,
.rr__digital-panel {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.rr__script-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-3);
  background: var(--component-card-background);
}

.rr__script-card strong {
  font-size: var(--font-size-13);
  color: var(--color-text-primary);
}

.rr__script-card-meta {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.rr__script-card p {
  margin: 0;
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
