<script setup lang="ts">
import { StarFilled, StarOutlined, LeftOutlined } from '@ant-design/icons-vue';
import type { ProjectSummary } from '../types';
import type { ProductionPinnedItem } from '../types';
import { HERO_ACTION_BUTTONS } from '../constants';
import { useRouter } from 'vue-router';

defineOptions({ name: 'ProjectHeroPanel' });

const props = defineProps<{
  project: ProjectSummary;
  expanded: boolean;
  pinnedItems: ProductionPinnedItem[];
}>();

const emit = defineEmits<{
  (event: 'toggle'): void;
  (event: 'favorite'): void;
  (event: 'unpin', fieldKey: string): void;
}>();

const router = useRouter();

/** KK 进度条变色规则：>80 红 / >60 主色 / 其余绿 */
const progressColor = computed(() => {
  const progress = props.project.progress;
  if (progress > 80) return 'var(--color-feedback-error)';
  if (progress > 60) return 'var(--color-action-primary)';
  return 'var(--color-feedback-success)';
});

function goRoute(builder: (id: string) => string): void {
  const path = builder(props.project.id);
  // 项目子页面携带项目名，保证标签标题与面包屑显示项目名（对齐 KK）
  if (path.startsWith('/projects/')) {
    void router.push({ path, query: { name: props.project.name } });
  } else {
    void router.push(path);
  }
}
</script>

<template>
  <div :class="['project-hero-panel', { collapsed: !expanded }]">
    <!-- 封面背景：demo 无后端图片，用品牌渐变 -->
    <div class="cover-bg">
      <div class="cover-gradient" />
    </div>

    <div class="panel-content">
      <template v-if="expanded">
        <h1 class="project-title">
          {{ project.name }}
          <span
            class="status-tag status-tag--hero"
            :style="{ '--project-status-color': project.statusColor }"
          >
            {{ project.statusLabel }}
          </span>
          <a-button
            shape="circle"
            class="favorite-btn"
            :class="{ favorited: project.favorited }"
            :aria-label="project.favorited ? '取消收藏项目' : '收藏项目'"
            :title="project.favorited ? '取消收藏项目' : '收藏项目'"
            @click="emit('favorite')"
          >
            <StarFilled v-if="project.favorited" />
            <StarOutlined v-else />
          </a-button>
        </h1>

        <!-- 置顶字段 chips（制作信息 Pin 的字段聚合到英雄区） -->
        <div v-if="pinnedItems.length" class="pinned-row">
          <span v-for="item in pinnedItems" :key="item.key" class="pinned-chip">
            <span class="pinned-chip__label">{{ item.label }}</span>
            <span class="pinned-chip__value">{{ item.value }}</span>
            <button
              type="button"
              class="pinned-chip__remove"
              aria-label="取消置顶"
              @click="emit('unpin', item.key)"
            >
              ×
            </button>
          </span>
        </div>

        <div class="project-stats">
          <div class="stat-item">
            <span class="stat-highlight">{{ project.progress }}%</span>
            <span class="stat-sub">项目进度</span>
          </div>
        </div>

        <div class="progress-bar-wrap">
          <div
            class="progress-bar-fill"
            :style="{ width: `${project.progress}%`, backgroundColor: progressColor }"
          />
        </div>

        <div class="panel-bottom-actions">
          <a-button
            v-for="action in HERO_ACTION_BUTTONS"
            :key="action.key"
            class="action-btn"
            @click="goRoute(action.route)"
          >
            {{ action.label }}
          </a-button>
        </div>
      </template>

      <template v-else>
        <div class="panel-collapsed-row">
          <div class="collapsed-left">
            <h2 class="project-title-sm">{{ project.name }}</h2>
            <span class="status-tag" :style="{ '--project-status-color': project.statusColor }">
              {{ project.statusLabel }}
            </span>
          </div>
          <div class="panel-actions-right">
            <a-button
              v-for="action in HERO_ACTION_BUTTONS"
              :key="action.key"
              class="action-btn"
              @click="goRoute(action.route)"
            >
              {{ action.label }}
            </a-button>
          </div>
        </div>
      </template>
    </div>

    <a-button
      shape="circle"
      size="small"
      class="panel-toggle-btn"
      :title="expanded ? '收起' : '展开'"
      :aria-label="expanded ? '收起项目摘要' : '展开项目摘要'"
      @click="emit('toggle')"
    >
      <LeftOutlined :class="['toggle-icon', { expanded }]" />
    </a-button>
  </div>
