<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { DownOutlined, SendOutlined, SmileOutlined, UpOutlined } from '@ant-design/icons-vue';
import { formatReviewTimecode } from '../contracts';
import { REVIEW_QUICK_EMOJIS } from '../constants';
import type { ReviewRoomPageContext } from '../review-room/useReviewRoomPage';

defineOptions({ name: 'ReviewRoomCommentComposer' });

const props = defineProps<{
  ctx: ReviewRoomPageContext;
}>();

const content = ref('');
const collapsed = ref(false);
const emojiOpen = ref(false);

/** 有内容时自动展开（对齐 KK） */
watch(content, (value) => {
  if (value.trim()) collapsed.value = false;
});

/** 当前帧时间码（评论将绑定的时间，对齐 KK displayTimecode） */
const displayTimecode = computed(() => formatReviewTimecode(props.ctx.playback.playbackSeconds));

/** @ 人员 + # 分类合并候选（antdv Mentions 双 prefix 共用同一 options） */
const mentionOptions = computed(() => [
  ...props.ctx.comments.mentionUserOptions,
  ...props.ctx.comments.mentionCategoryOptions,
]);

async function submit(): Promise<void> {
  const ok = await props.ctx.comments.submitComment(content.value);
  if (ok) content.value = '';
}

function insertEmoji(emoji: string): void {
  content.value += emoji;
  emojiOpen.value = false;
}
</script>

<template>
  <div class="rr__composer" :class="{ 'rr__composer--collapsed': collapsed }">
    <button type="button" class="rr__composer-collapse" @click="collapsed = !collapsed">
      <span>{{ collapsed ? '写评论' : '收起评论框' }}</span>
      <UpOutlined v-if="!collapsed" />
      <DownOutlined v-else />
    </button>

    <div v-if="!collapsed" class="rr__composer-body">
      <div class="rr__composer-meta">
        <span class="rr__composer-meta-label">当前帧</span>
        <span class="rr__timecode--compact">{{ displayTimecode }}</span>
      </div>

      <a-mentions
        v-model:value="content"
        class="rr__comment-textarea"
        :rows="3"
        :maxlength="500"
        placeholder="输入审片意见，@ 提及同事，# 标记问题分类"
        :prefix="['@', '#']"
        :options="mentionOptions"
        @keydown.ctrl.enter.prevent="submit"
      >
        <template #notFoundContent>
          <span>无匹配</span>
        </template>
      </a-mentions>

      <div class="rr__composer-footer">
        <a-popover v-model:open="emojiOpen" trigger="click" placement="topRight">
          <template #content>
            <div class="rr__emoji-popover">
              <button
                v-for="emoji in REVIEW_QUICK_EMOJIS"
                :key="emoji"
                type="button"
                class="rr__emoji-btn"
                @click="insertEmoji(emoji)"
              >
                {{ emoji }}
              </button>
            </div>
          </template>
          <button type="button" class="rr__composer-emoji">
            <SmileOutlined />
          </button>
        </a-popover>
        <a-button
          type="primary"
          size="small"
          class="rr__submit-comment"
          :loading="ctx.comments.submitting"
          :disabled="!content.trim()"
          @click="submit"
        >
          <template #icon><SendOutlined /></template>
          发布
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rr__composer {
  flex: 0 0 auto;
  border-top: 1px solid var(--color-border-default);
  background: var(--component-card-background);
}

.rr__composer-collapse {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-3);
  border: 0;
  background: transparent;
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.rr__composer-collapse:hover {
  color: var(--color-action-primary);
}

.rr__composer-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: 0 var(--spacing-3) var(--spacing-3);
}

.rr__composer-meta {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.rr__composer-meta-label {
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
}

.rr__timecode--compact {
  padding: 1px 8px;
  border-radius: var(--radius-full);
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
  font-size: 11px;
  font-family: 'SF Mono', Consolas, monospace;
}

.rr__composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rr__composer-emoji {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 15px;
  cursor: pointer;
}

.rr__composer-emoji:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.rr__emoji-popover {
  display: grid;
  grid-template-columns: repeat(4, 32px);
  gap: 4px;
}

.rr__emoji-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.rr__emoji-btn:hover {
  background: var(--color-bg-hover);
}
</style>
