<script setup lang="ts">
import { computed, inject } from 'vue';
import { APPROVAL_STATUS_META } from '../constants';
import { approvalCenterPageKey } from '../injection';
import {
  approvalIsOverdue,
  approvalProjectName,
  approvalStaffName,
  approvalStatusMeta,
  approvalTargetExtra,
  approvalTargetText,
  approvalTypeLabel,
} from '../useApprovalCenterPage';

defineOptions({ name: 'ApprovalKanbanView' });

const page = inject(approvalCenterPageKey)!;

const lanes = computed(() => {
  const keys = ['pending', 'approved', 'rejected'] as const;
  return keys.map((key) => ({
    key,
    meta: APPROVAL_STATUS_META[key],
    items: page.approvals.filter((item) => item.status === key),
  }));
});
</script>

<template>
  <div class="ap-kanban">
    <div v-for="lane in lanes" :key="lane.key" class="ap-kanban__lane">
      <div class="ap-kanban__lane-head">
        <span class="ap-kanban__lane-dot" :style="{ background: lane.meta.color }" />
        <span class="ap-kanban__lane-title">{{ lane.meta.label }}</span>
        <span class="ap-kanban__lane-count">{{ lane.items.length }}</span>
      </div>

      <div class="ap-kanban__lane-body">
        <div
          v-for="item in lane.items"
          :key="item.id"
          class="ap-kanban__card"
          :class="{ 'ap-kanban__card--overdue': approvalIsOverdue(item) }"
          @click="page.openDetail(item)"
        >
          <div class="ap-kanban__card-title">
            <span v-if="approvalIsOverdue(item)" class="ap-kanban__overdue">逾期</span>
            {{ item.title }}
          </div>

          <div class="ap-kanban__card-type">{{ approvalTypeLabel(item.type) }}</div>

          <div class="ap-kanban__card-target">{{ approvalTargetText(item) }}</div>
          <div v-if="approvalTargetExtra(item)" class="ap-kanban__card-extra">
            {{ approvalTargetExtra(item) }}
          </div>

          <div class="ap-kanban__card-foot">
            <span class="ap-kanban__card-project">{{ approvalProjectName(item.projectId) }}</span>
            <span class="ap-kanban__card-submitter">{{ approvalStaffName(item.submitter) }}</span>
          </div>
        </div>

        <div v-if="lane.items.length === 0" class="ap-kanban__empty">暂无审批</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ap-kanban {
  display: flex;
  gap: var(--spacing-4);
  align-items: flex-start;
  min-height: 100%;
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
}

.ap-kanban__lane {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--color-bg-layout);
  overflow: hidden;
}

.ap-kanban__lane-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  border-bottom: 1px solid var(--color-border-divider);
  background: var(--component-panel-background);
}

.ap-kanban__lane-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.ap-kanban__lane-title {
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-primary);
}

.ap-kanban__lane-count {
  margin-left: auto;
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.ap-kanban__lane-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.ap-kanban__card {
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-3);
  background: var(--component-panel-background);
  cursor: pointer;
}

.ap-kanban__card--overdue {
  border-color: var(--color-feedback-error);
  background: var(--color-fill-error-subtle);
}

.ap-kanban__card-title {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  font-size: var(--font-size-13);
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.ap-kanban__overdue {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: var(--radius-2);
  background: var(--color-feedback-error);
  color: #fff;
  font-size: var(--font-size-11);
  line-height: 18px;
}

.ap-kanban__card-type {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-12);
  color: var(--color-action-primary);
}

.ap-kanban__card-target {
  margin-top: var(--spacing-2);
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
}

.ap-kanban__card-extra {
  margin-top: 2px;
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.ap-kanban__card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
  padding-top: var(--spacing-2);
  border-top: 1px solid var(--color-border-divider);
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.ap-kanban__empty {
  padding: var(--spacing-4);
  text-align: center;
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}
</style>
