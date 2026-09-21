import type { RoleCode } from '@/constants/roles';

/**
 * 管线工序 → 角色要求（AIGC 制作工序链的角色映射）
 * 环节的「负责人角色 / 参与人角色」由工序决定，候选人再从公司员工库按角色筛。
 */

export interface StepRoleRequirements {
  /** 该工序的负责人角色 */
  ownerRoles: RoleCode[];
  /** 该工序的参与人角色 */
  participantRoles: RoleCode[];
}

export const STEP_ROLE_REQUIREMENTS: Record<string, StepRoleRequirements> = {
  剧本: { ownerRoles: ['screenwriter'], participantRoles: ['director'] },
  分镜: { ownerRoles: ['director'], participantRoles: ['screenwriter'] },
  美术关键帧: { ownerRoles: ['art_generator'], participantRoles: ['director'] },
  关键帧: { ownerRoles: ['art_generator'], participantRoles: ['video_generator'] },
  '关键帧+生成': { ownerRoles: ['art_generator'], participantRoles: ['video_generator'] },
  图生视频: { ownerRoles: ['video_generator'], participantRoles: ['director'] },
  对口型: { ownerRoles: ['video_generator'], participantRoles: ['post_production'] },
  精修合成: { ownerRoles: ['post_production'], participantRoles: ['director'] },
};

const DEFAULT_REQUIREMENTS: StepRoleRequirements = {
  ownerRoles: ['director'],
  participantRoles: [],
};

/** 取工序的角色要求（未登记的工序回退到导演负责） */
export function resolveStepRoleRequirements(stepName: string): StepRoleRequirements {
  return STEP_ROLE_REQUIREMENTS[stepName] ?? DEFAULT_REQUIREMENTS;
}

/** 环节蓝图（由管线工序链生成，segmentId 按序号保证稳定） */
export interface SegmentBlueprint {
  segmentId: string;
  segmentName: string;
  ownerRoles: RoleCode[];
  participantRoles: RoleCode[];
}

export function buildSegmentBlueprints(steps: string[]): SegmentBlueprint[] {
  return steps.map((stepName, index) => {
    const requirements = resolveStepRoleRequirements(stepName);
    return {
      segmentId: `seg-${index + 1}`,
      segmentName: stepName,
      ownerRoles: requirements.ownerRoles,
      participantRoles: requirements.participantRoles,
    };
  });
}
