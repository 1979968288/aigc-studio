<script setup lang="ts">
import { CloseOutlined } from '@ant-design/icons-vue';
import DashboardEmptyState from './DashboardEmptyState.vue';
import type { DashboardShortcutItem } from '../types';

defineProps<{
  loading: boolean;
  shortcutItems: DashboardShortcutItem[];
}>();

const emit = defineEmits<{
  (event: 'open-shortcut', route: string): void;
  (event: 'remove-shortcut', id: string): void;
}>();

const TITLE_CHAR_LIMIT = 8;

function truncateTitleText(text: string) {
  const chars = Array.from(text.trim());
  return chars.length > TITLE_CHAR_LIMIT
    ? `${chars.slice(0, TITLE_CHAR_LIMIT).join('')}...`
    : chars.join('');
}
</script>

<script lang="ts">
export default { name: 'DashboardShortcutCard' };
</script>

<template>
  <a-spin :spinning="loading" wrapper-class-name="db1-spin">
    <div v-if="shortcutItems.length > 0" class="db1-shortcut-list">
      <button
        v-for="item in shortcutItems"
        :key="item.id"
        type="button"
        class="db1-shortcut-item"
        @click.stop="emit('open-shortcut', item.route)"
      >
        <span class="db1-shortcut-item__content">
          <span class="db1-shortcut-item__title">
            <span class="db1-shortcut-item__title-main">{{ truncateTitleText(item.label) }}</span>
          </span>
        </span>
        <span
          class="db1-shortcut-item__remove"
          role="button"
          tabindex="0"
          aria-label="取消收藏"
          title="取消收藏"
          @click.stop="emit('remove-shortcut', item.id)"
          @keydown.enter.stop.prevent="emit('remove-shortcut', item.id)"
        >
          <CloseOutlined />
        </span>
      </button>
    </div>
    <DashboardEmptyState
      v-else
      title="暂无收藏"
      description="收藏的工作台入口会显示在这里，方便你快速返回常用页面。"
    />
  </a-spin>
</template>
