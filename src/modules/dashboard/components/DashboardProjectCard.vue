<script setup lang="ts">
import { FolderOpenOutlined, StarFilled } from '@ant-design/icons-vue';
import { resolveStaffName } from '@/modules/staff/api';
import DashboardEmptyState from './DashboardEmptyState.vue';
import type { DashboardProjectSummary } from '../types';

defineProps<{
  projects: DashboardProjectSummary[];
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  gridClass: 'db1-watch-grid' | 'db1-project-grid';
}>();

const emit = defineEmits<{
  (event: 'go-to', route: string): void;
}>();
</script>

<script lang="ts">
export default { name: 'DashboardProjectCard' };
</script>

<template>
  <a-spin :spinning="loading" wrapper-class-name="db1-spin">
    <div v-if="projects.length > 0" :class="gridClass">
      <button
        v-for="project in projects"
        :key="project.id"
        type="button"
        class="project-card"
        @click="emit('go-to', `/projects/${project.id}/detail?name=${encodeURIComponent(project.name)}`)"
      >
        <div class="card-bg-placeholder">
          <FolderOpenOutlined class="placeholder-icon" />
        </div>
        <div class="card-overlay"></div>

        <div class="card-content">
          <div class="card-top">
            <div class="top-left">
              <span v-if="project.type_name" class="type-tag">{{ project.type_name }}</span>
            </div>
            <div class="top-right">
              <span
                v-if="project.favorited"
                class="favorite-badge"
                aria-label="已收藏项目"
                title="已收藏项目"
              >
                <StarFilled />
              </span>
            </div>
          </div>

          <div class="card-main">
            <div class="card-lower">
              <div class="card-meta-row">
                <span
                  class="meta-status"
                  :style="{
                    '--dashboard-project-status-color': project.statusColor,
                    '--dashboard-project-status-bg': project.statusBg,
                  }"
                >
                  <span class="status-dot"></span>
                  {{ project.statusLabel }}
                </span>
                <span class="meta-owner">负责人：{{ resolveStaffName(project.owner) }}</span>
              </div>

              <div class="card-title-row">
                <h3 class="card-title" :title="project.name">{{ project.name }}</h3>
                <div class="card-deadline">
                  <span>计划交付</span>
                  <strong>{{ project.planned_delivery?.slice(0, 10) || '未设置' }}</strong>
                </div>
              </div>

              <div class="card-progress">
                <div class="progress-info">
                  <span class="progress-label">进度 {{ project.progress }}%</span>
                  <span class="finance-text">创建于 {{ project.create_time?.slice(0, 10) }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: `${project.progress}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
    <DashboardEmptyState v-else :title="emptyTitle" :description="emptyDescription" />
  </a-spin>
</template>
