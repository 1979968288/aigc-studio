import type { InjectionKey } from 'vue';

import type { ApprovalCenterPageContext } from './useApprovalCenterPage';

export const approvalCenterPageKey: InjectionKey<ApprovalCenterPageContext> =
  Symbol('approval-center-page');