</template>

<style scoped>
.project-hero-panel {
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  height: 236px;
  min-height: 220px;
  max-height: 280px;
  border-bottom: 1px solid var(--color-border-divider);
  transition:
    height 0.38s cubic-bezier(0.4, 0, 0.2, 1),
    min-height 0.38s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-hero-panel.collapsed {
  height: 60px;
  min-height: 60px;
  max-height: 60px;
}

.cover-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--color-action-primary) 10%, var(--color-bg-page)) 0%,
    var(--color-bg-page) 55%,
    color-mix(in srgb, var(--color-action-primary) 6%, var(--color-bg-page)) 100%
  );
}

.cover-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--color-bg-page) 82%, transparent);
  pointer-events: none;
}

.panel-content {
  position: relative;
  z-index: 1;
  padding: var(--spacing-6) var(--spacing-6) var(--spacing-5);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--spacing-4);
  box-sizing: border-box;
}

.panel-bottom-actions {
  position: absolute;
  top: var(--spacing-5);
  right: var(--spacing-6);
  display: flex;
  gap: var(--spacing-2);
  align-items: center;
}

.project-title {
  margin: 0;
  font-size: var(--font-size-24);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 32px;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3);
  max-width: 70%;
}

.favorite-btn.ant-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.favorite-btn.favorited {
  background: var(--color-fill-primary-subtle);
  border-color: var(--color-border-strong);
  color: var(--color-action-primary);
}

.status-tag {
  --project-status-color: var(--color-action-primary);

  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--project-status-color) 38%, transparent);
  background: color-mix(in srgb, var(--project-status-color) 14%, var(--color-bg-surface));
  color: var(--project-status-color);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-tag--hero {
  height: 30px;
  padding: 0 14px;
}

/* 置顶 chips */
.pinned-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.pinned-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 4px 0 12px;
  border-radius: var(--radius-full);
  border: 1px solid color-mix(in srgb, var(--color-action-primary) 30%, transparent);
  background: var(--color-fill-primary-subtle);
  font-size: 12px;
}

.pinned-chip__label {
  color: var(--color-text-tertiary);
}

.pinned-chip__value {
  color: var(--color-action-primary);
  font-weight: 600;
}

.pinned-chip__remove {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}

.pinned-chip__remove:hover {
  background: color-mix(in srgb, var(--color-action-primary) 18%, transparent);
  color: var(--color-action-primary);
}

.project-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-5);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.stat-highlight {
  font-size: var(--font-size-20);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.stat-sub {
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-medium);
}

.progress-bar-wrap {
  height: 4px;
  background: var(--color-fill-primary-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: var(--spacing-1);
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-action-primary) 40%, transparent);
}

.panel-collapsed-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.collapsed-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
}

.project-title-sm {
  margin: 0;
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-actions-right {
  display: flex;
  gap: var(--spacing-2);
  margin-right: var(--spacing-6);
}

.panel-toggle-btn.ant-btn {
  position: absolute;
  right: var(--spacing-4);
  bottom: var(--spacing-4);
  background: var(--color-fill-primary-subtle);
  border-color: var(--color-border-strong);
  color: var(--color-action-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.toggle-icon {
  font-size: 11px;
  transform: rotate(-90deg);
  transition: transform 0.3s ease;
}

.toggle-icon.expanded {
  transform: rotate(90deg);
}

@media (width <= 960px) {
  .panel-bottom-actions,
  .panel-actions-right {
    position: static;
    margin: 0;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .project-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
}
</style>
