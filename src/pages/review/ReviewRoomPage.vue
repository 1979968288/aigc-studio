<script setup lang="ts">
import { computed } from 'vue';
import { readDB } from '@/shared/mock/db';
import ReviewRoomWorkspace from '@/modules/review/components/ReviewRoomWorkspace.vue';

defineOptions({ name: 'ReviewRoom' });

/** 全局审片室：默认进入第一个有审片时间线的项目 */
const projectId = computed(() => readDB().reviewTimelines[0]?.projectId ?? 'p1');
</script>

<template>
  <ReviewRoomWorkspace :key="projectId" :project-id="projectId" />
</template>
