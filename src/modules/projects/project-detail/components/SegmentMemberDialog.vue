<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { findStaffByRef, readStaffList } from '@/modules/staff/api';
import type { DemoProjectMember, DemoProjectSegmentMember } from '@/shared/mock/db';
import MemberChipGrid from '../../shared/components/MemberChipGrid.vue';
import {
  buildSegmentStates,
  collectSegmentOwnerIds,
  collectSegmentParticipantIds,
  segmentStatesToMembers,
  setSegmentGroupSelection,
  toggleSegmentMember,
  type SegmentState,
} from '../../shared/segmentMembers';
import type { ProjectSummary } from '../types';

defineOptions({ name: 'SegmentMemberDialog' });

const props = defineProps<{
  open: boolean;
  project: ProjectSummary;
}>();

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void;
  (event: 'save', patch: Record<string, unknown>): void;
}>();

const draft = ref<SegmentState[]>([]);
const activeSegmentId = ref('');

const EMPTY_SEGMENT: SegmentState = {
  segmentId: '',
  segmentName: '',
  ownerGroups: [],
  participantGroups: [],
  principalUserId: '',
};

const activeSegment = computed(
  () => draft.value.find((segment) => segment.segmentId === activeSegmentId.value) ?? EMPTY_SEGMENT
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const staff = readStaffList().filter((user) => user.employmentStatus === 'active');
    draft.value = buildSegmentStates(
      props.project.pipelineSteps,
      staff,
      props.project.segmentMembers
    );
    activeSegmentId.value = draft.value[0]?.segmentId ?? '';
  },
  { immediate: true }
);

/** 默认负责人兜底：原默认负责人被移出时顺延到首位负责人 */
function syncPrincipal(segment: SegmentState): void {
  const ownerIds = collectSegmentOwnerIds(segment);
  if (!ownerIds.includes(segment.principalUserId)) {
    segment.principalUserId = ownerIds[0] ?? '';
  }
}

function onOwnerToggle(segment: SegmentState, userId: string): void {
  toggleSegmentMember(segment.ownerGroups, userId);
  syncPrincipal(segment);
}

function onOwnerSelectAll(segment: SegmentState, selected: boolean): void {
  setSegmentGroupSelection(segment.ownerGroups, selected);
  syncPrincipal(segment);
}

function onParticipantToggle(segment: SegmentState, userId: string): void {
  toggleSegmentMember(segment.participantGroups, userId);
}

function onParticipantSelectAll(segment: SegmentState, selected: boolean): void {
  setSegmentGroupSelection(segment.participantGroups, selected);
}

function setPrincipal(segment: SegmentState, userId: string): void {
  if (!collectSegmentOwnerIds(segment).includes(userId)) return;
  segment.principalUserId = userId;
}

function isAllSelected(segment: SegmentState, kind: 'owner' | 'participant'): boolean {
  const groups = kind === 'owner' ? segment.ownerGroups : segment.participantGroups;
  const candidates = groups.flatMap((group) => group.candidateUsers.map((user) => user.id));
  if (candidates.length === 0) return false;
  const selected =
    kind === 'owner'
      ? collectSegmentOwnerIds(segment)
      : collectSegmentParticipantIds(segment);
  return candidates.every((userId) => selected.includes(userId));
}

function submit(): void {
  const segmentMembers: DemoProjectSegmentMember[] = segmentStatesToMembers(draft.value);
  /** 环节里勾选但尚未加入项目的人，自动补进项目成员（岗位角色即项目角色） */
  const members: DemoProjectMember[] = props.project.members.map((member) => ({ ...member }));
  const joinDate = new Date().toISOString().slice(0, 10);
  const addMember = (userId: string): void => {
    if (members.some((member) => member.userId === userId)) return;
    const user = findStaffByRef(userId);
    if (!user || user.employmentStatus !== 'active') return;
    members.push({ userId, projectRole: user.role, joinedAt: joinDate });
  };
  draft.value.forEach((segment) => {
    collectSegmentOwnerIds(segment).forEach(addMember);
    collectSegmentParticipantIds(segment).forEach(addMember);
  });
  emit('save', { segmentMembers, members });
  emit('update:open', false);
}
</script>

