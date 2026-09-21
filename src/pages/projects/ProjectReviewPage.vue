<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ReviewRoomWorkspace from '@/modules/review/components/ReviewRoomWorkspace.vue';

defineOptions({ name: 'ProjectReview' });

const route = useRoute();
const projectId = computed(() => String(route.params.id ?? ''));
</script>

<template>
  <ReviewRoomWorkspace v-if="projectId" :key="projectId" :project-id="projectId" />
</template>
