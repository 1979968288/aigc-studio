<script setup lang="ts">
import {
  BookOutlined,
  CaretRightFilled,
  DownOutlined,
  FileTextOutlined,
  MoreOutlined,
  PushpinFilled,
  ReadOutlined,
  RightOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { computed, ref } from 'vue';
import type { DemoProjectOutput } from '@/shared/mock/db';
import { OUTPUT_STATUS_MAP, OVERVIEW_FOLDERS } from '../constants';

defineOptions({ name: 'ProjectOverviewPanel' });

const props = defineProps<{
  outputs: DemoProjectOutput[];
  projectId: string;
}>();

const emit = defineEmits<{
  (event: 'go-data-list'): void;
}>();

const sortBy = ref<'modified' | 'created' | 'name'>('modified');

const sortedOutputs = computed(() => {
  const list = [...props.outputs];
  if (sortBy.value === 'name') {
    return list.sort((left, right) => left.filename.localeCompare(right.filename));
  }
  if (sortBy.value === 'created') {
    return list.sort((left, right) => left.title.localeCompare(right.title));
  }
  return list.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
});

function handleOutputAction(action: string): void {
  const labels: Record<string, string> = {
    download: '下载',
    rename: '重命名',
    delete: '删除',
  };
  message.info(`演示环境：${labels[action] ?? action}操作未接后端`);
}

/** KK 文件夹图标映射（folder-kanban / book-open / users 线稿图标） */
const folderIconMap: Record<string, unknown> = {
  'folder-kanban': ReadOutlined,
  'book-open': BookOutlined,
  users: TeamOutlined,
};

function iconForSpace(iconKey: string): unknown {
  return folderIconMap[iconKey] ?? FileTextOutlined;
}
</script>

<template>
  <div class="project-overview">
    <!-- 核心输出 / 剪辑成片 -->
    <div class="section-block">
      <div class="section-header">
        <h3 class="section-title">核心输出 / 剪辑成片 ({{ outputs.length }})</h3>
        <a-select
          v-if="outputs.length"
          v-model:value="sortBy"
          size="small"
          class="sort-select"
        >
          <a-select-option value="modified">按修改时间排序</a-select-option>
          <a-select-option value="created">按创建时间排序</a-select-option>
          <a-select-option value="name">按名称排序</a-select-option>
        </a-select>
      </div>

      <div v-if="outputs.length" class="video-grid">
        <div v-for="item in sortedOutputs" :key="item.id" class="video-card">
          <div class="video-thumbnail">
            <div class="thumbnail-placeholder" />
            <span
              class="status-badge"
              :style="{
                background: OUTPUT_STATUS_MAP[item.status]?.background,
                color: OUTPUT_STATUS_MAP[item.status]?.color,
              }"
            >
              {{ OUTPUT_STATUS_MAP[item.status]?.label }}
            </span>
            <div class="play-overlay">
              <span class="play-icon" aria-hidden="true">
                <CaretRightFilled />
              </span>
            </div>
            <span v-if="item.duration" class="duration-badge">{{ item.duration }}</span>
          </div>
          <div class="video-info">
            <div class="video-title" :title="item.filename">{{ item.filename }}</div>
            <div class="video-meta">
              <span v-if="item.pinCount > 0" class="meta-item">
                <PushpinFilled />
                {{ item.pinCount }}
              </span>
              <span class="meta-item">{{ item.size }}</span>
              <span class="meta-item">{{ item.updatedAgo }}</span>
            </div>
          </div>
          <a-dropdown placement="bottomRight">
            <button
              type="button"
              class="more-btn"
              aria-label="更多核心输出操作"
              @click.stop
            >
              <MoreOutlined />
              <DownOutlined class="more-btn__caret" />
            </button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="download" @click="handleOutputAction('download')">
                  下载
                </a-menu-item>
                <a-menu-item key="rename" @click="handleOutputAction('rename')">
                  重命名
                </a-menu-item>
                <a-menu-item key="delete" @click="handleOutputAction('delete')">
                  删除
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>

      <div v-else class="overview-empty">
        <span class="overview-empty-icon" aria-hidden="true">
          <FileTextOutlined />
        </span>
        <div class="overview-empty-title">暂无核心输出</div>
        <div class="overview-empty-description">
          从镜头线定稿或审片室提交剪辑成片后，会在这里汇总最近版本。
        </div>
      </div>
    </div>

    <!-- 文件夹 -->
    <div class="section-block">
      <div class="section-header">
        <h3 class="section-title">文件夹 ({{ OVERVIEW_FOLDERS.length }})</h3>
        <button type="button" class="section-link" @click="emit('go-data-list')">
          查看全部
          <RightOutlined />
        </button>
      </div>
      <div class="folder-grid">
        <button
          v-for="folder in OVERVIEW_FOLDERS"
          :key="folder.key"
          type="button"
          class="folder-card"
          @click="emit('go-data-list')"
        >
          <div class="folder-visual">
            <div class="folder-stack" />
            <component :is="iconForSpace(folder.icon)" class="folder-icon" />
          </div>
          <div class="folder-info">
            <div class="folder-name">{{ folder.label }}</div>
            <div class="folder-count">{{ folder.pathLabel }}</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-overview {
  animation: overview-fade-in 0.25s ease;
}

