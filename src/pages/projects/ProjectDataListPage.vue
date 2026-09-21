<script setup lang="ts">
import { useRoute } from 'vue-router';
import DataListWorkspace from '@/modules/datalist/components/DataListWorkspace.vue';

defineOptions({ name: 'ProjectDataList' });

const route = useRoute();
const projectId = route.params.id as string;
</script>

<template>
  <DataListWorkspace :project-id="projectId" />
</template>