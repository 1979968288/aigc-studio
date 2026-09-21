<script setup lang="ts">
import { computed } from 'vue';
import ScriptLayer from './ScriptLayer.vue';
import SceneCardList from './SceneCardList.vue';
import TaskCardList from './TaskCardList.vue';
import AssetTypeLane from './AssetTypeLane.vue';
import { useProductionCenter } from '../useProductionCenterPage';

defineOptions({ name: 'ProductionWorkspaceSwimlanes' });

const ctx = useProductionCenter();

const assetGroups = computed(() => ctx.assetGroups.value);
</script>

<template>
  <div class="pc-swimlanes">
    <ScriptLayer />
    <SceneCardList />
    <TaskCardList />

    <div class="pc-workspace-panel pc-lane pc-asset-lane">
      <div class="pc-lane__header">
        <h2 class="pc-lane__title">资产层</h2>
      </div>
      <div class="pc-lane__body pc-asset-lane__body">
        <AssetTypeLane
          v-for="group in assetGroups"
          :key="group.type"
          :asset-type="group.type"
          :assets="group.assets"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pc-asset-lane__body {
  gap: var(--spacing-4);
}
</style>