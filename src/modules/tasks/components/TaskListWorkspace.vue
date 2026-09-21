<script setup lang="ts">
import { onMounted, provide } from 'vue';
import TaskViewSidebar from './TaskViewSidebar.vue';
import TaskListToolbar from './TaskListToolbar.vue';
import TaskTableView from './TaskTableView.vue';
import TaskKanbanView from './TaskKanbanView.vue';
import TaskDetailDrawer from './TaskDetailDrawer.vue';
import TaskCreateModal from './TaskCreateModal.vue';
import TaskReworkModal from './TaskReworkModal.vue';
import { taskListPageKey } from '../injection';
import { useTaskListPage } from '../useTaskListPage';

defineOptions({ name: 'TaskListWorkspace' });

const page = useTaskListPage();
provide(taskListPageKey, page);

onMounted(() => {
  void page.reload();
});
</script>

<template>
  <div class="tl-page">
    <div class="tl-page__layout">
      <TaskViewSidebar />

      <div class="tl-page__main">
        <TaskListToolbar />

        <section class="tl-page__content">
          <a-spin :spinning="page.loading">
            <TaskTableView v-if="page.mode === 'table'" />
            <TaskKanbanView v-else />
          </a-spin>
        </section>
      </div>
    </div>

    <TaskDetailDrawer />
    <TaskCreateModal />
    <TaskReworkModal />
  </div>
</template>

<style scoped>
.tl-page {
  height: 100%;
  overflow: hidden;
}

.tl-page__layout {
  display: flex;
  height: 100%;
  min-height: 0;
}

.tl-page__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  overflow: hidden;
}

.tl-page__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
