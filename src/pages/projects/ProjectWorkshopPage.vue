<script setup lang="ts">
import { useRoute } from 'vue-router';
import ProductionCenterWorkspace from '@/modules/production/components/ProductionCenterWorkspace.vue';
import '@/styles/pages/production/production-center.css';

defineOptions({ name: 'ProjectWorkshop' });

const route = useRoute();
const projectId = route.params.id as string;
</script>

<template>
  <ProductionCenterWorkspace :project-id="projectId" />
</template>