<template>
  <a-modal
    :open="open"
    title="编辑环节成员"
    width="900px"
    ok-text="保存"
    cancel-text="取消"
    :mask-closable="false"
    @ok="submit"
    @cancel="emit('update:open', false)"
  >
    <div v-if="draft.length === 0" class="segment-editor-empty">当前管线模板没有可配置的环节</div>

    <div v-else class="segment-editor">
      <aside class="segment-editor__nav">
        <button
          v-for="segment in draft"
          :key="segment.segmentId"
          type="button"
          :class="['segment-nav-item', { 'segment-nav-item--active': activeSegmentId === segment.segmentId }]"
          @click="activeSegmentId = segment.segmentId"
        >
          <span class="segment-nav-item__name">{{ segment.segmentName }}</span>
          <span class="segment-nav-item__meta">
            负责人 {{ collectSegmentOwnerIds(segment).length }} · 参与人
            {{ collectSegmentParticipantIds(segment).length }}
          </span>
        </button>
      </aside>

      <section class="segment-editor__panel">
        <div class="segment-editor__body">
          <article class="segment-block">
            <div class="segment-block__head">
              <span class="segment-block__title">
                <span class="segment-dot segment-dot--owner"></span>
                环节负责人
                <em>{{ collectSegmentOwnerIds(activeSegment).length }} 人</em>
              </span>
              <button
                type="button"
                class="segment-block__action"
                @click="onOwnerSelectAll(activeSegment, !isAllSelected(activeSegment, 'owner'))"
              >
                {{ isAllSelected(activeSegment, 'owner') ? '全不选' : '全选' }}
              </button>
            </div>
            <p class="segment-block__tip">勾选即任负责人；点星标可切换该环节默认负责人</p>
            <div
              v-for="group in activeSegment.ownerGroups"
              :key="group.roleCode"
              class="segment-role-group"
            >
              <div class="segment-role-group__title">
                {{ group.roleLabel }}
                <em>{{ group.selectedUserIds.length }} / {{ group.candidateUsers.length }}</em>
              </div>
              <MemberChipGrid
                :users="group.candidateUsers"
                :selected-ids="group.selectedUserIds"
                :principal-id="activeSegment.principalUserId"
                show-principal
                @toggle="onOwnerToggle(activeSegment, $event)"
                @set-principal="setPrincipal(activeSegment, $event)"
              />
            </div>
          </article>

          <article class="segment-block">
            <div class="segment-block__head">
              <span class="segment-block__title">
                <span class="segment-dot segment-dot--participant"></span>
                参与人
                <em>{{ collectSegmentParticipantIds(activeSegment).length }} 人</em>
              </span>
              <button
                type="button"
                class="segment-block__action"
                @click="
                  onParticipantSelectAll(activeSegment, !isAllSelected(activeSegment, 'participant'))
                "
              >
                {{ isAllSelected(activeSegment, 'participant') ? '全不选' : '全选' }}
              </button>
            </div>
            <div
              v-for="group in activeSegment.participantGroups"
              :key="group.roleCode"
              class="segment-role-group"
            >
              <div class="segment-role-group__title">
                {{ group.roleLabel }}
                <em>{{ group.selectedUserIds.length }} / {{ group.candidateUsers.length }}</em>
              </div>
              <MemberChipGrid
                :users="group.candidateUsers"
                :selected-ids="group.selectedUserIds"
                @toggle="onParticipantToggle(activeSegment, $event)"
              />
            </div>
            <p v-if="activeSegment.participantGroups.length === 0" class="segment-block__tip">
              该工序无需配置参与人
            </p>
          </article>
        </div>
      </section>
    </div>
  </a-modal>
</template>

<style scoped>
.segment-editor-empty {
  padding: var(--spacing-10) 0;
  text-align: center;
  color: var(--color-text-tertiary);
}

.segment-editor {
  display: flex;
  gap: var(--spacing-4);
  min-height: 400px;
  max-height: 62vh;
}

.segment-editor__nav {
  width: 170px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-2);
  border-radius: var(--radius-4);
  background: var(--color-bg-page-alt);
  overflow-y: auto;
}

.segment-nav-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  padding: 9px 12px;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.segment-nav-item:hover {
  background: var(--color-bg-hover);
}

.segment-nav-item--active {
  background: var(--color-fill-primary-subtle);
}

.segment-nav-item__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.segment-nav-item--active .segment-nav-item__name {
  color: var(--color-action-primary);
}

.segment-nav-item__meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.segment-editor__panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}

.segment-editor__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.segment-block {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
}

.segment-block__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
}

.segment-block__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.segment-block__title em {
  font-style: normal;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-tertiary);
}

.segment-block__action {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-action-primary);
  font-size: 12px;
  cursor: pointer;
}

.segment-block__tip {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.segment-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
}

.segment-dot--owner {
  background: var(--color-action-primary);
}

.segment-dot--participant {
  background: var(--color-status-info, var(--color-action-primary));
}

.segment-role-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.segment-role-group__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.segment-role-group__title em {
  font-style: normal;
  color: var(--color-text-quaternary, var(--color-text-tertiary));
}
</style>
