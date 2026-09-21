<script setup lang="ts">
import { inject, ref } from 'vue';
import { taskListPageKey } from '../injection';

defineOptions({ name: 'TaskReworkModal' });

const page = inject(taskListPageKey)!;

const reason = ref('');
const submitting = ref(false);

async function submit(): Promise<void> {
  if (!reason.value.trim()) return;
  submitting.value = true;
  try {
    await page.submitRework(reason.value.trim());
    reason.value = '';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <a-modal
    :open="page.reworkOpen"
    title="发起返工"
    ok-text="确认返工"
    cancel-text="取消"
    :confirm-loading="submitting"
    @ok="submit"
    @cancel="page.reworkOpen = false"
  >
    <template v-if="page.reworkTarget">
      <p class="tr-modal__task">{{ page.reworkTarget.name }}</p>
      <p class="tr-modal__hint">返工后任务将回到「待办」，并记录以下原因。</p>
      <a-textarea
        v-model:value="reason"
        :auto-size="{ minRows: 3, maxRows: 6 }"
        placeholder="填写返工原因（必填）"
      />
    </template>
  </a-modal>
</template>

<style scoped>
.tr-modal__task {
  margin: 0 0 var(--spacing-2);
  font-size: var(--font-size-14);
  font-weight: 600;
  color: var(--color-text-primary);
}

.tr-modal__hint {
  margin: 0 0 var(--spacing-3);
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}
</style>
