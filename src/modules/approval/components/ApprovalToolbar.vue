<script setup lang="ts">
import { inject } from 'vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { APPROVAL_STATUS_TABS, APPROVAL_TYPE_OPTIONS } from '../constants';
import type { ApprovalStatusFilter, ApprovalView } from '../types';
import { approvalCenterPageKey } from '../injection';

defineOptions({ name: 'ApprovalToolbar' });

const page = inject(approvalCenterPageKey)!;
</script>

<template>
  <div class="ap-toolbar">
    <div class="ap-toolbar__top">
      <div class="ap-toolbar__tabs">
        <button
          v-for="tab in APPROVAL_STATUS_TABS"
          :key="tab.key"
          type="button"
          class="ap-toolbar__tab"
          :class="{ 'ap-toolbar__tab--active': page.statusFilter === tab.key }"
          @click="page.setStatusFilter(tab.key as ApprovalStatusFilter)"
        >
          {{ tab.label }}
          <span v-if="tab.key === 'pending'" class="ap-toolbar__tab-count">{{ page.pendingCount }}</span>
        </button>
      </div>

      <div class="ap-toolbar__right">
        <a-input
          :value="page.keyword"
          allow-clear
          placeholder="搜索标题、发起人、项目"
          class="ap-toolbar__search"
          @update:value="(value: string) => (page.keyword = value)"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>

        <a-select
          :value="page.typeFilter"
          :options="[{ value: 'all', label: '全部类型' }, ...APPROVAL_TYPE_OPTIONS]"
          class="ap-toolbar__filter"
          @change="(value: unknown) => (page.typeFilter = value as typeof page.typeFilter)"
        />

        <a-segmented
          :value="page.view"
          :options="[
            { value: 'table', label: '表格' },
            { value: 'kanban', label: '看板' },
          ]"
          @change="(value: unknown) => page.setView(value as ApprovalView)"
        />
      </div>
    </div>

    <div v-if="page.selectedApprovals.length > 0" class="ap-toolbar__batch">
      <span class="ap-toolbar__batch-text">已选 {{ page.selectedApprovals.length }} 条待处理审批</span>
      <div class="ap-toolbar__batch-actions">
        <a-button type="primary" size="small" @click="page.batchDecide('approve')">批量通过</a-button>
        <a-button danger size="small" @click="page.batchDecide('reject')">批量驳回</a-button>
        <a-button size="small" @click="page.selectedKeys = []">取消选择</a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ap-toolbar {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.ap-toolbar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.ap-toolbar__tabs {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.ap-toolbar__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: var(--font-size-13);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.ap-toolbar__tab--active {
  color: var(--color-action-primary);
  font-weight: 600;
  border-bottom-color: var(--color-action-primary);
}

.ap-toolbar__tab-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: var(--font-size-11);
  text-align: center;
}

.ap-toolbar__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-width: 0;
}

.ap-toolbar__search {
  width: 220px;
}

.ap-toolbar__filter {
  width: 128px;
}

.ap-toolbar__batch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border-info);
  border-radius: var(--radius-3);
  background: var(--color-fill-info-subtle);
}

.ap-toolbar__batch-text {
  font-size: var(--font-size-13);
  color: var(--color-text-secondary);
}

.ap-toolbar__batch-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
</style>
