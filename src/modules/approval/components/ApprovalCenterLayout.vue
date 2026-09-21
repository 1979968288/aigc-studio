<script setup lang="ts">
import { onMounted, provide } from 'vue';
import ApprovalSidebar from './ApprovalSidebar.vue';
import ApprovalToolbar from './ApprovalToolbar.vue';
import ApprovalTableView from './ApprovalTableView.vue';
import ApprovalKanbanView from './ApprovalKanbanView.vue';
import ApprovalDetailDrawer from './ApprovalDetailDrawer.vue';
import ApprovalDecisionModal from './ApprovalDecisionModal.vue';
import { approvalCenterPageKey } from '../injection';
import { useApprovalCenterPage } from '../useApprovalCenterPage';

defineOptions({ name: 'ApprovalCenterLayout' });

const page = useApprovalCenterPage();
provide(approvalCenterPageKey, page);

onMounted(() => {
  void page.reload();
});
</script>

<template>
  <div class="ap-page">
    <div class="ap-page__layout">
      <ApprovalSidebar />

      <div class="ap-page__main">
        <ApprovalToolbar />

        <section class="ap-page__content">
          <a-spin :spinning="page.loading">
            <ApprovalTableView v-if="page.view === 'table'" />
            <ApprovalKanbanView v-else />
          </a-spin>
        </section>
      </div>
    </div>

    <ApprovalDetailDrawer />
    <ApprovalDecisionModal />
  </div>
</template>

<style scoped>
.ap-page {
  height: 100%;
  overflow: hidden;
}

.ap-page__layout {
  display: flex;
  height: 100%;
  min-height: 0;
}

.ap-page__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  overflow: hidden;
}

.ap-page__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
