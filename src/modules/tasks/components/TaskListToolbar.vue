<script setup lang="ts">
import { inject } from 'vue';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { TASK_LINE_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../constants';
import { taskListPageKey } from '../injection';

defineOptions({ name: 'TaskListToolbar' });

const page = inject(taskListPageKey)!;
</script>

<template>
  <div class="tl-toolbar">
    <div class="tl-toolbar__left">
      <a-segmented
        :value="page.mode"
        :options="[
          { value: 'table', label: '表格' },
          { value: 'kanban', label: '看板' },
        ]"
        @change="(value: unknown) => page.setMode((value as 'table' | 'kanban'))"
      />
    </div>

    <div class="tl-toolbar__right">
      <a-input
        :value="page.keyword"
        allow-clear
        placeholder="搜索任务名称"
        class="tl-toolbar__search"
        @update:value="(value: string) => (page.keyword = value)"
      >
        <template #prefix><SearchOutlined /></template>
      </a-input>

      <a-select
        :value="page.lineFilter"
        :options="[{ value: 'all', label: '全部生产线' }, ...TASK_LINE_OPTIONS]"
        class="tl-toolbar__filter"
        @change="(value: unknown) => (page.lineFilter = value as typeof page.lineFilter)"
      />

      <a-select
        :value="page.statusFilter"
        :options="[{ value: 'all', label: '全部状态' }, ...TASK_STATUS_OPTIONS]"
        class="tl-toolbar__filter"
        @change="(value: unknown) => (page.statusFilter = value as typeof page.statusFilter)"
      />

      <a-select
        :value="page.priorityFilter"
        :options="[{ value: 'all', label: '全部优先级' }, ...TASK_PRIORITY_OPTIONS]"
        class="tl-toolbar__filter"
        @change="(value: unknown) => (page.priorityFilter = value as typeof page.priorityFilter)"
      />

      <a-button type="primary" @click="page.createOpen = true">
        <template #icon><PlusOutlined /></template>
        新建任务
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.tl-toolbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.tl-toolbar__left {
  display: flex;
  align-items: center;
}

.tl-toolbar__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
}

.tl-toolbar__search {
  width: 200px;
}

.tl-toolbar__filter {
  width: 132px;
}
</style>
