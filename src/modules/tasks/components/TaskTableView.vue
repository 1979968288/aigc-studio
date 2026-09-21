<script setup lang="ts">
import { computed, inject } from 'vue';
import type { TableColumnsType } from 'ant-design-vue';
import type { DemoTask } from '@/shared/mock/db';
import { TASK_LINE_META, TASK_PRIORITY_META, TASK_STATUS_META } from '../constants';
import { taskListPageKey } from '../injection';

defineOptions({ name: 'TaskTableView' });

const page = inject(taskListPageKey)!;

const columns = computed<TableColumnsType>(() => [
  {
    title: '任务名称',
    key: 'name',
    minWidth: 260,
  },
  {
    title: '项目',
    key: 'projectId',
    width: 180,
  },
  {
    title: '生产线',
    key: 'line',
    width: 90,
  },
  {
    title: '环节',
    key: 'stageText',
    width: 150,
  },
  {
    title: '负责人',
    key: 'assignee',
    width: 110,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '优先级',
    key: 'priority',
    width: 90,
  },
  {
    title: '截止日期',
    key: 'dueDate',
    width: 110,
  },
]);

const lineMeta = (line: string) => TASK_LINE_META[line] ?? { label: line, color: '', bg: '' };
const statusMeta = (status: string) => TASK_STATUS_META[status] ?? { label: status, color: '' };
const priorityMeta = (priority: string) =>
  TASK_PRIORITY_META[priority] ?? { label: priority, color: '' };
</script>

<template>
  <a-table
    :columns="columns"
    :data-source="page.tasks"
    :row-key="(record: { id: string }) => record.id"
    :pagination="{ pageSize: 20, showTotal: (total: number) => `共 ${total} 条` }"
    size="middle"
    :row-class-name="() => 'tl-table__row'"
    @row-click="(record: DemoTask) => page.openDetail(record)"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'name'">
        <a
          class="tl-table__name"
          @click="page.openDetail(record as unknown as DemoTask)"
        >
          <span
            class="tl-table__line-tag"
            :style="{ color: lineMeta(record.line).color, background: lineMeta(record.line).bg }"
          >
            {{ lineMeta(record.line).label }}
          </span>
          {{ record.name }}
        </a>
      </template>

      <template v-else-if="column.key === 'projectId'">
        <span class="tl-table__muted">{{ page.projectMap.get(record.projectId) ?? record.projectId }}</span>
      </template>

      <template v-else-if="column.key === 'line'">
        {{ lineMeta(record.line).label }}
      </template>

      <template v-else-if="column.key === 'stageText'">
        <span class="tl-table__muted">{{ record.stageText || '—' }}</span>
      </template>

      <template v-else-if="column.key === 'assignee'">
        <span class="tl-table__muted">{{ page.staffMap.get(record.assignee) ?? record.assignee }}</span>
      </template>

      <template v-else-if="column.key === 'status'">
        <a-tag :color="statusMeta(record.status).color" class="tl-table__tag">
          {{ statusMeta(record.status).label }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'priority'">
        <a-tag :color="priorityMeta(record.priority).color" class="tl-table__tag">
          {{ priorityMeta(record.priority).label }}
        </a-tag>
      </template>

      <template v-else-if="column.key === 'dueDate'">
        <span class="tl-table__muted">{{ record.dueDate }}</span>
      </template>
    </template>
  </a-table>
</template>

<style scoped>
.tl-table__row {
  cursor: pointer;
}

.tl-table__name {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  font-weight: 500;
  min-width: 0;
  color: var(--color-text-primary);
  cursor: pointer;
}

.tl-table__name:hover {
  color: var(--color-action-primary);
}

.tl-table__line-tag {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: var(--radius-2);
  font-size: var(--font-size-11);
  font-weight: 500;
  line-height: 18px;
}

.tl-table__muted {
  color: var(--color-text-secondary);
}

.tl-table__tag {
  margin-inline-end: 0;
}
</style>
