<script setup lang="ts">
import { computed, ref } from 'vue';
import DashboardEmptyState from './DashboardEmptyState.vue';
import { taskStatusTabs, TASK_STATUS_TO_TAB } from '../constants';
import type { DashboardTaskItem, DashboardTaskStatusTabKey } from '../types';

const props = defineProps<{
  loading: boolean;
  tasks: DashboardTaskItem[];
}>();

const emit = defineEmits<{
  (event: 'go-to', route: string): void;
}>();

const selectedTab = ref<DashboardTaskStatusTabKey>('todo');

const filteredTasks = computed(() =>
  props.tasks.filter((task) => (TASK_STATUS_TO_TAB[task.status] ?? 'todo') === selectedTab.value)
);

const tabCounts = computed(() => {
  const counts = new Map<DashboardTaskStatusTabKey, number>();
  for (const task of props.tasks) {
    const tab = TASK_STATUS_TO_TAB[task.status] ?? 'todo';
    counts.set(tab, (counts.get(tab) ?? 0) + 1);
  }
  return counts;
});

const emptyCopy = computed(() => {
  if (selectedTab.value === 'in_progress') {
    return {
      title: '暂无进行中任务',
      description: '正在推进的任务会显示在这里，方便你持续跟进当前工作。',
    };
  }
  if (selectedTab.value === 'done') {
    return {
      title: '暂无已完成任务',
      description: '完成的任务会汇总在这里，便于你回顾最近的交付记录。',
    };
  }
  return {
    title: '暂无待办任务',
    description: '新分配给你的任务会显示在这里，方便你快速开始处理。',
  };
});
</script>

<script lang="ts">
export default { name: 'DashboardTaskCard' };
</script>

<template>
  <div class="db1-task">
    <div class="db1-task-tabs">
      <button
        v-for="tab in taskStatusTabs"
        :key="tab.key"
        type="button"
        class="db1-task-tab"
        :class="{ 'db1-task-tab--active': selectedTab === tab.key }"
        @click.stop="selectedTab = tab.key"
      >
        <span>{{ tab.label }}</span>
        <span class="db1-task-tab__count">{{ tabCounts.get(tab.key) ?? 0 }}</span>
      </button>
    </div>

    <div class="db1-task-scroll">
      <a-spin :spinning="loading" wrapper-class-name="db1-spin">
        <div v-if="filteredTasks.length > 0" class="db1-task-list">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="db1-task-item"
            @click.stop="emit('go-to', '/my-tasks')"
          >
            <div class="db1-task-item__header">
              <span class="db1-task-item__name" :title="task.name">{{ task.name }}</span>
              <span class="db1-task-item__status" :style="{ color: task.statusColor }">
                {{ task.statusLabel }}
              </span>
            </div>
            <div class="db1-task-item__project">
              <span class="db1-task-item__line" :style="{ color: task.lineColor, background: task.lineBg }">
                {{ task.lineLabel }}
              </span>
              {{ task.projectName }}
            </div>
            <div class="db1-task-item__meta">
              <span class="db1-task-item__priority" :style="{ color: task.priorityColor }">
                {{ task.priorityLabel }}
              </span>
              <span v-if="task.dueDate" class="db1-task-item__due">截止：{{ task.dueDate }}</span>
            </div>
          </div>
        </div>
        <DashboardEmptyState v-else :title="emptyCopy.title" :description="emptyCopy.description" />
      </a-spin>
    </div>
  </div>
</template>
