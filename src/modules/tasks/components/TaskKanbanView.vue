<script setup lang="ts">
import { computed, inject } from 'vue';
import { TASK_KANBAN_LANES, TASK_LINE_META, TASK_PRIORITY_META } from '../constants';
import { taskListPageKey } from '../injection';

defineOptions({ name: 'TaskKanbanView' });

const page = inject(taskListPageKey)!;

const grouped = computed(() =>
  TASK_KANBAN_LANES.map((lane) => ({
    ...lane,
    items: page.tasks.filter((task) => task.status === lane.key),
  }))
);

const lineMeta = (line: string) => TASK_LINE_META[line] ?? { label: line, color: '', bg: '' };
const priorityMeta = (priority: string) =>
  TASK_PRIORITY_META[priority] ?? { label: priority, color: '' };
</script>

<template>
  <div class="tl-kanban">
    <div v-for="lane in grouped" :key="lane.key" class="tl-kanban__lane">
      <div class="tl-kanban__lane-head">
        <span class="tl-kanban__lane-dot" :style="{ background: lane.color }" />
        <span class="tl-kanban__lane-title">{{ lane.label }}</span>
        <span class="tl-kanban__lane-count">{{ lane.items.length }}</span>
      </div>

      <div class="tl-kanban__lane-body">
        <div
          v-for="task in lane.items"
          :key="task.id"
          class="tl-kanban__card"
          @click="page.openDetail(task)"
        >
          <div class="tl-kanban__card-top">
            <span
              class="tl-kanban__line-tag"
              :style="{ color: lineMeta(task.line).color, background: lineMeta(task.line).bg }"
            >
              {{ lineMeta(task.line).label }}
            </span>
            <span class="tl-kanban__priority" :style="{ color: priorityMeta(task.priority).color }">
              {{ priorityMeta(task.priority).label }}
            </span>
          </div>

          <div class="tl-kanban__card-name">{{ task.name }}</div>

          <div class="tl-kanban__card-foot">
            <span class="tl-kanban__card-project">
              {{ page.projectMap.get(task.projectId) ?? task.projectId }}
            </span>
            <span class="tl-kanban__card-assignee">
              {{ page.staffMap.get(task.assignee) ?? task.assignee }}
            </span>
          </div>

          <div v-if="task.dueDate" class="tl-kanban__card-due">截止 {{ task.dueDate }}</div>
        </div>

        <div v-if="lane.items.length === 0" class="tl-kanban__empty">暂无任务</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tl-kanban {
  display: flex;
  gap: var(--spacing-4);
  align-items: flex-start;
  min-height: 100%;
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
}

.tl-kanban__lane {
  flex: 0 0 264px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--color-bg-layout);
  overflow: hidden;
}

.tl-kanban__lane-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-border-divider);
  background: var(--component-panel-background);
}

.tl-kanban__lane-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tl-kanban__lane-title {
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-primary);
}

.tl-kanban__lane-count {
  margin-left: auto;
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.tl-kanban__lane-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.tl-kanban__card {
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-3);
  background: var(--component-panel-background);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.tl-kanban__card:hover {
  box-shadow: var(--shadow-card);
  border-color: var(--color-action-primary);
}

.tl-kanban__card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.tl-kanban__line-tag {
  padding: 0 6px;
  border-radius: var(--radius-2);
  font-size: var(--font-size-11);
  font-weight: 500;
  line-height: 18px;
}

.tl-kanban__priority {
  font-size: var(--font-size-12);
}

.tl-kanban__card-name {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-13);
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.tl-kanban__card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.tl-kanban__card-project,
.tl-kanban__card-assignee {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tl-kanban__card-due {
  margin-top: 4px;
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.tl-kanban__empty {
  padding: var(--spacing-4);
  text-align: center;
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}
</style>
