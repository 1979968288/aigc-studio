<script setup lang="ts">
import DashboardProjectCard from './DashboardProjectCard.vue';
import DashboardTaskCard from './DashboardTaskCard.vue';
import DashboardGlobalProductionBoardCard from './DashboardGlobalProductionBoardCard.vue';
import DashboardApprovalCard from './DashboardApprovalCard.vue';
import DashboardShortcutCard from './DashboardShortcutCard.vue';
import DashboardMenuCard from './DashboardMenuCard.vue';
import { menuItems } from '../constants';
import type {
  DashboardApprovalItem,
  DashboardApprovalSummary,
  DashboardGlobalProductionLane,
  DashboardProjectSummary,
  DashboardShortcutItem,
  DashboardTaskItem,
  VisibleLayoutCard,
} from '../types';

defineProps<{
  approvalItems: DashboardApprovalItem[];
  approvalSummaries: DashboardApprovalSummary[];
  card: VisibleLayoutCard;
  globalProductionBoardLanes: DashboardGlobalProductionLane[];
  loadingApprovals: boolean;
  loadingGlobalProductionBoard: boolean;
  loadingProjects: boolean;
  loadingShortcuts: boolean;
  loadingTasks: boolean;
  loadingWatch: boolean;
  projectItems: DashboardProjectSummary[];
  shortcutItems: DashboardShortcutItem[];
  taskItems: DashboardTaskItem[];
  watchProjects: DashboardProjectSummary[];
}>();

const emit = defineEmits<{
  (event: 'go-to', route: string): void;
  (event: 'remove-shortcut', id: string): void;
}>();
</script>

<script lang="ts">
export default { name: 'DashboardCardContent' };
</script>

<template>
  <div class="db1-card__body">
    <DashboardProjectCard
      v-if="card.meta.type === 'watch'"
      :projects="watchProjects"
      :loading="loadingWatch"
      grid-class="db1-watch-grid"
      empty-title="暂无关注项目"
      empty-description="关注后的项目会显示在这里，方便你快速回到常用项目。"
      @go-to="emit('go-to', $event)"
    />

    <DashboardProjectCard
      v-else-if="card.meta.type === 'project'"
      :projects="projectItems"
      :loading="loadingProjects"
      grid-class="db1-project-grid"
      empty-title="暂无项目"
      empty-description="最近创建或参与的项目会显示在这里，你可以前往项目列表查看更多内容。"
      @go-to="emit('go-to', $event)"
    />

    <DashboardTaskCard
      v-else-if="card.meta.type === 'task'"
      :loading="loadingTasks"
      :tasks="taskItems"
      @go-to="emit('go-to', $event)"
    />

    <DashboardGlobalProductionBoardCard
      v-else-if="card.meta.type === 'global-production-board'"
      :lanes="globalProductionBoardLanes"
      :loading="loadingGlobalProductionBoard"
      @go-to="emit('go-to', $event)"
    />

    <DashboardApprovalCard
      v-else-if="card.meta.type === 'review'"
      :loading="loadingApprovals"
      :items="approvalItems"
      :summaries="approvalSummaries"
      @go-to="emit('go-to', $event)"
    />

    <DashboardShortcutCard
      v-else-if="card.meta.type === 'shortcut'"
      :loading="loadingShortcuts"
      :shortcut-items="shortcutItems"
      @open-shortcut="emit('go-to', $event)"
      @remove-shortcut="emit('remove-shortcut', $event)"
    />

    <DashboardMenuCard
      v-else-if="card.meta.type === 'menu'"
      :menu-items="menuItems"
      @menu-click="emit('go-to', $event)"
    />
  </div>
</template>
