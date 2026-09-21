<script setup lang="ts">
import { computed } from 'vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { useStaffManagementPage } from '../useStaffManagementPage';
import { STAFF_EMPLOYMENT_META, STAFF_ROLE_OPTIONS } from '../constants';
import { countStaffRefs } from '../api';
import StaffEditorModal from './StaffEditorModal.vue';
import type { StaffItem } from '../types';

const ctx = useStaffManagementPage();

const columns: TableColumnsType<StaffItem> = [
  { title: '人员', key: 'user', width: 260 },
  { title: '角色', key: 'role', width: 140 },
  { title: '部门', key: 'department', width: 120 },
  { title: '状态', key: 'employmentStatus', width: 90 },
  { title: '操作', key: 'action', width: 220 },
];

const deptCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = { all: ctx.list.value.length };
  for (const user of ctx.list.value) {
    counts[user.department] = (counts[user.department] ?? 0) + 1;
  }
  return counts;
});

const filteredList = computed(() => {
  const kw = ctx.keyword.value.trim().toLowerCase();
  if (!kw) return ctx.list.value;
  return ctx.list.value.filter(
    (user) =>
      user.name.toLowerCase().includes(kw) ||
      user.roleLabel.toLowerCase().includes(kw) ||
      user.department.toLowerCase().includes(kw)
  );
});

function openEdit(item: StaffItem): void {
  ctx.openEdit(item);
}

function toggleEmployment(item: StaffItem): void {
  void ctx.handleToggleEmployment(item);
}

/** 删除确认：带关联数据统计的删除保护 */
function confirmDelete(item: StaffItem): void {
  const refs = countStaffRefs(item.id);
  const detail = [
    refs.tasks > 0 ? `${refs.tasks} 个任务` : '',
    refs.assets > 0 ? `${refs.assets} 个资产` : '',
    refs.scenes > 0 ? `${refs.scenes} 个场次` : '',
    refs.projects > 0 ? `${refs.projects} 个项目` : '',
    refs.approvals > 0 ? `${refs.approvals} 条审批` : '',
  ]
    .filter(Boolean)
    .join('、');
  const hasRefs = detail.length > 0;
  Modal.confirm({
    title: `确认删除「${item.name}」？`,
    content: hasRefs
      ? `该人员关联 ${detail}，删除后相关记录将显示为人员 ID。建议改为标记离职以保留历史。`
      : '删除后不可恢复。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => ctx.handleDelete(item),
  });
}
</script>

