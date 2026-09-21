<script setup lang="ts">
import { computed } from 'vue';
import { LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import { useProductionCenter } from '../useProductionCenterPage';
import type { PCScriptRecord } from '../types';

defineOptions({ name: 'ScriptLayer' });

const ctx = useProductionCenter();

const collapsed = computed(() => ctx.scriptLayerCollapsed.value);
const scripts = computed(() => ctx.scripts.value);

function toggle(): void {
  ctx.scriptLayerCollapsed.value = !ctx.scriptLayerCollapsed.value;
}

function onContextmenu(e: MouseEvent, script: PCScriptRecord): void {
  ctx.showContextMenu(e, 'script', script);
}
</script>

<template>
  <div
    class="pc-workspace-panel pc-lane pc-script-layer"
    :class="{ 'pc-script-layer--collapsed': collapsed }"
  >
    <div class="pc-lane__header">
      <h2 v-if="!collapsed" class="pc-lane__title">剧本层</h2>
      <button
        type="button"
        class="pc-script-layer__toggle"
        :aria-label="collapsed ? '展开剧本层' : '折叠剧本层'"
        @click="toggle"
      >
        <RightOutlined v-if="collapsed" />
        <LeftOutlined v-else />
      </button>
    </div>

    <div v-if="!collapsed" class="pc-lane__body pc-script-layer__body">
      <template v-if="scripts.length">
        <article
          v-for="script in scripts"
          :key="script.id"
          class="pc-script-layer__script"
          data-pc-entity="script"
          :data-pc-id="script.id"
          @contextmenu.prevent="onContextmenu($event, script)"
        >
          <div class="pc-script-layer__script-title">{{ script.name }}</div>
          <div class="pc-script-layer__meta">
            版本 v{{ script.versionNo }} · {{ script.createTime }}
          </div>

          <div v-for="act in script.acts" :key="act.id" class="pc-script-layer__act">
            <div class="pc-script-layer__act-name">{{ act.name }}</div>
            <section
              v-for="scene in act.scenes"
              :key="scene.id"
              class="pc-script-layer__scene"
            >
              <div class="pc-script-layer__scene-title">{{ scene.title }}</div>
              <p
                v-for="(paragraph, index) in scene.paragraphs"
                :key="index"
                class="pc-script-layer__paragraph"
              >
                {{ paragraph }}
              </p>
            </section>
          </div>
        </article>
      </template>
      <a-empty v-else description="暂无剧本数据" />
    </div>
  </div>
</template>

<style scoped>
.pc-script-layer--collapsed {
  flex: 0 0 60px;
  width: 60px;
  min-width: 60px;
  padding: var(--spacing-4) var(--spacing-2);
}

.pc-script-layer__toggle {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.pc-script-layer__toggle:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.pc-script-layer__script {
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-3);
  background: var(--component-card-background);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
}

.pc-script-layer__script:last-of-type {
  margin-bottom: 0;
}

.pc-script-layer__script-title {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  overflow-wrap: anywhere;
}

.pc-script-layer__meta {
  margin-top: var(--spacing-2);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
}

.pc-script-layer__act {
  margin-top: var(--spacing-4);
}

.pc-script-layer__act-name {
  color: var(--color-action-primary);
  font-size: var(--font-size-12);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-2);
}

.pc-script-layer__scene {
  padding: var(--spacing-3) var(--spacing-4);
  margin-bottom: var(--spacing-3);
  border: 1px solid var(--color-border-default);
  border-left: 4px solid var(--color-action-primary);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.pc-script-layer__scene:hover {
  border-color: var(--color-border-accent);
  background: var(--color-fill-primary-subtle);
}

.pc-script-layer__scene-title {
  color: var(--color-action-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-14);
  margin-bottom: var(--spacing-2);
}

.pc-script-layer__paragraph {
  margin: 0 0 var(--spacing-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-12);
  line-height: 1.65;
}

.pc-script-layer__paragraph:last-child {
  margin-bottom: 0;
}
</style>