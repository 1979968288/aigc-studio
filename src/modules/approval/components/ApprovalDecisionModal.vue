<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { approvalCenterPageKey } from '../injection';

defineOptions({ name: 'ApprovalDecisionModal' });

const page = inject(approvalCenterPageKey)!;

const comment = ref('');
const submitting = ref(false);

const isReject = computed(() => page.decisionAction === 'reject');

async function submit(): Promise<void> {
  if (isReject.value && !comment.value.trim()) return;
  submitting.value = true;
  try {
    await page.submitDecision(comment.value.trim() || undefined);
    comment.value = '';
  } finally {
    submitting.value = false;
  }
}

function reset(): void {
  comment.value = '';
}
</script>

<template>
  <a-modal
    :open="page.decisionOpen"
    :title="isReject ? '驳回审批' : '通过审批'"
    :ok-text="isReject ? '确认驳回' : '确认通过'"
    :ok-button-props="{ danger: isReject }"
    cancel-text="取消"
    :confirm-loading="submitting"
    @ok="submit"
    @cancel="page.decisionOpen = false"
    @after-close="reset"
  >
    <p v-if="page.detailApproval" class="ad-modal__task">{{ page.detailApproval.title }}</p>
    <p class="ad-modal__hint">
      {{ isReject ? '驳回后：候选定稿将回到待办并记录返工原因；资产锁定将保持审核中。' : '通过后：资产将发布入库，镜头候选将定稿完成。' }}
    </p>
    <a-textarea
      v-model:value="comment"
      :auto-size="{ minRows: 3, maxRows: 6 }"
      :placeholder="isReject ? '填写驳回意见（必填）' : '填写审批意见（选填）'"
    />
  </a-modal>
</template>

<style scoped>
.ad-modal__task {
  margin: 0 0 var(--spacing-2);
  font-size: var(--font-size-14);
  font-weight: 600;
  color: var(--color-text-primary);
}

.ad-modal__hint {
  margin: 0 0 var(--spacing-3);
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}
</style>
