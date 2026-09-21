<script setup lang="ts">
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons-vue';
import DashboardEmptyState from './DashboardEmptyState.vue';
import type { DashboardGlobalProductionLane, DashboardGlobalProductionLaneKey } from '../types';

defineProps<{
  lanes: DashboardGlobalProductionLane[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (event: 'go-to', route: string): void;
}>();

function taskRoute(taskId: string) {
  return `/my-tasks?view=global-production-board&openTaskId=${encodeURIComponent(taskId)}`;
}

function laneEmptyDescription(key: DashboardGlobalProductionLaneKey) {
  if (key === 'overdue') return '当前没有需要优先处理的逾期制作任务。';
  if (key === 'todo') return '新进入制作流程的任务会显示在这里。';
  if (key === 'today_work') return '今天需要推进的制作任务会显示在这里。';
  if (key === 'in_review') return '等待审核的制作任务会显示在这里。';
  return '今天完成的任务会汇总在这里，方便你快速回顾。';
}
</script>

<script lang="ts">
export default { name: 'DashboardGlobalProductionBoardCard' };
</script>

<template>
  <div class="db1-global-production">
    <a-spin :spinning="loading" wrapper-class-name="db1-global-production__spin">
      <div class="db1-global-production__lanes" tabindex="0" aria-label="全局今日看板泳道">
        <section
          v-for="lane in lanes"
          :key="lane.key"
          class="db1-global-production__lane"
          :class="{ 'db1-global-production__lane--dashed': lane.variant === 'dashed' }"
          :style="{ '--lane-accent': lane.accentColor }"
          :data-lane-key="lane.key"
        >
          <header class="db1-global-production__lane-header">
            <span class="db1-global-production__lane-title">
              <AlertOutlined v-if="lane.key === 'overdue'" />
              <CheckCircleOutlined v-else-if="lane.key === 'today_cleared'" />
              <ClockCircleOutlined v-else />
              <span>{{ lane.title }}</span>
            </span>
            <span class="db1-global-production__lane-count">{{ lane.items.length }}</span>
          </header>

          <div class="db1-global-production__lane-list">
            <button
              v-for="task in lane.items"
              :key="task.id"
              type="button"
              class="db1-global-production__task"
              :style="{ '--task-accent': task.accentColor }"
              @click.stop="emit('go-to', taskRoute(task.id))"
            >
              <span class="db1-global-production__task-name">
                <span class="db1-global-production__task-name-text">{{ task.name }}</span>
              </span>
              <span class="db1-global-production__task-project">{{ task.projectName }}</span>
              <span class="db1-global-production__task-stage">{{ task.stageText }}</span>
              <span class="db1-global-production__task-meta">
                <span
                  class="db1-global-production__priority"
                  :style="{ color: task.priorityColor }"
                >
                  {{ task.priorityLabel }}
                </span>
                <span>截止：{{ task.plannedEndText }}</span>
              </span>
            </button>

            <DashboardEmptyState
              v-if="lane.items.length === 0"
              class="db1-global-production__empty"
              :title="lane.emptyHint"
              :description="laneEmptyDescription(lane.key)"
            />
          </div>
        </section>
      </div>
    </a-spin>
  </div>
</template>
