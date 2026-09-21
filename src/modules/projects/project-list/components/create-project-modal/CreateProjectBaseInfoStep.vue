<script setup lang="ts">
import { UserOutlined } from '@ant-design/icons-vue';
import { useCreateProjectModalContext } from '../../create-project-modal/useCreateProjectModal';

defineOptions({ name: 'CreateProjectBaseInfoStep' });

const {
  clearFieldError,
  currentUser,
  fieldHelp,
  formData,
  handleInitiatorChange,
  optionGroups,
  userOptions,
} = useCreateProjectModalContext();

function onInitiatorChange(value: unknown) {
  const id = Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
  handleInitiatorChange(id);
}
</script>
<template>
  <div class="step-content">
    <div class="step-base-grid">
      <div class="form-section">
        <h3 class="form-section-title">核心信息</h3>
        <div class="step3-top-row">
          <a-form-item label="项目名称" required class="step3-field">
            <a-input
              v-model:value="formData.name"
              placeholder="从第一步项目标题同步"
              :maxlength="100"
              disabled
            />
          </a-form-item>
          <a-form-item label="项目代号" class="step3-field">
            <a-input
              v-model:value="formData.projectAlias"
              placeholder="请输入项目代号"
              :maxlength="64"
            />
          </a-form-item>
          <a-form-item label="项目级别" class="step3-field">
            <a-select
              v-model:value="formData.projectLevel"
              :options="[...optionGroups.projectLevelOptions]"
              placeholder="选择项目级别"
              class="full-width"
            />
          </a-form-item>
        </div>

        <div class="step3-top-row">
          <a-form-item label="业务类型" required class="step3-field">
            <a-radio-group
              v-model:value="formData.businessType"
              :options="[...optionGroups.businessTypeOptions]"
            />
          </a-form-item>
          <a-form-item label="产品名称" class="step3-field">
            <a-input
              v-model:value="formData.productName"
              placeholder="请输入产品名称"
              :maxlength="128"
            />
          </a-form-item>
        </div>
      </div>

      <div class="form-section">
        <h3 class="form-section-title">人员架构</h3>
        <div class="step3-top-row">
          <div class="step3-field" data-validation-field="initiatorId">
            <label class="field-label">项目立项人 <span class="required-star">*</span></label>
            <a-select
              :value="formData.initiatorId || undefined"
              :options="userOptions"
              class="full-width"
              placeholder="请选择项目立项人"
              @change="onInitiatorChange"
            />
            <p v-if="fieldHelp('initiatorId')" class="form-help">
              {{ fieldHelp('initiatorId') }}
            </p>
          </div>
          <a-form-item label="立项人岗位" class="step3-field">
            <a-input
              v-model:value="formData.initiatorPosition"
              placeholder="自动带出"
              :maxlength="64"
              disabled
            />
          </a-form-item>
          <a-form-item label="立项人所在部门" class="step3-field">
            <a-input
              v-model:value="formData.department"
              placeholder="自动带出"
              :maxlength="64"
              disabled
            />
          </a-form-item>
        </div>

        <div class="step3-top-row">
          <a-form-item label="创建人" class="step3-field">
            <div class="creator-readonly-field">
              <span class="creator-readonly-avatar">
                <UserOutlined />
              </span>
              <span class="creator-readonly-name" :title="currentUser.name">
                {{ currentUser.name }}
              </span>
            </div>
          </a-form-item>
          <a-form-item label="负责人" class="step3-field">
            <a-select
              v-model:value="formData.pmId"
              :options="userOptions"
              class="full-width"
              placeholder="请选择负责人"
            />
          </a-form-item>
          <a-form-item label="项目导演" class="step3-field">
            <a-select
              v-model:value="formData.directorId"
              :options="userOptions"
              mode="multiple"
              allow-clear
              class="full-width"
              placeholder="请选择项目导演"
            />
          </a-form-item>
        </div>

        <div class="step3-top-row">
          <a-form-item label="项目制片" class="step3-field">
            <a-select
              v-model:value="formData.producerId"
              :options="userOptions"
              mode="multiple"
              allow-clear
              class="full-width"
              placeholder="请选择项目制片"
            />
          </a-form-item>
        </div>
      </div>

      <div class="form-section">
        <h3 class="form-section-title">周期排期</h3>
        <div class="step3-top-row">
          <div class="step3-field" data-validation-field="applicationDate">
            <label class="field-label">申请日期 <span class="required-star">*</span></label>
            <a-date-picker
              v-model:value="formData.applicationDate"
              value-format="YYYY-MM-DD"
              placeholder="请选择申请日期"
              class="full-width"
              @change="clearFieldError('applicationDate')"
            />
            <p v-if="fieldHelp('applicationDate')" class="form-help">
              {{ fieldHelp('applicationDate') }}
            </p>
          </div>
          <a-form-item label="立项日期" class="step3-field">
            <a-date-picker
              v-model:value="formData.approvalDate"
              value-format="YYYY-MM-DD"
              placeholder="请选择立项日期"
              class="full-width"
            />
          </a-form-item>
          <div class="step3-field" data-validation-field="plannedDeliveryDate">
            <label class="field-label">计划交付日期 <span class="required-star">*</span></label>
            <a-date-picker
              v-model:value="formData.plannedDeliveryDate"
              value-format="YYYY-MM-DD"
              placeholder="请选择计划交付日期"
              class="full-width"
              @change="clearFieldError('plannedDeliveryDate')"
            />
            <p v-if="fieldHelp('plannedDeliveryDate')" class="form-help">
              {{ fieldHelp('plannedDeliveryDate') }}
            </p>
          </div>
        </div>

        <div class="step3-top-row">
          <a-form-item label="制作开始时间" class="step3-field">
            <a-date-picker
              v-model:value="formData.productionStart"
              value-format="YYYY-MM-DD"
              placeholder="请选择制作开始时间"
              class="full-width"
            />
          </a-form-item>
          <a-form-item label="制作结束时间" class="step3-field">
            <a-date-picker
              v-model:value="formData.productionEnd"
              value-format="YYYY-MM-DD"
              placeholder="请选择制作结束时间"
              class="full-width"
            />
          </a-form-item>
        </div>
      </div>

      <div class="form-section">
        <h3 class="form-section-title">规格参数</h3>
        <div class="step3-top-row">
          <a-form-item label="预计片长（分钟）" class="step3-field">
            <a-input-number
              :value="formData.durationMinutes ?? undefined"
              placeholder="请输入片长"
              :min="0"
              :controls="false"
              class="full-width"
              @change="
                (value: unknown) =>
                  (formData.durationMinutes =
                    value == null || value === '' ? null : Number(value))
              "
            />
          </a-form-item>
          <a-form-item label="语言" class="step3-field">
            <a-select
              v-model:value="formData.languages"
              mode="multiple"
              :options="[...optionGroups.languageOptions]"
              placeholder="选择语言"
              class="full-width"
            />
          </a-form-item>
          <a-form-item label="分辨率" class="step3-field">
            <a-select
              v-model:value="formData.resolution"
              :options="[...optionGroups.resolutionOptions]"
              placeholder="选择分辨率"
              class="full-width"
            />
          </a-form-item>
        </div>

        <div class="step3-top-row">
          <a-form-item label="帧率" class="step3-field">
            <a-select
              v-model:value="formData.frameRate"
              :options="[...optionGroups.frameRateOptions]"
              placeholder="选择帧率"
              class="full-width"
            />
          </a-form-item>
          <a-form-item label="预算（万元）" class="step3-field">
            <a-input-number
              :value="formData.budget ?? undefined"
              placeholder="请输入预算"
              :min="0"
              :controls="false"
              class="full-width"
              @change="
                (value: unknown) =>
                  (formData.budget = value == null || value === '' ? null : Number(value))
              "
            />
          </a-form-item>
          <div class="step3-field" data-validation-field="testLabel">
            <label class="field-label">测试标签 <span class="required-star">*</span></label>
            <a-radio-group
              v-model:value="formData.testLabel"
              :options="[...optionGroups.testLabelOptions]"
              class="test-label-radio-group"
              @change="clearFieldError('testLabel')"
            />
            <p v-if="fieldHelp('testLabel')" class="form-help">{{ fieldHelp('testLabel') }}</p>
          </div>
        </div>

        <a-form-item label="项目情况 / 备注" class="step-textarea-item">
          <a-textarea
            v-model:value="formData.description"
            placeholder="请输入项目情况或备注"
            :rows="4"
            :maxlength="1024"
            show-count
          />
        </a-form-item>
      </div>
    </div>
  </div>
</template>

<style scoped>
.step-content {
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

.step3-top-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-4);
}

.step3-field {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  display: block;
}

.required-star {
  color: var(--color-feedback-error);
  margin-left: 2px;
}

.form-help {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-feedback-error);
}

.full-width {
  width: 100%;
}

.creator-readonly-field {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
}

.creator-readonly-avatar {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-size: 12px;
  flex-shrink: 0;
}

.creator-readonly-name {
  font-size: 13px;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-textarea-item {
  margin-bottom: 0;
}

.test-label-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-3);
  min-height: 32px;
  align-items: center;
}

@media (width <= 960px) {
  .step3-top-row {
    grid-template-columns: 1fr;
  }
}
</style>
