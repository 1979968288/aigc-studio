<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { message } from 'ant-design-vue';
import { ROLE_DEFINITIONS, type DemoUser, type RoleCode } from '@/constants/roles';
import { findStaffByRef, readStaffList } from '@/modules/staff/api';
import type { DemoProjectMember } from '@/shared/mock/db';
import MemberChipGrid from '../../shared/components/MemberChipGrid.vue';
import type { ProjectSummary } from '../types';

defineOptions({ name: 'ProjectMemberDialog' });

const props = defineProps<{
  open: boolean;
  project: ProjectSummary;
}>();

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void;
  (event: 'save', patch: Record<string, unknown>): void;
}>();

/** 已选成员：userId → 项目角色（勾选顺序保持） */
const selection = ref<Map<string, RoleCode>>(new Map());
const activeRole = ref<RoleCode>(ROLE_DEFINITIONS[0].code);
const keyword = ref('');

const roleNav = computed(() =>
  ROLE_DEFINITIONS.map((role) => ({
    ...role,
    count: Array.from(selection.value.values()).filter((code) => code === role.code).length,
  }))
);

/** 候选人（在职 + 关键词过滤） */
const candidates = computed<DemoUser[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  return readStaffList().filter((user) => {
    if (user.employmentStatus !== 'active') return false;
    if (user.role !== activeRole.value) return false;
    if (!kw) return true;
    return (
      user.name.toLowerCase().includes(kw) ||
      user.department.toLowerCase().includes(kw) ||
      user.roleLabel.toLowerCase().includes(kw)
    );
  });
});

const selectedIds = computed(() => Array.from(selection.value.keys()));

const activeRoleLabel = computed(
  () => ROLE_DEFINITIONS.find((role) => role.code === activeRole.value)?.label ?? ''
);

const ownerUser = computed(() => findStaffByRef(props.project.owner));

const isAllSelected = computed(
  () =>
    candidates.value.length > 0 &&
    candidates.value.every((user) => selection.value.has(user.id))
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const next = new Map<string, RoleCode>();
    props.project.members.forEach((member) => next.set(member.userId, member.projectRole));
    selection.value = next;
    activeRole.value = ROLE_DEFINITIONS[0].code;
    keyword.value = '';
  },
  { immediate: true }
);

function toggle(userId: string): void {
  const next = new Map(selection.value);
  if (next.has(userId)) next.delete(userId);
  else next.set(userId, activeRole.value);
  selection.value = next;
}

function toggleAll(): void {
  const next = new Map(selection.value);
  if (isAllSelected.value) {
    candidates.value.forEach((user) => next.delete(user.id));
  } else {
    candidates.value.forEach((user) => {
      if (!next.has(user.id)) next.set(user.id, activeRole.value);
    });
  }
  selection.value = next;
}

function submit(): void {
  if (!selection.value.has(props.project.owner)) {
    message.warning('项目负责人不能移出成员');
    return;
  }
  const joinDate = new Date().toISOString().slice(0, 10);
  const members: DemoProjectMember[] = [];
  for (const [userId, projectRole] of selection.value) {
    const user = findStaffByRef(userId);
    if (!user || user.employmentStatus !== 'active') continue;
    const existing = props.project.members.find((member) => member.userId === userId);
    members.push({ userId, projectRole, joinedAt: existing?.joinedAt ?? joinDate });
  }
  emit('save', { members });
  emit('update:open', false);
}
</script>

<template>
  <a-modal
    :open="open"
    title="编辑项目成员"
    width="880px"
    ok-text="保存"
    cancel-text="取消"
    :mask-closable="false"
    @ok="submit"
    @cancel="emit('update:open', false)"
  >
    <div class="member-picker">
      <aside class="member-picker__nav">
        <button
          v-for="role in roleNav"
          :key="role.code"
          type="button"
          :class="['picker-nav-item', { 'picker-nav-item--active': activeRole === role.code }]"
          @click="activeRole = role.code"
        >
          <span class="picker-nav-item__label">{{ role.label }}</span>
          <span class="picker-nav-item__count">{{ role.count }}</span>
        </button>
      </aside>

      <section class="member-picker__panel">
        <div class="member-picker__head">
          <span class="member-picker__title">
            {{ activeRoleLabel }}
            <em>已选 {{ roleNav.find((role) => role.code === activeRole)?.count ?? 0 }} 人</em>
          </span>
          <button type="button" class="member-picker__action" @click="toggleAll">
            {{ isAllSelected ? '全不选' : '全选' }}
          </button>
        </div>
        <a-input
          v-model:value="keyword"
          placeholder="搜索姓名 / 部门"
          allow-clear
          class="member-picker__search"
        />
        <div class="member-picker__grid">
          <MemberChipGrid
            :users="candidates"
            :selected-ids="selectedIds"
            empty-text="该角色暂无在职成员"
            @toggle="toggle"
          />
        </div>
        <p class="member-picker__hint">
          共 {{ selectedIds.length }} 人已加入项目；勾选即入选，角色由左侧岗位分组决定。
          项目负责人 {{ ownerUser?.name ?? '—' }} 不可移出。
        </p>
      </section>
    </div>
  </a-modal>
</template>

<style scoped>
.member-picker {
  display: flex;
  gap: var(--spacing-4);
  min-height: 400px;
  max-height: 60vh;
}

.member-picker__nav {
  width: 160px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-2);
  border-radius: var(--radius-4);
  background: var(--color-bg-page-alt);
  overflow-y: auto;
}

.picker-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: 9px 12px;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.picker-nav-item:hover {
  background: var(--color-bg-hover);
}

.picker-nav-item--active {
  background: var(--color-fill-primary-subtle);
  color: var(--color-action-primary);
  font-weight: 600;
}

.picker-nav-item__count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.member-picker__panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.member-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
}

.member-picker__title {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.member-picker__title em {
  font-style: normal;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-tertiary);
}

.member-picker__action {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-action-primary);
  font-size: 12px;
  cursor: pointer;
}

.member-picker__grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px;
}

.member-picker__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