<template>
  <div class="staff-page">
    <!-- 顶部统计 -->
    <div class="staff-page__stats">
      <div class="staff-stat">
        <div class="staff-stat__value">{{ ctx.stats.value.total }}</div>
        <div class="staff-stat__label">人员总数</div>
      </div>
      <div class="staff-stat">
        <div class="staff-stat__value staff-stat__value--active">{{ ctx.stats.value.active }}</div>
        <div class="staff-stat__label">在职</div>
      </div>
      <div class="staff-stat">
        <div class="staff-stat__value staff-stat__value--inactive">{{ ctx.stats.value.inactive }}</div>
        <div class="staff-stat__label">离职</div>
      </div>
    </div>

    <div class="staff-page__body">
      <!-- 左：部门树 -->
      <aside class="staff-dept">
        <div class="staff-dept__title">部门组织</div>
        <div class="staff-dept__list">
          <button
            v-for="node in ctx.deptTree"
            :key="node.key"
            type="button"
            class="staff-dept__item"
            :class="{ 'staff-dept__item--active': ctx.selectedDeptKey.value === node.key }"
            @click="ctx.handleDeptChange(node.key)"
          >
            <span class="staff-dept__name">{{ node.name }}</span>
            <span class="staff-dept__count">{{ deptCounts[node.key] ?? 0 }}</span>
          </button>
        </div>
      </aside>

      <!-- 右：人员列表 -->
      <section class="staff-main">
        <div class="staff-toolbar">
          <a-input-search
            :model-value="ctx.keyword.value"
            placeholder="搜索姓名 / 角色 / 部门"
            allow-clear
            class="staff-toolbar__search"
            @search="ctx.handleSearch"
            @change="(e: Event) => ctx.handleSearch((e.target as HTMLInputElement).value)"
          />
          <a-select
            :model-value="ctx.employmentFilter.value"
            class="staff-toolbar__filter"
            placeholder="在职状态"
            :options="[
              { label: '全部状态', value: 'all' },
              { label: '在职', value: 'active' },
              { label: '离职', value: 'inactive' },
            ]"
            @change="ctx.handleEmploymentChange"
          />
          <a-select
            :model-value="ctx.roleFilter.value"
            class="staff-toolbar__filter"
            placeholder="角色"
            :options="[{ label: '全部角色', value: '' }, ...STAFF_ROLE_OPTIONS]"
            @change="ctx.handleRoleChange"
          />
          <a-button @click="ctx.handleReset">重置</a-button>
          <div class="staff-toolbar__spacer" />
          <a-button type="primary" @click="ctx.openCreate">
            <template #icon><PlusOutlined /></template>
            新增人员
          </a-button>
        </div>

        <div class="staff-table-wrap">
          <a-table
            :data-source="filteredList"
            :columns="columns"
            :loading="ctx.loading.value"
            :pagination="{ pageSize: 10, showSizeChanger: false, showTotal: (t: number) => `共 ${t} 人` }"
            row-key="id"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'user'">
                <div class="staff-user">
                  <span class="staff-user__avatar" :style="{ background: record.color }">
                    {{ record.name.charAt(0) }}
                  </span>
                  <div class="staff-user__meta">
                    <span class="staff-user__name">{{ record.name }}</span>
                    <span class="staff-user__desc">{{ record.description }}</span>
                  </div>
                </div>
              </template>
              <template v-else-if="column.key === 'role'">
                <a-tag class="staff-role-tag">{{ record.roleLabel }}</a-tag>
              </template>
              <template v-else-if="column.key === 'department'">
                {{ record.department }}
              </template>
              <template v-else-if="column.key === 'employmentStatus'">
                <span class="staff-status" :style="{ color: STAFF_EMPLOYMENT_META[record.employmentStatus as 'active' | 'inactive'].color }">
                  <span class="staff-status__dot" :style="{ background: STAFF_EMPLOYMENT_META[record.employmentStatus as 'active' | 'inactive'].color }" />
                  {{ STAFF_EMPLOYMENT_META[record.employmentStatus as 'active' | 'inactive'].label }}
                </span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-space :size="4">
                  <a-button type="link" size="small" @click="openEdit(record as StaffItem)">编辑</a-button>
                  <a-button type="link" size="small" @click="toggleEmployment(record as StaffItem)">
                    {{ record.employmentStatus === 'active' ? '离职' : '恢复在职' }}
                  </a-button>
                  <a-button type="link" size="small" danger @click="confirmDelete(record as StaffItem)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
      </section>
    </div>

    <StaffEditorModal
      :open="ctx.editorOpen.value"
      @update:open="(v: boolean) => (ctx.editorOpen.value = v)"
      :model="ctx.editorModel.value"
      :editing="Boolean(ctx.editingItem.value)"
      @save="ctx.handleEditorSave"
      @cancel="ctx.closeEditor"
    />
  </div>
</template>

<style scoped>
.staff-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-5);
  height: 100%;
  min-height: 0;
}

.staff-page__stats {
  display: flex;
  gap: var(--spacing-4);
  flex-shrink: 0;
}

.staff-stat {
  flex: 1;
  max-width: 200px;
  padding: var(--spacing-4);
  border-radius: var(--radius-3);
  border: 1px solid var(--color-border-default);
  background: var(--component-card-background);
}

.staff-stat__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 32px;
}

.staff-stat__value--active {
  color: var(--color-feedback-success);
}

.staff-stat__value--inactive {
  color: var(--color-text-tertiary);
}

.staff-stat__label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.staff-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: var(--spacing-4);
}

.staff-dept {
  width: 200px;
  flex-shrink: 0;
  border-radius: var(--radius-3);
  border: 1px solid var(--color-border-default);
  background: var(--component-card-background);
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.staff-dept__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  padding: var(--spacing-2) var(--spacing-2) var(--spacing-1);
}

.staff-dept__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden auto;
}

.staff-dept__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: 7px 10px;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.staff-dept__item:hover {
  background: var(--color-bg-hover);
}

.staff-dept__item--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 500;
}

.staff-dept__count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.staff-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.staff-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

.staff-toolbar__search {
  width: 260px;
}

.staff-toolbar__filter {
  width: 130px;
}

.staff-toolbar__spacer {
  flex: 1;
}

.staff-table-wrap {
  flex: 1;
  min-height: 0;
  border-radius: var(--radius-3);
  border: 1px solid var(--color-border-default);
  background: var(--component-card-background);
  overflow: hidden;
}

.staff-user {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.staff-user__avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

.staff-user__meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.staff-user__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.staff-user__desc {
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.staff-role-tag {
  border-radius: var(--radius-2);
}

.staff-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.staff-status__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
}
</style>
