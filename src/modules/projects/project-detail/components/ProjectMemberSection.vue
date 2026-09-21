<script setup lang="ts">
import { computed, ref } from 'vue';
import { StarFilled, UserOutlined } from '@ant-design/icons-vue';
import { ROLE_DEFINITIONS, type DemoUser } from '@/constants/roles';
import { findStaffByRef } from '@/modules/staff/api';
import type { DemoProjectMember } from '@/shared/mock/db';
import ProjectMemberDialog from './ProjectMemberDialog.vue';
import SegmentMemberDialog from './SegmentMemberDialog.vue';
import type { ProjectSummary } from '../types';

defineOptions({ name: 'ProjectMemberSection' });

const props = defineProps<{
  project: ProjectSummary;
  saving: boolean;
}>();

const emit = defineEmits<{
  (event: 'save', patch: Record<string, unknown>): void;
}>();

/** 双轨视图：项目成员（谁参与项目）/ 环节负责人（谁在哪道工序） */
type MemberView = 'project' | 'segment';
const activeView = ref<MemberView>('project');

const memberDialogOpen = ref(false);
const segmentDialogOpen = ref(false);

const viewTabs: Array<{ key: MemberView; label: string }> = [
  { key: 'project', label: '项目成员' },
  { key: 'segment', label: '环节负责人' },
];

/** 项目角色编码 → 展示名 */
function projectRoleLabel(role: string): string {
  return ROLE_DEFINITIONS.find((item) => item.code === role)?.label ?? role;
}

/* ---------------- 项目成员视图 ---------------- */

interface MemberRow extends DemoProjectMember {
  user: DemoUser;
}

const keyword = ref('');

const memberRows = computed<MemberRow[]>(() =>
  props.project.members
    .map((member) => {
      const user = findStaffByRef(member.userId);
      return user ? { ...member, user } : null;
    })
    .filter((item): item is MemberRow => item !== null)
);

const visibleMemberRows = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return memberRows.value;
  return memberRows.value.filter(
    (row) =>
      row.user.name.toLowerCase().includes(kw) ||
      row.user.department.toLowerCase().includes(kw) ||
      projectRoleLabel(row.projectRole).toLowerCase().includes(kw)
  );
});

/* ---------------- 环节负责人视图 ---------------- */

interface SegmentMemberRow {
  userId: string;
  name: string;
  color: string;
  roleLabel: string;
  isPrincipal: boolean;
  inactive: boolean;
}

interface SegmentRow {
  segmentName: string;
  owners: SegmentMemberRow[];
  participants: SegmentMemberRow[];
}

