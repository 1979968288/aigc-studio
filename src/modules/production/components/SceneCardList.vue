<script setup lang="ts">
import { computed } from 'vue';
import SceneCard from './SceneCard.vue';
import { useProductionCenter } from '../useProductionCenterPage';

defineOptions({ name: 'SceneCardList' });

const ctx = useProductionCenter();

const scenes = computed(() => ctx.filteredScenes.value);
const selectedIds = computed(() =>
  ctx.selectedEntity.value?.type === 'scene' ? [ctx.selectedEntity.value.id] : []
);
const highlightedIds = computed(() => ctx.highlightedScenes.value);
</script>

<template>
  <div class="pc-workspace-panel pc-lane pc-scene-list">
    <div class="pc-lane__header">
      <h2 class="pc-lane__title">场次层</h2>
      <span class="pc-scene-list__count">{{ scenes.length }} 场</span>
    </div>

    <div class="pc-lane__body">
      <SceneCard
        v-for="scene in scenes"
        :key="scene.id"
        :scene="scene"
        :is-selected="selectedIds.includes(scene.id)"
        :is-highlighted="highlightedIds.includes(scene.id)"
        :can-mutate="true"
        @click="ctx.selectScene(scene)"
        @contextmenu="(e: MouseEvent) => ctx.showContextMenu(e, 'scene', scene)"
        @drag-start="ctx.onSceneDragStart"
        @drag-end="ctx.onSceneDragEnd"
      />
      <a-empty v-if="scenes.length === 0" description="暂无场次" />
    </div>
  </div>
</template>

<style scoped>
.pc-scene-list__count {
  flex: 0 0 auto;
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
}
</style>