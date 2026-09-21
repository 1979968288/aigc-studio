<script setup lang="ts">
import { useRoute } from 'vue-router';
import AssetListWorkspace from '@/modules/assets/components/AssetListWorkspace.vue';

defineOptions({ name: 'ProjectAssets' });

const route = useRoute();
const projectId = route.params.id as string;
</script>

<template>
  <AssetListWorkspace :project-id="projectId" />
</template>