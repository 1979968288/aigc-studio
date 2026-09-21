<script setup lang="ts">
import { computed, inject } from 'vue';
import type { TableColumnsType } from 'ant-design-vue';
import type { DemoApproval } from '@/shared/mock/db';
import { APPROVAL_TYPE_META } from '../constants';
import { approvalCenterPageKey } from '../injection';
import {
  approvalCategoryOf,
  approvalIsOverdue,
  approvalProjectName,
  approvalStaffName,
  approvalStatusMeta,
  approvalTargetExtra,
  approvalTargetText,
  approvalTypeLabel,
} from '../useApprovalCenterPage';

defineOptions({ name: 'ApprovalTableView' });

const page = inject(approvalCenterPageKey)!;

const columns = computed<TableColumnsType>(() => [
  {
    title: '审批标题',
    key: 'title',
    minWidth: 260,
  },
  {
    title: '审批类型',
    key: 'type',
    width: 110,
  },
  {
    title: '所属项目',
    key: 'projectId',
    width: 160,
  },
  {
    title: '发起人',
    key: 'submitter',
    width: 100,
  },
  {
    title: '审批人',
    key: 'operator',
    width: 100,
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
  },
  {
    title: '提交时间',
    key: 'submittedAt',
    width: 160,
  },
  {
    title: '截止日期',
    key: 'dueAt',
    width: 110,
  },
]);
</script>

<template>
  <a-table
    :columns="columns"
    :data-source="page.approvals"
    :row-key="(record: DemoApproval) => record.id"
    :row-selection="{
      selectedRowKeys: page.selectedKeys,
      onChange: (keys: (string | number)[]) => (page.selectedKeys = keys.map(String)),
      getCheckboxProps: (record: DemoApproval) => ({ disabled: record.status !== 'pending' }),
    }"
    :pagination="{ pageSize: 20, showTotal: (total: number) => `共 ${total} 条` }"
    size="middle"
    :row-class-name="(record: Record<string, unknown>) =>
      approvalIsOverdue(record as unknown as DemoApproval) ? 'ap-table__row--overdue' : ''"
    @row-click="(record: Record<string, unknown>) => page.openDetail(record as unknown as DemoApproval)"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'title'">
        <a
          class="ap-table__title"
          @click="page.openDetail(record as unknown as DemoApproval)"
        >
          <span
            v-if="approvalIsOverdue(record as DemoApproval)"
            class="ap-table__overdue-tag"
            title="已逾期"
          >
            逾期
          </span>
          {{ record.title }}
        </a>
      </template>

      <template v-else-if="column.key === 'type'">
        {{ approvalTypeLabel(record.type) }}
      </template>

      <template v-else-if="column.key === 'projectId'">
        <span class="ap-table__muted">{{ approvalProjectName(record.projectId) }}</span>
      </template>

      <template v-else-if="column.key === 'submitter'">
        <span class="ap-table__muted">{{ approvalStaffName(record.submitter) }}</span>
      </template>

      <template v-else-if="column.key === 'operator'">
        <span class="ap-table__muted">
          {{ record.operatorId ? approvalStaffName(record.operatorId) : '—' }}
        </span>
      </template>

      <template v-else-if="column.key === 'status'">
        <span
          class="ap-table__status"
          :style="{ color: approvalStatusMeta(record.status).color, background: approvalStatusMeta(record.status).bg }"
        >
          {{ approvalStatusMeta(record.status).label }}
        </span>
      </template>

      <template v-else-if="column.key === 'submittedAt'">
        <span class="ap-table__muted">{{ record.submittedAt }}</span>
      </template>

      <template v-else-if="column.key === 'dueAt'">
        <span class="ap-table__muted">{{ record.dueAt }}</span>
      </template>
    </template>
  </a-table>
</template>

<style scoped>
.ap-table__row--overdue {
  background: var(--color-fill-error-subtle) !important;
}

.ap-table__title {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  font-weight: 500;
  min-width: 0;
  color: var(--color-text-primary);
  cursor: pointer;
}

.ap-table__title:hover {
  color: var(--color-action-primary);
}

.ap-table__overdue-tag {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: var(--radius-2);
  background: var(--color-feedback-error);
  color: #fff;
  font-size: var(--font-size-11);
  line-height: 18px;
}

.ap-table__muted {
  color: var(--color-text-secondary);
}

.ap-table__status {
  display: inline-block;
  padding: 1px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-12);
}
</style>
