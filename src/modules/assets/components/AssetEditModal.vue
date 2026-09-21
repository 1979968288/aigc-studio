<script setup lang="ts">
import { useAssetListPageContext } from '../useAssetListPage';
import {
  ASSET_TYPES,
  ASSET_STATUS_FORM_OPTIONS,
  ASSET_FORMAT_OPTIONS,
  QUALITY_CHECK_OPTIONS,
} from '../constants';

defineOptions({ name: 'AssetEditModal' });

const page = useAssetListPageContext();
const { modalModel, modalVisible, modalMode, closeModal, submitModal, sceneOptions } = page;

const typeOptions = ASSET_TYPES.map((type) => ({ label: type, value: type }));
</script>

<template>
  <a-modal
    :open="modalVisible"
    :title="modalMode === 'create' ? '新建资产' : '编辑资产'"
    :width="560"
    ok-text="保存"
    cancel-text="取消"
    @ok="submitModal"
    @cancel="closeModal"
  >
    <div class="al-form">
      <div class="al-form__row al-form__row--full">
        <label class="al-form__label">资产名称 <span class="al-form__required">*</span></label>
        <a-input v-model:value="modalModel.name" placeholder="请输入资产名称" />
      </div>

      <div class="al-form__grid">
        <div class="al-form__row">
          <label class="al-form__label">资产类型</label>
          <a-select v-model:value="modalModel.assetType" :options="typeOptions" />
        </div>
        <div class="al-form__row">
          <label class="al-form__label">状态</label>
          <a-select v-model:value="modalModel.status" :options="ASSET_STATUS_FORM_OPTIONS" />
        </div>
        <div class="al-form__row">
          <label class="al-form__label">当前版本</label>
          <a-input v-model:value="modalModel.version" placeholder="如 v1.0" />
        </div>
        <div class="al-form__row">
          <label class="al-form__label">制作</label>
          <a-input v-model:value="modalModel.artist" placeholder="制作人员" />
        </div>
        <div class="al-form__row">
          <label class="al-form__label">文件大小</label>
          <a-input v-model:value="modalModel.size" placeholder="如 128MB" />
        </div>
        <div class="al-form__row">
          <label class="al-form__label">文件格式</label>
          <a-select v-model:value="modalModel.format" :options="ASSET_FORMAT_OPTIONS" />
        </div>
        <div class="al-form__row">
          <label class="al-form__label">质检状态</label>
          <a-select v-model:value="modalModel.qualityCheck" :options="QUALITY_CHECK_OPTIONS" />
        </div>
      </div>

      <div class="al-form__row al-form__row--full">
        <label class="al-form__label">引用场次</label>
        <a-select
          v-model:value="modalModel.usedInScenes"
          mode="multiple"
          allow-clear
          :options="sceneOptions"
          placeholder="选择关联的场次"
        />
      </div>
    </div>
  </a-modal>
</template>

<style scoped>
.al-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.al-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4) var(--spacing-4);
}

.al-form__row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.al-form__label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-13);
}

.al-form__required {
  color: var(--color-feedback-error);
}
</style>