@keyframes overview-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-block {
  margin-bottom: var(--spacing-5);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-4);
  gap: var(--spacing-3);
}

.section-title {
  margin: 0;
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.sort-select {
  width: 160px;
}

.section-link {
  appearance: none;
  min-height: var(--control-height-sm);
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-action-link);
  font-size: var(--font-size-14);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
}

.section-link:hover {
  opacity: 0.8;
}

/* 视频卡片 */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-4);
}

.video-card {
  position: relative;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
  overflow: hidden;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.video-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card-hover);
}

.video-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
}

.thumbnail-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-action-primary) 16%, var(--color-bg-page)),
    color-mix(in srgb, var(--color-action-primary) 4%, var(--color-bg-page))
  );
}

.status-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  height: 22px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, black 18%, transparent);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, black 55%, transparent);
  color: #fff;
  font-size: 16px;
}

.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  height: 20px;
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-2);
  background: color-mix(in srgb, black 60%, transparent);
  color: #fff;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.video-info {
  padding: 10px 12px;
}

.video-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.more-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 26px;
  height: 26px;
  display: none;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-2);
  background: color-mix(in srgb, var(--component-card-background) 90%, transparent);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.video-card:hover .more-btn {
  display: inline-flex;
}

.more-btn__caret {
  font-size: 9px;
}

/* 空态 */
.overview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 112px;
  padding: var(--spacing-5);
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
  color: var(--color-text-tertiary);
  text-align: center;
}

.overview-empty-icon {
  font-size: 28px;
  color: var(--color-text-disabled);
}

.overview-empty-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.overview-empty-description {
  max-width: 360px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-tertiary);
}

/* 文件夹卡片（KK 同款：白底色块文件夹 + 主色线稿图标叠放） */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-4);
}

.folder-card {
  appearance: none;
  width: 100%;
  background: var(--component-card-background);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  min-height: 88px;
  padding: var(--spacing-4);
  color: inherit;
  cursor: pointer;
  text-align: left;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: var(--spacing-3);
  align-items: center;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.folder-card:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card);
}

.folder-visual {
  position: relative;
  height: 56px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.folder-stack {
  position: absolute;
  bottom: 0;
  width: 48px;
  height: 32px;
  background: var(--color-bg-card-soft, var(--component-card-background-soft));
  border-radius: var(--radius-3);
  border: 1px solid var(--color-border-default);
}

.folder-stack::before {
  content: '';
  position: absolute;
  top: -7px;
  left: 4px;
  right: 4px;
  height: 14px;
  background: var(--color-bg-card-soft, var(--component-card-background-soft));
  border-radius: var(--radius-3) var(--radius-3) 0 0;
  border: 1px solid var(--color-border-default);
  border-bottom: none;
}

.folder-icon {
  position: relative;
  z-index: 1;
  font-size: 24px;
  color: var(--color-action-primary);
}

.folder-info {
  min-width: 0;
  text-align: left;
}

.folder-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
