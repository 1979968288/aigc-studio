<script setup lang="ts">
import {
  CheckSquareOutlined,
  AppstoreOutlined,
  RightOutlined,
} from '@ant-design/icons-vue';
import type { DashboardApprovalItem, DashboardApprovalSummary } from '../types';
import { resolveStaffName } from '@/modules/staff/api';

defineProps<{
  loading: boolean;
  items: DashboardApprovalItem[];
  summaries: DashboardApprovalSummary[];
}>();

const emit = defineEmits<{
  (event: 'go-to', route: string): void;
}>();
</script>

<script lang="ts">
export default { name: 'DashboardApprovalCard' };
</script>

<template>
  <a-spin :spinning="loading" wrapper-class-name="db1-spin">
    <div class="db1-approval">
      <div class="db1-approval-summary">
        <button
          v-for="summary in summaries"
          :key="summary.key"
          type="button"
          class="db1-approval-summary__item"
          :class="`db1-approval-summary__item--${summary.accent}`"
          @click.stop="emit('go-to', '/approvals')"
        >
          <span
            class="db1-approval-summary__icon"
            :class="`db1-approval-summary__icon--${summary.accent}`"
          >
            <CheckSquareOutlined v-if="summary.icon === 'task'" />
            <AppstoreOutlined v-else />
          </span>
          <span class="db1-approval-summary__content">
            <span class="db1-approval-summary__label">{{ summary.label }}</span>
            <span class="db1-approval-summary__count">
              <strong>{{ summary.count }}</strong>
              <span>个待审</span>
            </span>
          </span>
        </button>
      </div>

      <div class="db1-approval__section">
        <div class="db1-approval__section-header">
          <span class="db1-approval__section-title">待处理任务明细</span>
          <button
            type="button"
            class="db1-approval__link"
            aria-label="查看待处理审核明细"
            @click.stop="emit('go-to', '/approvals')"
          >
            <RightOutlined />
          </button>
        </div>

        <div class="db1-approval-list">
          <button
            v-for="item in items"
            :key="item.id"
            type="button"
            class="db1-approval-item"
            :class="`db1-approval-item--${item.icon}`"
            @click.stop="emit('go-to', `/approvals?openId=${item.id}`)"
          >
            <span class="db1-approval-item__icon">
              <CheckSquareOutlined v-if="item.icon === 'task'" />
              <AppstoreOutlined v-else />
            </span>
            <span class="db1-approval-item__content">
              <span class="db1-approval-item__title" :title="item.title">{{ item.title }}</span>
              <span class="db1-approval-item__meta">
                <span>{{ resolveStaffName(item.submitter) }}</span>
                <span class="db1-approval-item__dot">·</span>
                {{ item.dueAt }}
              </span>
            </span>
            <span
              class="db1-approval-item__priority"
              :class="{ 'db1-approval-item__priority--urgent': item.priority === 'urgent' }"
            >
              {{ item.priorityLabel }}
            </span>
            <RightOutlined class="db1-approval-item__arrow" />
          </button>
        </div>
      </div>
    </div>
  </a-spin>
</template>
