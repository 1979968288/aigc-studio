<script setup lang="ts">
import { onMounted, provide } from 'vue';
import ProductionCenterHeader from './ProductionCenterHeader.vue';
import ProductionWorkspaceSwimlanes from './ProductionWorkspaceSwimlanes.vue';
import ProductionWorkspaceContextMenu from './ProductionWorkspaceContextMenu.vue';
import ProductionEntityDialogs from './ProductionEntityDialogs.vue';
import { productionCenterKey, useProductionCenterPage } from '../useProductionCenterPage';

defineOptions({ name: 'ProductionCenterWorkspace' });

const props = defineProps<{
  projectId: string;
}>();

const page = useProductionCenterPage(props.projectId);

provide(productionCenterKey, page);

onMounted(() => {
  void page.load();
});
</script>

<template>
  <div class="pc-page">
    <ProductionCenterHeader />
    <ProductionWorkspaceSwimlanes />

    <ProductionWorkspaceContextMenu />
    <ProductionEntityDialogs />
  </div>
</template>