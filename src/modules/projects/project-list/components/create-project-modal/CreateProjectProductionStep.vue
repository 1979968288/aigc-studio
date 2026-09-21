<script setup lang="ts">
import { computed } from 'vue';
import {
  AudioOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  MessageOutlined,
  UserOutlined,
  InfoCircleOutlined,
  AlertOutlined,
} from '@ant-design/icons-vue';
import { useCreateProjectModalContext } from '../../create-project-modal/useCreateProjectModal';
import type { CreateProjectFormData } from '../../create-project-modal/useCreateProjectModal';

defineOptions({ name: 'CreateProjectProductionStep' });

const {
  closeNoModelConfirm,
  fieldHelp,
  formData,
  handleGenModelChange,
  handleToggleCard,
  handleToggleSwitch,
  noModelConfirmCountdown,
  noModelConfirmVisible,
  optionGroups,
  toggleCards,
} = useCreateProjectModalContext();

const CARD_ICONS: Record<string, typeof MessageOutlined> = {
  hasLipSync: MessageOutlined,
  hasDigitalAssets: DatabaseOutlined,
  hasAiVoice: AudioOutlined,
  hasDigitalHuman: UserOutlined,
  hasStyleLora: ExperimentOutlined,
};

function getToggleEnabled(key: string): boolean {
  const card = toggleCards.find((item) => item.key === key);
  if (!card) return false;
  return formData[card.field as keyof CreateProjectFormData] === 1;
}

const genModelValue = computed(() => formData.genModel);
</script>

<template>
  <div class="step-content">
    <div class="step-base-grid">
      <div class="form-section production-requirement-section">
        <h3 class="form-section-title">制作需求配置</h3>

        <div class="production-requirement-grid">
          <div
            v-for="card in toggleCards"
            :key="card.key"
            :class="['production-requirement-card', { active: getToggleEnabled(card.key) }]"
            role="button"
            tabindex="0"
            :data-tone="card.tone"
            @click="handleToggleCard(card.key)"
            @keydown.enter.prevent="handleToggleCard(card.key)"
          >
            <div class="production-requirement-main">
              <span class="production-requirement-icon">
                <component :is="CARD_ICONS[card.key]" />
              </span>
              <span class="production-requirement-text">
                <span class="production-requirement-title">{{ card.label }}</span>
                <span class="production-requirement-desc">{{ card.description }}</span>
              </span>
              <span class="production-requirement-switch" @click.stop>
                <a-switch
                  :checked="getToggleEnabled(card.key)"
                  @change="handleToggleSwitch(card.key, $event)"
                />
              </span>
            </div>
          </div>
        </div>

        <div class="production-engine-panel">
          <span class="production-engine-icon"><AlertOutlined /></span>
          <a-form-item
            required
            class="production-engine-field"
            data-validation-field="genModel"
            :help="fieldHelp('genModel')"
          >
            <template #label>
              <span class="production-engine-label">
                主要生成模型
                <a-tooltip title="如选择未定，项目将不预设生成模型">
                  <InfoCircleOutlined class="production-engine-info" />
                </a-tooltip>
              </span>
            </template>
            <a-select
              :value="genModelValue || undefined"
              :options="[...optionGroups.genModelOptions]"
              placeholder="请选择主要生成模型"
              class="full-width"
              @change="handleGenModelChange"
            />
          </a-form-item>
        </div>
      </div>

      <div class="form-section">
        <h3 class="form-section-title">补充信息</h3>
        <a-form-item label="参考作品/竞品" class="step-textarea-item">
          <a-textarea
            v-model:value="formData.referenceWorks"
            :rows="3"
            :maxlength="512"
            show-count
            placeholder="请输入参考作品、竞品或链接"
          />
        </a-form-item>
      </div>
    </div>

    <div v-if="noModelConfirmVisible" class="no-engine-confirm-overlay">
      <div class="no-engine-confirm-dialog" role="dialog" aria-modal="true">
        <span class="no-engine-confirm-icon"><AlertOutlined /></span>
        <h3>确认选择未定模型?</h3>
        <p>
          您已选择主要生成模型为「未定」。这代表项目将不会预设生成模型，
          后续可在制作工坊中再行配置，请确认此项操作符合您的要求。
        </p>
        <button
          type="button"
          class="no-engine-confirm-button"
          :disabled="noModelConfirmCountdown > 0"
          @click="closeNoModelConfirm"
        >
          我知道了<span v-if="noModelConfirmCountdown > 0">
            ({{ noModelConfirmCountdown }}s)</span
          >
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-content {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.step-base-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.form-section-title {
  margin: 0;
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.production-requirement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--spacing-3);
}

.production-requirement-card {
  --card-tone: var(--color-action-primary);

  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.production-requirement-card[data-tone='purple'] {
  --card-tone: #8b5cf6;
}

.production-requirement-card[data-tone='blue'] {
  --card-tone: #0ea5e9;
}

.production-requirement-card[data-tone='green'] {
  --card-tone: #22c55e;
}

.production-requirement-card[data-tone='orange'] {
  --card-tone: #f97316;
}

.production-requirement-card[data-tone='cyan'] {
  --card-tone: #06b6d4;
}

.production-requirement-card:hover {
  border-color: var(--color-border-strong);
}

.production-requirement-card.active {
  border-color: var(--card-tone);
  box-shadow: 0 0 0 1px var(--card-tone);
  background: color-mix(in srgb, var(--card-tone) 4%, var(--component-card-background));
}

.production-requirement-main {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
}

.production-requirement-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-4);
  background: color-mix(in srgb, var(--card-tone) 12%, transparent);
  color: var(--card-tone);
  font-size: 17px;
}

.production-requirement-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.production-requirement-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.production-requirement-desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

.production-engine-panel {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: var(--spacing-4);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--color-bg-card-soft, var(--component-card-background));
}

.production-engine-icon {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-4);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: 17px;
}

.production-engine-field {
  flex: 1;
  min-width: 0;
}

.production-engine-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.production-engine-info {
  font-size: 12px;
  color: var(--color-text-quaternary, var(--color-text-tertiary));
  cursor: help;
}

.full-width {
  width: 100%;
}

.step-textarea-item {
  margin-bottom: 0;
}

/* 未定模型确认框（对齐 KK no-engine-confirm） */
.no-engine-confirm-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-bg-mask, #000) 45%, transparent);
  border-radius: var(--radius-4);
}

.no-engine-confirm-dialog {
  width: min(420px, 90%);
  padding: var(--spacing-5);
  border-radius: var(--radius-5);
  background: var(--component-modal-background, var(--component-card-background));
  box-shadow: var(--shadow-dialog, var(--shadow-card));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  text-align: center;
}

.no-engine-confirm-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-fill-warning-subtle);
  color: var(--color-feedback-warning);
  font-size: 20px;
}

.no-engine-confirm-dialog h3 {
  margin: 0;
  font-size: 15px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.no-engine-confirm-dialog p {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
  line-height: 1.6;
}

.no-engine-confirm-button {
  height: 32px;
  padding: 0 20px;
  border: 0;
  border-radius: var(--radius-3);
  background: var(--color-action-primary);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.no-engine-confirm-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
