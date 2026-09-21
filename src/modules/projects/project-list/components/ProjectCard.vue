<script setup lang="ts">
import { ClockCircleOutlined, FolderOpenOutlined, StarFilled, StarOutlined } from '@ant-design/icons-vue';
import { resolveStaffName } from '@/modules/staff/api';
import type { ProjectSummary } from '../../types';

defineOptions({ name: 'ProjectCard' });

const props = defineProps<{
  project: ProjectSummary;
}>();

const emit = defineEmits<{
  (event: 'click', project: ProjectSummary): void;
  (event: 'favorite-click', projectId: string): void;
}>();

function handleFavoriteClick(event: Event): void {
  event.stopPropagation();
  emit('favorite-click', props.project.id);
}
</script>

<template>
  <article
    class="project-card"
    role="button"
    tabindex="0"
    @click="emit('click', project)"
    @keydown.enter.prevent="emit('click', project)"
  >
    <!-- 封面占位（Demo 无后端图片） -->
    <div class="card-bg-placeholder">
      <FolderOpenOutlined class="placeholder-icon" />
    </div>
    <!-- 常驻深色蒙层 -->
    <div class="card-overlay"></div>

    <div class="card-content">
      <!-- 顶栏：类型标签 + 收藏按钮 -->
      <div class="card-top">
        <div class="top-left">
          <span v-if="project.type_name" class="type-tag">{{ project.type_name }}</span>
        </div>
        <button
          type="button"
          class="favorite-btn"
          :class="{ favorited: project.favorited }"
          :aria-label="project.favorited ? '取消收藏项目' : '收藏项目'"
          :title="project.favorited ? '取消收藏项目' : '收藏项目'"
          @click="handleFavoriteClick"
        >
          <StarFilled v-if="project.favorited" />
          <StarOutlined v-else />
        </button>
      </div>

      <div class="card-main">
        <!-- 创建时间 -->
        <div class="card-created">
          <ClockCircleOutlined />
          <span>创建于 {{ project.create_time }}</span>
        </div>

        <div class="card-lower">
          <!-- 状态 + 负责人 -->
          <div class="card-meta-row">
            <span
              class="meta-status"
              :style="{
                '--project-card-status-color': project.statusColor,
                '--project-card-status-bg': project.statusBg,
              }"
            >
              <span class="status-dot"></span>
              {{ project.statusLabel }}
            </span>
            <span class="info-divider">|</span>
            <span class="meta-owner">负责人：{{ resolveStaffName(project.owner) }}</span>
          </div>

          <!-- 项目名称 + 计划交付 -->
          <div class="card-title-row">
            <h3 class="card-title" :title="project.name">{{ project.name }}</h3>
            <div class="card-deadline">
              <span>计划交付</span>
              <strong>{{ project.planned_delivery || '未设置' }}</strong>
            </div>
          </div>

          <!-- 进度条（管线标签替代 KK 财务信息） -->
          <div class="card-progress">
            <div class="progress-info">
              <span class="progress-label">进度 {{ project.progress }}%</span>
              <span class="pipeline-text">{{ project.pipelineLabel }}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: `${project.progress}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.project-card {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.project-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card-hover);
}

.project-card:focus-visible {
  outline: 2px solid var(--color-action-primary);
  outline-offset: 2px;
}

/* 封面占位 */
.card-bg-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--component-card-background-soft);
}

.placeholder-icon {
  color: var(--color-text-disabled);
  font-size: 44px;
}

/* 常驻深色蒙层 */
.card-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--component-card-background) 90%, transparent);
}

/* 内容区 */
.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  color: var(--color-text-primary);
}

/* 顶栏 */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-left {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
}

.type-tag {
  min-width: 0;
  height: 24px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--color-feedback-success) 26%, transparent);
  background: var(--color-fill-success-subtle);
  color: var(--color-feedback-success);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

/* 收藏按钮 */
.favorite-btn {
  width: var(--control-height-sm);
  height: var(--control-height-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-full);
  background: var(--component-chip-background);
  color: var(--color-text-tertiary);
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.favorite-btn:hover,
.favorite-btn.favorited {
  background: var(--color-fill-primary-subtle);
  border-color: var(--color-border-strong);
  color: var(--color-action-primary);
}

/* 主体字段区 */
.card-main {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding-top: 6px;
}

.card-created {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.card-lower {
  margin-top: auto;
}

/* 信息行：状态 + 负责人 */
.card-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.meta-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 8px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
  color: var(--project-card-status-color);
  background: var(--project-card-status-bg);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: currentColor;
}

.info-divider {
  color: var(--color-border-strong);
}

.meta-owner {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 标题行 */
.card-title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-deadline {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}

.card-deadline strong {
  font-size: 16px;
  line-height: 1;
  color: var(--color-text-primary);
}

/* 进度条 */
.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.progress-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.pipeline-text {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: var(--color-border-divider);
  border-radius: var(--radius-3);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-3);
  background: var(--color-feedback-success);
  transition: width 0.4s ease;
}
</style>
