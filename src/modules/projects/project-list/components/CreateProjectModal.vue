<script setup lang="ts">
import { toRef } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import {
  provideCreateProjectModal,
  useCreateProjectModalController,
} from '../create-project-modal/useCreateProjectModal';
import CreateProjectTemplateStep from './create-project-modal/CreateProjectTemplateStep.vue';
import CreateProjectSegmentStep from './create-project-modal/CreateProjectSegmentStep.vue';
import CreateProjectBaseInfoStep from './create-project-modal/CreateProjectBaseInfoStep.vue';
import CreateProjectProductionStep from './create-project-modal/CreateProjectProductionStep.vue';

defineOptions({ name: 'CreateProjectModal' });

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void;
  (event: 'created'): void;
}>();

const context = useCreateProjectModalController(
  { open: toRef(() => props.open) },
  emit
);

provideCreateProjectModal(context);

const {
  currentStep,
  handleClose,
  submitting,
  submitButtonDisabled,
  isFirstStep,
  isLastStep,
  handlePrevious,
  handleNext,
  steps,
  totalSteps,
} = context;
</script>

<template>
  <a-modal
    :open="open"
    :footer="null"
    centered
    width="min(860px, calc(100vw - 48px))"
    class="create-project-modal"
    wrap-class-name="create-project-modal-wrap"
    @cancel="handleClose"
  >
    <template #title>
      <div class="modal-titlebar">
        <div class="header-icon" aria-hidden="true"><PlusOutlined /></div>
        <div>
          <h2 class="modal-title">创建新项目</h2>
          <p class="header-step-hint">
            Step {{ currentStep }} of {{ totalSteps }} · {{ steps[currentStep - 1]?.subtitle }}
          </p>
        </div>
      </div>
    </template>

    <div class="modal-shell">
      <div class="steps-container">
        <a-steps :current="currentStep - 1" size="small" responsive>
          <a-step v-for="step in steps" :key="step.key" :title="step.title" />
        </a-steps>
      </div>

      <a-form layout="vertical" class="modal-form">
        <CreateProjectTemplateStep v-if="currentStep === 1" />
        <CreateProjectSegmentStep v-else-if="currentStep === 2" />
        <CreateProjectBaseInfoStep v-else-if="currentStep === 3" />
        <CreateProjectProductionStep v-else />
      </a-form>

      <div class="modal-footer">
        <div class="footer-left">
          <a-button v-if="!isFirstStep" @click="handlePrevious">上一步</a-button>
        </div>
        <div class="footer-right">
          <a-button
            type="primary"
            :disabled="submitButtonDisabled"
            :loading="submitting"
            @click="handleNext"
          >
            {{ isLastStep ? '确定' : '下一步' }}
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.modal-titlebar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-4);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: 18px;
  flex-shrink: 0;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-step-hint {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.modal-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(76vh - 120px);
}

.steps-container {
  padding: 4px 0 8px;
  border-bottom: 1px solid var(--color-border-divider);
}

.modal-form {
  flex: 1;
  min-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-divider);
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
