<script setup lang="ts">
import ReviewRoomCommentFilters from './ReviewRoomCommentFilters.vue';
import ReviewRoomCommentList from './ReviewRoomCommentList.vue';
import ReviewRoomCommentComposer from './ReviewRoomCommentComposer.vue';
import type { ReviewRoomPageContext } from '../review-room/useReviewRoomPage';

defineOptions({ name: 'ReviewRoomCommentsPanel' });

defineProps<{
  ctx: ReviewRoomPageContext;
}>();
</script>

<template>
  <aside class="rr__comments">
    <div class="rr__comments-head">
      <div class="rr__panel-tabs">
        <span class="rr__panel-tab rr__panel-tab--active">评论</span>
      </div>
      <ReviewRoomCommentFilters :ctx="ctx" />
    </div>
    <ReviewRoomCommentList :ctx="ctx" />
    <ReviewRoomCommentComposer :ctx="ctx" />
  </aside>
</template>

<style scoped>
.rr__comments {
  grid-area: comments;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-5);
  background: var(--component-panel-background);
  overflow: hidden;
  container-type: inline-size;
}

.rr__comments-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-3) 0;
}

.rr__panel-tabs {
  display: flex;
  gap: var(--spacing-4);
  border-bottom: 1px solid var(--color-border-divider);
  flex: 1;
}

.rr__panel-tab {
  position: relative;
  padding: var(--spacing-1) 0 var(--spacing-2);
  font-size: var(--font-size-13);
  color: var(--color-text-secondary);
}

.rr__panel-tab--active {
  color: var(--color-action-primary);
  font-weight: 600;
}

.rr__panel-tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: var(--radius-full);
  background: var(--color-action-primary);
}
</style>
