<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TeamOutlined } from '@ant-design/icons-vue';
import MemberChipGrid from '../../../shared/components/MemberChipGrid.vue';
import { useCreateProjectModalContext } from '../../create-project-modal/useCreateProjectModal';
import type { SegmentState } from '../../create-project-modal/useCreateProjectModal';

defineOptions({ name: 'CreateProjectSegmentStep' });

const {
  segments,
  handleSegmentOwnerToggle,
  handleSegmentOwnerSelectAll,
  handleSegmentParticipantToggle,
  handleSegmentParticipantSelectAll,
  handleSegmentPrincipalChange,
} = useCreateProjectModalContext();

const activeSegmentId = ref<string>('');

watch(
  segments,
  (list) => {
    if (list.length === 0) {
      activeSegmentId.value = '';
      return;
    }
    if (!list.some((segment) => segment.segmentId === activeSegmentId.value)) {
      activeSegmentId.value = list[0].segmentId;
    }
  },
  { immediate: true }
);

const EMPTY_SEGMENT: SegmentState = {
  segmentId: '',
  segmentName: '',
  ownerGroups: [],
  participantGroups: [],
  principalUserId: '',
};

const activeSegment = computed(
  () => segments.value.find((segment) => segment.segmentId === activeSegmentId.value) ?? EMPTY_SEGMENT
);

/** 环节已选负责人 userId（去重） */
function ownerIdsOf(segment: SegmentState): string[] {
  const ids: string[] = [];
  segment.ownerGroups.forEach((group) => {
    group.selectedUserIds.forEach((userId) => {
      if (!ids.includes(userId)) ids.push(userId);
    });
  });
  return ids;
}

function participantIdsOf(segment: SegmentState): string[] {
  const ids: string[] = [];
  segment.participantGroups.forEach((group) => {
    group.selectedUserIds.forEach((userId) => {
      if (!ids.includes(userId)) ids.push(userId);
    });
  });
  return ids;
}

/** 全部负责人候选是否都已勾选（决定「全选 / 全不选」按钮文案） */
function isAllSelected(segment: SegmentState, kind: 'owner' | 'participant'): boolean {
  const groups = kind === 'owner' ? segment.ownerGroups : segment.participantGroups;
  const candidates = groups.flatMap((group) => group.candidateUsers.map((user) => user.id));
  if (candidates.length === 0) return false;
  const selected = kind === 'owner' ? ownerIdsOf(segment) : participantIdsOf(segment);
  return candidates.every((userId) => selected.includes(userId));
}

function toggleAll(segment: SegmentState, kind: 'owner' | 'participant'): void {
  const next = !isAllSelected(segment, kind);
  if (kind === 'owner') handleSegmentOwnerSelectAll(segment, next);
  else handleSegmentParticipantSelectAll(segment, next);
}
</script>

<template>
  <div class="step-content">
    <div v-if="segments.length === 0" class="segment-empty">
      <TeamOutlined class="empty-icon" />
      <p>当前模板没有可配置的阶段环节</p>
    </div>

    <div v-else class="segment-assignment-shell">
      <aside class="segment-nav">
        <button
          v-for="segment in segments"
          :key="segment.segmentId"
          type="button"
          :class="['segment-nav-item', { 'segment-nav-item--active': activeSegmentId === segment.segmentId }]"
          @click="activeSegmentId = segment.segmentId"
        >
          <span class="segment-nav-item__name">{{ segment.segmentName }}</span>
          <span class="segment-nav-item__meta">
            负责人 {{ ownerIdsOf(segment).length }} · 参与人 {{ participantIdsOf(segment).length }}
          </span>
        </button>
      </aside>

      <section class="segment-panel">
        <div class="segment-panel__header">
          <div>
            <h3 class="form-section-title">{{ activeSegment.segmentName }} · 环节成员</h3>
            <p class="segment-panel__subtitle">
              按角色勾选成员，角色由工序决定；勾选的负责人首位默认为该环节默认负责人
            </p>
          </div>
        </div>

        <div class="segment-panel__body">
          <article class="segment-block">
            <div class="segment-block__head">
              <span class="segment-block__title segment-block__title--owner">
                <span class="segment-dot segment-dot--owner"></span>
                环节负责人
                <em class="segment-block__count">{{ ownerIdsOf(activeSegment).length }} 人</em>
              </span>
              <button type="button" class="segment-block__action" @click="toggleAll(activeSegment, 'owner')">
                {{ isAllSelected(activeSegment, 'owner') ? '全不选' : '全选' }}
              </button>
            </div>
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
                @toggle="handleSegmentOwnerToggle(activeSegment, $event)"
                @set-principal="handleSegmentPrincipalChange(activeSegment, $event)"
              />
            </div>
          </article>

          <article class="segment-block">
            <div class="segment-block__head">
              <span class="segment-block__title segment-block__title--participant">
                <span class="segment-dot segment-dot--participant"></span>
                参与人
                <em class="segment-block__count">{{ participantIdsOf(activeSegment).length }} 人</em>
              </span>
              <button
                type="button"
                class="segment-block__action"
                @click="toggleAll(activeSegment, 'participant')"
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
                @toggle="handleSegmentParticipantToggle(activeSegment, $event)"
              />
            </div>
            <p v-if="activeSegment.participantGroups.length === 0" class="segment-role-group__empty">
              该工序无需配置参与人
            </p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.step-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.segment-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-10) var(--spacing-4);
  border-radius: var(--radius-4);
  background: var(--color-bg-page-alt);
  color: var(--color-text-tertiary);
}

.empty-icon {
  font-size: 28px;
}

.segment-assignment-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: var(--spacing-4);
}

.segment-nav {
  width: 190px;
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
  padding: 10px 12px;
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

.segment-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  overflow-y: auto;
}

.segment-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-3);
}

.form-section-title {
  margin: 0;
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.segment-panel__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.segment-panel__body {
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

.segment-block__count {
  font-size: 12px;
  font-style: normal;
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

.segment-role-group__empty {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
