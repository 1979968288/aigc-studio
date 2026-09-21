<script setup lang="ts">
import { inject, reactive, ref } from 'vue';
import type { DemoTask, DemoTaskLine, DemoTaskStatus } from '@/shared/mock/db';
import RefImageUploader from '@/shared/components/RefImageUploader.vue';
import { GEN_MODEL_GROUPS } from '@/shared/aigc/genConfig';
import { TASK_LINE_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../constants';
import { taskListPageKey } from '../injection';

defineOptions({ name: 'TaskCreateModal' });

const page = inject(taskListPageKey)!;

const genModelGroups = GEN_MODEL_GROUPS.map((group) => ({
  label: group.label,
  options: group.options.map((option) => ({ value: option.value, label: option.label })),
}));

const form = reactive({
  name: '',
  line: 'art' as DemoTaskLine,
  projectId: '',
  stageText: '',
  assignee: '',
  status: 'todo' as DemoTaskStatus,
  priority: 'medium' as DemoTask['priority'],
  dueDate: '',
  description: '',
  prompt: '',
  genModel: '',
  refImages: [] as string[],
});

const submitting = ref(false);

async function submit(): Promise<void> {
  if (!form.name.trim()) return;
  submitting.value = true;
  try {
    await page.handleCreate({
      name: form.name.trim(),
      line: form.line,
      projectId: form.projectId,
      stageText: form.stageText,
      assignee: form.assignee,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate,
      description: form.description.trim() || undefined,
      prompt: form.prompt.trim() || undefined,
      genModel: form.genModel || undefined,
      refImages: form.refImages.length ? [...form.refImages] : undefined,
    });
  } finally {
    submitting.value = false;
  }
}

function reset(): void {
  form.name = '';
  form.line = 'art';
  form.projectId = '';
  form.stageText = '';
  form.assignee = '';
  form.status = 'todo';
  form.priority = 'medium';
  form.dueDate = '';
  form.description = '';
  form.prompt = '';
  form.genModel = '';
  form.refImages = [];
}
</script>

<template>
  <a-modal
    :open="page.createOpen"
    title="新建任务"
    ok-text="创建"
    cancel-text="取消"
    :confirm-loading="submitting"
    @ok="submit"
    @cancel="page.createOpen = false"
    @after-close="reset"
  >
    <a-form layout="vertical" class="tc-form">
      <a-form-item label="任务名称" required>
        <a-input v-model:value="form.name" placeholder="输入任务名称" />
      </a-form-item>

      <div class="tc-form__row">
        <a-form-item label="生产线">
          <a-select v-model:value="form.line" :options="TASK_LINE_OPTIONS" />
        </a-form-item>

        <a-form-item label="项目" required>
          <a-select
            v-model:value="form.projectId"
            :options="page.projectOptions"
            placeholder="选择项目"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </div>

      <div class="tc-form__row">
        <a-form-item label="环节">
          <a-input v-model:value="form.stageText" placeholder="如：镜头 / 视频生成" />
        </a-form-item>

        <a-form-item label="负责人" required>
          <a-select
            v-model:value="form.assignee"
            :options="page.staffOptions"
            placeholder="选择负责人"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
      </div>

      <div class="tc-form__row">
        <a-form-item label="状态">
          <a-select v-model:value="form.status" :options="TASK_STATUS_OPTIONS" />
        </a-form-item>

        <a-form-item label="优先级">
          <a-select v-model:value="form.priority" :options="TASK_PRIORITY_OPTIONS" />
        </a-form-item>
      </div>

      <a-form-item label="截止日期">
        <a-input v-model:value="form.dueDate" placeholder="YYYY-MM-DD" />
      </a-form-item>

      <a-form-item label="描述">
        <a-textarea
          v-model:value="form.description"
          :auto-size="{ minRows: 2, maxRows: 5 }"
          placeholder="任务描述（可选）"
        />
      </a-form-item>

      <div class="tc-form__section">生成数据</div>

      <a-form-item label="提示词">
        <a-textarea
          v-model:value="form.prompt"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          placeholder="记录该镜头 / 图像的生成提示词，便于复现与追溯"
        />
      </a-form-item>

      <a-form-item label="所用模型">
        <a-select
          v-model:value="form.genModel"
          :options="genModelGroups"
          placeholder="选择生成模型"
          allow-clear
          show-search
          option-filter-prop="label"
        />
      </a-form-item>

      <a-form-item label="参考图">
        <RefImageUploader v-model="form.refImages" :max="3" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
.tc-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.tc-form__section {
  margin: var(--spacing-2) 0 var(--spacing-4);
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-secondary);
}
</style>
