<script setup lang="ts">
import { computed } from 'vue';
import { DownOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons-vue';
import { SEARCH_FIELD_OPTIONS, type CreateDialogType } from '../constants';
import { useProductionCenter } from '../useProductionCenterPage';

defineOptions({ name: 'ProductionCenterHeader' });

const ctx = useProductionCenter();

const projectName = computed(() => ctx.projectName.value);
const episodeOptions = computed(() => ctx.episodeOptions.value);
const selectedEpisode = computed({
  get: () => ctx.selectedEpisode.value,
  set: (value: number) => {
    ctx.selectedEpisode.value = value;
  },
});

const searchField = computed({
  get: () => ctx.searchField.value,
  set: (value: 'scene' | 'task' | 'asset') => {
    ctx.searchField.value = value;
  },
});
const searchKeyword = computed({
  get: () => ctx.searchKeyword.value,
  set: (value: string) => {
    ctx.searchKeyword.value = value;
  },
});
const searchMatchCount = computed(() => ctx.searchMatchCount.value);

const searchPlaceholder = computed(() => {
  const map: Record<string, string> = {
    scene: '名称 / 编号 / 地点 / 角色',
    task: '编号 / 工序 / 负责人',
    asset: '资产名称 / 类型 / 制作',
  };
  return map[ctx.searchField.value] ?? '搜索';
});

function handleCreateMenu(e: { key: string | number }): void {
  ctx.openCreateDialog(String(e.key) as CreateDialogType);
}
</script>

<template>
  <div class="pc-header">
    <div class="pc-header__info">
      <span class="pc-header__project">{{ projectName }}</span>
      <a-select
        v-model:value="selectedEpisode"
        size="small"
        :options="episodeOptions"
        class="pc-header__episode"
      />
    </div>

    <div class="pc-header__search">
      <a-select
        v-model:value="searchField"
        size="small"
        :options="SEARCH_FIELD_OPTIONS"
        class="pc-header__field"
      />
      <a-input
        v-model:value="searchKeyword"
        size="small"
        :placeholder="searchPlaceholder"
        allow-clear
        class="pc-header__keyword"
      />
      <span class="pc-header__count">{{ searchMatchCount }} 项</span>
      <a-tooltip title="重置筛选">
        <a-button size="small" type="text" @click="ctx.resetFilters">
          <RedoOutlined />
        </a-button>
      </a-tooltip>
    </div>

    <div class="pc-header__actions">
      <a-dropdown placement="bottomRight">
        <a-button type="primary" size="small">
          <PlusOutlined /> 新建 <DownOutlined />
        </a-button>
        <template #overlay>
          <a-menu @click="handleCreateMenu">
            <a-menu-item key="scene">新建场次</a-menu-item>
            <a-menu-item key="task">新建任务</a-menu-item>
            <a-menu-item key="asset">新建资产</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<style scoped>
.pc-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  width: 100%;
}

.pc-header__info {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex: 0 0 auto;
}

.pc-header__project {
  color: var(--color-text-primary);
  font-size: var(--font-size-16);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}

.pc-header__episode {
  width: 120px;
}

.pc-header__search {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.pc-header__field {
  width: 96px;
  flex: 0 0 auto;
}

.pc-header__keyword {
  max-width: 320px;
}

.pc-header__count {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-12);
  white-space: nowrap;
}

.pc-header__actions {
  flex: 0 0 auto;
  margin-left: auto;
}
</style>