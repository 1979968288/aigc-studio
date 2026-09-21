<script setup lang="ts">
import { useRoute } from 'vue-router';
import ProjectDetailWorkspace from '@/modules/projects/project-detail/components/ProjectDetailWorkspace.vue';

defineOptions({ name: 'ProjectDetail' });

const route = useRoute();
const projectId = route.params.id as string;
</script>

<template>
  <ProjectDetailWorkspace :project-id="projectId" />
</template>
