import { ROLE_DEFINITIONS, type DemoUser, type RoleCode } from '@/constants/roles';
import { buildSegmentBlueprints } from '@/shared/aigc/pipelineRoles';
import type { DemoProjectSegmentMember } from '@/shared/mock/db';

/**
 * 环节成员草稿模型（创建向导 Step2 与项目详情「环节负责人」共用）
 *
 * 环节 = 管线工序；每道工序按固定映射表带出「负责人角色 / 参与人角色」，
 * 候选人在角色分组内勾选，勾选即入选，角色由分组决定。
 */

export interface SegmentRoleGroup {
  roleCode: RoleCode;
  roleLabel: string;
  /** 该角色的候选人 */
  candidateUsers: DemoUser[];
  /** 已勾选的成员 userId */
  selectedUserIds: string[];
}

export interface SegmentState {
  segmentId: string;
  segmentName: string;
  ownerGroups: SegmentRoleGroup[];
  participantGroups: SegmentRoleGroup[];
  /** 默认负责人 userId */
  principalUserId: string;
}

function buildRoleGroups(roleCodes: readonly RoleCode[], staff: DemoUser[]): SegmentRoleGroup[] {
  return roleCodes.map((roleCode) => ({
    roleCode,
    roleLabel: ROLE_DEFINITIONS.find((item) => item.code === roleCode)?.label ?? roleCode,
    candidateUsers: staff.filter((user) => user.role === roleCode),
    selectedUserIds: [],
  }));
}

/** 环节已勾选的负责人 userId（按分组顺序去重） */
export function collectSegmentOwnerIds(segment: SegmentState): string[] {
  const ids: string[] = [];
  segment.ownerGroups.forEach((group) => {
    group.selectedUserIds.forEach((userId) => {
      if (!ids.includes(userId)) ids.push(userId);
    });
  });
  return ids;
}

/** 环节已勾选的参与人 userId（按分组顺序去重） */
export function collectSegmentParticipantIds(segment: SegmentState): string[] {
  const ids: string[] = [];
  segment.participantGroups.forEach((group) => {
    group.selectedUserIds.forEach((userId) => {
      if (!ids.includes(userId)) ids.push(userId);
    });
  });
  return ids;
}

/** 由工序链构建环节草稿；传入既有环节成员时回填勾选与默认负责人 */
export function buildSegmentStates(
  steps: string[],
  staff: DemoUser[],
  existing: DemoProjectSegmentMember[] = []
): SegmentState[] {
  return buildSegmentBlueprints(steps).map((blueprint) => {
    const state: SegmentState = {
      segmentId: blueprint.segmentId,
      segmentName: blueprint.segmentName,
      ownerGroups: buildRoleGroups(blueprint.ownerRoles, staff),
      participantGroups: buildRoleGroups(blueprint.participantRoles, staff),
      principalUserId: '',
    };
    existing
      .filter((row) => row.segmentId === state.segmentId)
      .forEach((row) => {
        const groups = row.type === 'owner' ? state.ownerGroups : state.participantGroups;
        const group = groups.find((item) =>
          item.candidateUsers.some((user) => user.id === row.userId)
        );
        if (!group) return;
        if (!group.selectedUserIds.includes(row.userId)) group.selectedUserIds.push(row.userId);
        if (row.type === 'owner' && row.isPrincipal) state.principalUserId = row.userId;
      });
    if (!state.principalUserId) state.principalUserId = collectSegmentOwnerIds(state)[0] ?? '';
    return state;
  });
}

/** 环节草稿 → 落库结构（负责人首位为默认负责人，参与人排除已任负责人的人） */
export function segmentStatesToMembers(states: SegmentState[]): DemoProjectSegmentMember[] {
  const result: DemoProjectSegmentMember[] = [];
  states.forEach((segment) => {
    const ownerIds = collectSegmentOwnerIds(segment);
    ownerIds.forEach((userId, index) => {
      result.push({
        segmentId: segment.segmentId,
        segmentName: segment.segmentName,
        userId,
        type: 'owner',
        sortOrder: index,
        isPrincipal: userId === (segment.principalUserId || ownerIds[0]),
      });
    });
    let participantIndex = 0;
    segment.participantGroups.forEach((group) => {
      group.selectedUserIds.forEach((userId) => {
        if (ownerIds.includes(userId)) return;
        result.push({
          segmentId: segment.segmentId,
          segmentName: segment.segmentName,
          userId,
          type: 'participant',
          sortOrder: participantIndex++,
          isPrincipal: false,
        });
      });
    });
  });
  return result;
}

/** 勾选/取消勾选某角色分组内的成员 */
export function toggleSegmentMember(groups: SegmentRoleGroup[], userId: string): void {
  const group = groups.find((item) => item.candidateUsers.some((user) => user.id === userId));
  if (!group) return;
  const index = group.selectedUserIds.indexOf(userId);
  if (index >= 0) group.selectedUserIds.splice(index, 1);
  else group.selectedUserIds.push(userId);
}

/** 整组勾选 / 取消勾选 */
export function setSegmentGroupSelection(groups: SegmentRoleGroup[], selected: boolean): void {
  groups.forEach((group) => {
    group.selectedUserIds = selected ? group.candidateUsers.map((user) => user.id) : [];
  });
}
