<script setup lang="ts">
import {
  ProjectOutlined,
  SolutionOutlined,
  InboxOutlined,
  AppstoreOutlined,
  AuditOutlined,
  VideoCameraOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import type { DashboardMenuItem } from '../types';

defineProps<{
  menuItems: DashboardMenuItem[];
}>();

const emit = defineEmits<{
  (event: 'menu-click', route: string): void;
}>();

const iconMap = {
  project: ProjectOutlined,
  task: SolutionOutlined,
  inbox: InboxOutlined,
  asset: AppstoreOutlined,
  approval: AuditOutlined,
  review: VideoCameraOutlined,
  staff: TeamOutlined,
} as const;
</script>

<script lang="ts">
export default { name: 'DashboardMenuCard' };
</script>

<template>
  <div class="db1-menu-list">
    <button
      v-for="item in menuItems"
      :key="item.id"
      type="button"
      class="db1-menu-item"
      @click="emit('menu-click', item.route)"
    >
      <span class="db1-menu-item__icon" :class="`db1-menu-item__icon--${item.accent}`">
        <component :is="iconMap[item.icon]" />
      </span>
      <span class="db1-menu-item__label">{{ item.label }}</span>
    </button>
  </div>
</template>