function toSegmentRows(
  rows: ProjectSummary['segmentMembers'],
  type: 'owner' | 'participant'
): SegmentMemberRow[] {
  return rows
    .filter((row) => row.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((row) => {
      const user = findStaffByRef(row.userId);
      return {
        userId: row.userId,
        name: user?.name ?? row.userId,
        color: user?.color ?? 'var(--color-bg-disabled)',
        roleLabel: projectRoleLabel(user?.role ?? ''),
        isPrincipal: row.isPrincipal,
        inactive: user?.employmentStatus === 'inactive',
      };
    });
}

/** 按管线工序链展开环节（即使暂无成员也占位展示） */
const segmentRows = computed<SegmentRow[]>(() => {
  const rows = props.project.segmentMembers;
  return props.project.pipelineSteps.map((segmentName) => {
    const segmentMembers = rows.filter((row) => row.segmentName === segmentName);
    return {
      segmentName,
      owners: toSegmentRows(segmentMembers, 'owner'),
      participants: toSegmentRows(segmentMembers, 'participant'),
    };
  });
});

const segmentOwnerCount = computed(
  () => props.project.segmentMembers.filter((row) => row.type === 'owner').length
);

function handleSave(patch: Record<string, unknown>): void {
  emit('save', patch);
}
</script>

<template>
  <div class="member-section">
    <div class="member-toolbar">
      <div class="member-view-switch">
        <button
          v-for="tab in viewTabs"
          :key="tab.key"
          type="button"
          :class="['view-switch-item', { 'view-switch-item--active': activeView === tab.key }]"
          @click="activeView = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="member-toolbar__actions">
        <a-input
          v-if="activeView === 'project'"
          v-model:value="keyword"
          placeholder="搜索姓名 / 角色 / 部门"
          allow-clear
          class="member-toolbar__search"
        />
        <a-button v-if="activeView === 'project'" type="primary" @click="memberDialogOpen = true">
          编辑成员
        </a-button>
        <a-button v-else type="primary" @click="segmentDialogOpen = true">编辑环节成员</a-button>
      </div>
    </div>

    <!-- 视图一：项目成员 -->
    <div v-if="activeView === 'project'" class="member-grid">
      <div
        v-for="row in visibleMemberRows"
        :key="row.userId"
        class="member-card"
        :class="{ 'member-card--owner': row.userId === project.owner }"
      >
        <div class="member-card__head">
          <span class="member-card__avatar" :style="{ background: row.user.color }">
            {{ row.user.name.charAt(0) }}
          </span>
          <div class="member-card__meta">
            <div class="member-card__name-line">
              <strong class="member-card__name">{{ row.user.name }}</strong>
              <StarFilled
                v-if="row.userId === project.owner"
                class="member-card__principal-icon"
                title="项目负责人"
              />
              <em v-if="row.user.employmentStatus === 'inactive'" class="member-card__leave-tag">
                离职
              </em>
            </div>
            <div class="member-card__title">{{ projectRoleLabel(row.projectRole) }}</div>
          </div>
        </div>
        <div class="member-card__info">
          <span>所属部门</span>
          <strong>{{ row.user.department }}</strong>
        </div>
        <div class="member-card__info">
          <span>岗位角色</span>
          <strong>{{ row.user.roleLabel }}</strong>
        </div>
      </div>
      <div v-if="visibleMemberRows.length === 0" class="member-empty">
        {{ keyword ? '没有匹配的成员' : '暂无项目成员' }}
      </div>
    </div>

    <!-- 视图二：环节负责人 -->
    <div v-else class="segment-list">
      <p class="segment-list__hint">
        按管线工序链展示，共 {{ segmentRows.length }} 道工序 / {{ segmentOwnerCount }} 位负责人；
        星标为该环节默认负责人
      </p>
      <article v-for="segment in segmentRows" :key="segment.segmentName" class="segment-card">
        <div class="segment-card__title">{{ segment.segmentName }}</div>
        <div class="segment-card__line">
          <span class="segment-card__label">负责人</span>
          <div v-if="segment.owners.length > 0" class="segment-card__people">
            <span
              v-for="owner in segment.owners"
              :key="owner.userId"
              class="person-pill"
              :class="{ 'person-pill--principal': owner.isPrincipal }"
            >
              <span class="person-pill__avatar" :style="{ background: owner.color }">
                {{ owner.name.charAt(0) }}
              </span>
              {{ owner.name }}
              <StarFilled v-if="owner.isPrincipal" class="person-pill__star" title="默认负责人" />
            </span>
          </div>
          <span v-else class="segment-card__empty">待指派</span>
        </div>
        <div class="segment-card__line">
          <span class="segment-card__label">参与人</span>
          <div v-if="segment.participants.length > 0" class="segment-card__people">
            <span v-for="person in segment.participants" :key="person.userId" class="person-pill">
              <span class="person-pill__avatar" :style="{ background: person.color }">
                {{ person.name.charAt(0) }}
              </span>
              {{ person.name }}
            </span>
          </div>
          <span v-else class="segment-card__empty">—</span>
        </div>
      </article>
      <div v-if="segmentRows.length === 0" class="member-empty">
        <UserOutlined />
        <span>当前项目未配置管线工序</span>
      </div>
    </div>

    <ProjectMemberDialog
      v-model:open="memberDialogOpen"
      :project="project"
      @save="handleSave"
    />
    <SegmentMemberDialog
      v-model:open="segmentDialogOpen"
      :project="project"
      @save="handleSave"
    />
  </div>
</template>

<style scoped>
.member-section {
  display: flex;
  flex-direction: column;
}

.member-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
  flex-wrap: wrap;
}

.member-view-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-3);
  background: var(--color-bg-page-alt);
}

.view-switch-item {
  padding: 6px 14px;
  border: 0;
  border-radius: var(--radius-2, var(--radius-3));
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.view-switch-item:hover {
  color: var(--color-action-primary);
}

.view-switch-item--active {
  background: var(--component-card-background);
  color: var(--color-action-primary);
  font-weight: 600;
}

.member-toolbar__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.member-toolbar__search {
  width: 240px;
}

/* ===== 项目成员卡片 ===== */
.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--spacing-4);
}

.member-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
}

.member-card--owner {
  background: var(--color-fill-primary-subtle);
}

.member-card__head {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.member-card__avatar {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-4);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.member-card__meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.member-card__name-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.member-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.member-card__title {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.member-card__principal-icon {
  color: var(--color-action-primary);
  font-size: 13px;
}

.member-card__leave-tag {
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.6;
  padding: 0 6px;
  border-radius: var(--radius-full);
  color: var(--color-text-tertiary);
  background: var(--color-bg-hover);
}

.member-card__info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.member-card__info strong {
  color: var(--color-text-primary);
  font-weight: 500;
}

.member-empty {
  grid-column: 1 / -1;
  min-height: 148px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  border-radius: var(--radius-4);
  background: var(--color-bg-page-alt);
  color: var(--color-text-tertiary);
}

/* ===== 环节负责人视图 ===== */
.segment-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.segment-list__hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.segment-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
}

.segment-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.segment-card__line {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  min-height: 30px;
}

.segment-card__label {
  width: 48px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.segment-card__people {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.segment-card__empty {
  font-size: 12px;
  color: var(--color-text-quaternary, var(--color-text-tertiary));
}

.person-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 4px;
  border-radius: var(--radius-full);
  background: var(--color-bg-page-alt);
  font-size: 12px;
  color: var(--color-text-primary);
}

.person-pill--principal {
  background: var(--color-fill-primary-subtle);
}

.person-pill__avatar {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: #fff;
  font-size: 11px;
  flex-shrink: 0;
}

.person-pill__star {
  font-size: 11px;
  color: var(--color-action-primary);
}
</style>
