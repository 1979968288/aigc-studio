<script setup lang="ts">
import { computed, inject } from 'vue';
import { demandOf } from '../api';
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
import { APPROVAL_TYPE_META } from '../constants';

defineOptions({ name: 'ApprovalDetailDrawer' });

const page = inject(approvalCenterPageKey)!;

const item = computed(() => page.detailApproval);
const demand = computed(() => (item.value ? demandOf(item.value) : null));
const pending = computed(() => item.value?.status === 'pending');

/** 审批类型胶囊色（accent → 文字色/填充色） */
const TYPE_PILL: Record<string, { color: string; bg: string }> = {
  blue: { color: 'var(--color-status-info)', bg: 'var(--color-fill-info-subtle)' },
  green: { color: 'var(--color-feedback-success)', bg: 'var(--color-fill-success-subtle)' },
  purple: { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)' },
};

const typePill = (type: string) => {
  const meta = APPROVAL_TYPE_META[type];
  return (meta && TYPE_PILL[meta.accent]) || { color: 'var(--color-text-secondary)', bg: 'var(--color-bg-hover)' };
};
</script>

<template>
  <a-drawer
    :open="page.drawerOpen"
    title="审批详情"
    width="min(100vw, 440px)"
    destroy-on-close
    @close="page.closeDetail"
  >
    <template v-if="item">
      <div class="ad-drawer__head">
        <div class="ad-drawer__head-row">
          <span
            class="ad-drawer__pill"
            :style="{ color: approvalStatusMeta(item.status).color, background: approvalStatusMeta(item.status).bg }"
          >
            {{ approvalStatusMeta(item.status).label }}
          </span>
          <span class="ad-drawer__pill" :style="{ color: typePill(item.type).color, background: typePill(item.type).bg }">
            {{ approvalTypeLabel(item.type) }}
          </span>
          <span v-if="approvalIsOverdue(item)" class="ad-drawer__overdue">已逾期</span>
        </div>
        <h3 class="ad-drawer__title">{{ item.title }}</h3>
      </div>

      <div class="ad-drawer__rows">
        <div class="ad-drawer__row">
          <span class="ad-drawer__label">所属项目</span>
          <span class="ad-drawer__value">{{ approvalProjectName(item.projectId) }}</span>
        </div>

        <div class="ad-drawer__row">
          <span class="ad-drawer__label">发起人</span>
          <span class="ad-drawer__value">{{ approvalStaffName(item.submitter) }}</span>
        </div>

        <div class="ad-drawer__row">
          <span class="ad-drawer__label">审批人</span>
          <span class="ad-drawer__value">
            {{ item.operatorId ? approvalStaffName(item.operatorId) : page.activeCategory.operatorLabel }}
          </span>
        </div>

        <div class="ad-drawer__row">
          <span class="ad-drawer__label">提交时间</span>
          <span class="ad-drawer__value">{{ item.submittedAt }}</span>
        </div>

        <div class="ad-drawer__row">
          <span class="ad-drawer__label">截止日期</span>
          <span class="ad-drawer__value">{{ item.dueAt }}</span>
        </div>
      </div>

      <div class="ad-drawer__section-title">审批对象</div>
      <div class="ad-drawer__target">
        <div class="ad-drawer__target-name">{{ approvalTargetText(item) }}</div>
        <div v-if="approvalTargetExtra(item)" class="ad-drawer__target-extra">
          {{ approvalTargetExtra(item) }}
        </div>
      </div>

      <div v-if="demand" class="ad-drawer__demand">
        <div class="ad-drawer__demand-row">
          <span class="ad-drawer__label">项目类型</span>
          <span class="ad-drawer__value">{{ demand.project_type }}</span>
        </div>
        <div class="ad-drawer__demand-row">
          <span class="ad-drawer__label">客户</span>
          <span class="ad-drawer__value">{{ demand.client_name }}</span>
        </div>
        <div class="ad-drawer__demand-row">
          <span class="ad-drawer__label">立项状态</span>
          <span class="ad-drawer__value">{{ demand.approved ? '已立项' : '待立项' }}</span>
        </div>
        <div v-if="demand.remark" class="ad-drawer__demand-row ad-drawer__demand-row--column">
          <span class="ad-drawer__label">需求备注</span>
          <span class="ad-drawer__value">{{ demand.remark }}</span>
        </div>
      </div>

      <div v-if="item.comment" class="ad-drawer__comment">
        <div class="ad-drawer__section-title">审批意见</div>
        <div class="ad-drawer__comment-text">{{ item.comment }}</div>
      </div>
    </template>

    <template #footer>
      <template v-if="item && pending">
        <a-button danger @click="page.openDecision(item, 'reject')">驳回</a-button>
        <a-button type="primary" @click="page.openDecision(item, 'approve')">通过</a-button>
      </template>
      <template v-else>
        <a-button @click="page.closeDetail">关闭</a-button>
      </template>
    </template>
  </a-drawer>
</template>

<style scoped>
/* 清爽精简风：无实线分隔，头部与内容之间用留白分区 */
:deep(.ant-drawer-header) {
  border-bottom: none;
  padding-bottom: var(--spacing-3);
}

:deep(.ant-drawer-footer) {
  border-top: none;
  padding-top: var(--spacing-3);
}

.ad-drawer__head {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-5);
}

.ad-drawer__head-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.ad-drawer__pill {
  display: inline-block;
  padding: 1px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-12);
  line-height: 20px;
}

.ad-drawer__overdue {
  padding: 0 6px;
  border-radius: var(--radius-2);
  background: var(--color-feedback-error);
  color: #fff;
  font-size: var(--font-size-11);
  line-height: 18px;
}

.ad-drawer__title {
  margin: 0;
  font-size: var(--font-size-16);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.4;
  word-break: break-word;
}

.ad-drawer__rows {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.ad-drawer__row,
.ad-drawer__demand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

.ad-drawer__demand-row--column {
  flex-direction: column;
  align-items: stretch;
  gap: var(--spacing-1);
}

.ad-drawer__label {
  flex-shrink: 0;
  font-size: var(--font-size-13);
  color: var(--color-text-tertiary);
}

.ad-drawer__value {
  min-width: 0;
  font-size: var(--font-size-13);
  color: var(--color-text-primary);
  text-align: right;
}

.ad-drawer__section-title {
  margin-bottom: var(--spacing-2);
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.ad-drawer__target {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
}

.ad-drawer__target-name {
  font-size: var(--font-size-13);
  font-weight: 500;
  color: var(--color-text-primary);
}

.ad-drawer__target-extra {
  margin-top: 4px;
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.ad-drawer__demand {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  margin-top: var(--spacing-3);
}

.ad-drawer__comment {
  margin-top: var(--spacing-4);
}

.ad-drawer__comment-text {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
  font-size: var(--font-size-13);
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>
