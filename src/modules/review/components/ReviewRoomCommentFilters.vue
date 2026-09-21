<script setup lang="ts">
import { computed } from 'vue';
import { ClearOutlined, FilterOutlined } from '@ant-design/icons-vue';
import type { ReviewRoomPageContext } from '../review-room/useReviewRoomPage';
import { REVIEW_COMMENT_TIME_FILTERS } from '../constants';

defineOptions({ name: 'ReviewRoomCommentFilters' });

const props = defineProps<{
  ctx: ReviewRoomPageContext;
}>();

const comments = computed(() => props.ctx.comments);

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'unresolved', label: '未处理' },
  { value: 'resolved', label: '已处理' },
];
</script>

<template>
  <a-popover trigger="click" placement="bottomRight">
    <template #content>
      <div class="rr__comment-filter-panel">
        <div class="rr__comment-filter-head">
          <span>筛选评论</span>
          <a-button type="link" size="small" :disabled="!comments.hasActiveFilter" @click="comments.clearFilters">
            <template #icon><ClearOutlined /></template>
            清除
          </a-button>
        </div>
        <div class="rr__comment-filter-field">
          <label>人员姓名</label>
          <select v-model="comments.filterAuthor" class="rr__comment-filter-select">
            <option value="">全部人员</option>
            <option v-for="option in comments.authorOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="rr__comment-filter-field">
          <label>审核状态</label>
          <select v-model="comments.filterStatus" class="rr__comment-filter-select">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
        <div class="rr__comment-filter-field">
          <label>评论时间</label>
          <select v-model="comments.filterTime" class="rr__comment-filter-select">
            <option v-for="option in REVIEW_COMMENT_TIME_FILTERS" :key="option.key" :value="option.key">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </template>
    <a-button size="small" :type="comments.hasActiveFilter ? 'primary' : 'default'">
      <template #icon><FilterOutlined /></template>
      筛选
    </a-button>
  </a-popover>
</template>

<style scoped>
.rr__comment-filter-panel {
  width: 240px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.rr__comment-filter-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-13);
  font-weight: 600;
  color: var(--color-text-primary);
}

.rr__comment-filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rr__comment-filter-field label {
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.rr__comment-filter-select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-2);
  background: var(--component-card-background);
  color: var(--color-text-primary);
  font-size: var(--font-size-13);
  outline: none;
}

.rr__comment-filter-select:focus {
  border-color: var(--color-action-primary);
}
</style>
