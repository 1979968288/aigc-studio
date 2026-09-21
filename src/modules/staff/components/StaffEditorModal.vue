<script setup lang="ts">
import { STAFF_ROLE_OPTIONS, STAFF_COLOR_PALETTE } from '../constants';
import type { StaffEditorModel } from '../types';
import { DEPARTMENTS } from '@/constants/roles';

defineProps<{
  open: boolean;
  model: StaffEditorModel;
  editing: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'save'): void;
  (e: 'cancel'): void;
}>();
</script>

<template>
  <a-modal
    :open="open"
    :title="editing ? '编辑人员' : '新增人员'"
    ok-text="保存"
    cancel-text="取消"
    width="520px"
    @ok="emit('save')"
    @cancel="emit('cancel')"
  >
    <a-form layout="vertical">
      <a-form-item label="姓名" required>
        <a-input v-model:value="model.name" placeholder="请输入姓名" :maxlength="20" />
      </a-form-item>
      <div class="se-form-grid">
        <a-form-item label="角色">
          <a-select v-model:value="model.role" :options="STAFF_ROLE_OPTIONS" />
        </a-form-item>
        <a-form-item label="部门">
          <a-select
            v-model:value="model.department"
            :options="DEPARTMENTS.map((dept) => ({ label: dept, value: dept }))"
          />
        </a-form-item>
      </div>
      <a-form-item label="在职状态">
        <a-radio-group v-model:value="model.employmentStatus">
          <a-radio value="active">在职</a-radio>
          <a-radio value="inactive">离职</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="人员介绍">
        <a-textarea v-model:value="model.description" :rows="2" placeholder="如：项目与成本总览，进度与风险把控" />
      </a-form-item>
      <a-form-item label="头像颜色">
        <div class="se-color-row">
          <button
            v-for="color in STAFF_COLOR_PALETTE"
            :key="color"
            type="button"
            class="se-color-swatch"
            :class="{ 'se-color-swatch--active': model.color === color }"
            :style="{ background: color }"
            @click="model.color = color"
          />
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
.se-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 var(--spacing-4);
}

.se-color-row {
  display: flex;
  gap: var(--spacing-2);
}

.se-color-swatch {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-full);
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.se-color-swatch:hover {
  transform: scale(1.1);
}

.se-color-swatch--active {
  border-color: var(--color-text-primary);
  box-shadow: 0 0 0 2px var(--color-bg-card), 0 0 0 4px var(--color-text-primary);
}
</style>
