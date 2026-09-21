<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Modal } from 'ant-design-vue';
import {
  CheckOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  HighlightOutlined,
  SmileOutlined,
} from '@ant-design/icons-vue';
import { resolveStaffColor, resolveStaffName } from '@/modules/staff/api';
import { commentTimecode } from '../contracts';
import { REVIEW_QUICK_EMOJIS } from '../constants';
import type { ReviewRoomPageContext } from '../review-room/useReviewRoomPage';
import type { ReviewComment } from '../types';

defineOptions({ name: 'ReviewRoomCommentList' });

const props = defineProps<{
  ctx: ReviewRoomPageContext;
}>();

const comments = computed(() => props.ctx.comments.filteredComments);

/** 编辑态 */
const editingId = ref('');
const editingContent = ref('');

function startEdit(comment: ReviewComment): void {
  editingId.value = comment.id;
  editingContent.value = comment.content;
}

async function saveEdit(comment: ReviewComment): Promise<void> {
  await props.ctx.comments.editComment(comment.id, editingContent.value.trim());
  editingId.value = '';
}

function confirmDelete(comment: ReviewComment): void {
  Modal.confirm({
    title: '确认删除该评论？',
    content: '删除后不可恢复，其回复将一并删除。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => props.ctx.comments.removeComment(comment.id),
  });
}

/** 回复展开态 */
const replyOpenMap = reactive<Record<string, boolean>>({});
const replyDraftMap = reactive<Record<string, string>>({});

function toggleReplies(comment: ReviewComment): void {
  replyOpenMap[comment.id] = !replyOpenMap[comment.id];
}

async function submitReply(comment: ReviewComment): Promise<void> {
  const draft = (replyDraftMap[comment.id] ?? '').trim();
  if (!draft) return;
  const ok = await props.ctx.comments.submitComment(draft, comment.id);
  if (ok) {
    replyDraftMap[comment.id] = '';
    replyOpenMap[comment.id] = true;
  }
}

/** 表情 popover 展开态 */
const emojiOpenFor = ref('');

function formatTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function authorColor(authorId: string): string {
  return resolveStaffColor(authorId);
}

function authorInitial(authorId: string): string {
  return resolveStaffName(authorId).slice(0, 1);
}

function reactionEntries(comment: ReviewComment): { emoji: string; count: number }[] {
  return Object.entries(comment.reactions)
    .filter(([, count]) => count > 0)
    .map(([emoji, count]) => ({ emoji, count }));
}
</script>

<template>
  <div class="rr__comment-list">
    <template v-if="comments.length > 0">
      <article
        v-for="(comment, index) in comments"
        :key="comment.id"
        class="rr__comment-card"
        :class="{ 'rr__comment-card--resolved': Boolean(comment.resolvedAt) }"
        role="button"
        tabindex="0"
        @click="ctx.seekToComment(comment, index)"
      >
        <!-- 头行 -->
        <div class="rr__comment-card-head">
          <span class="rr__avatar" :style="{ background: authorColor(comment.authorId) }">
            {{ authorInitial(comment.authorId) }}
          </span>
          <div class="rr__comment-author-row">
            <strong>{{ resolveStaffName(comment.authorId) }}</strong>
            <span>{{ formatTime(comment.createdAt) }}</span>
          </div>
          <div class="rr__comment-head-right">
            <button
              type="button"
              class="rr__comment-time"
              title="跳转到该评论时间"
              @click.stop="ctx.seekToComment(comment, index)"
            >
              {{ commentTimecode(comment, index) }}
            </button>
            <a-tooltip v-if="comment.annotations && comment.annotations.shapes.length > 0" title="该评论包含涂鸦标注">
              <span class="rr__annotation-badge"><HighlightOutlined /></span>
            </a-tooltip>
            <a-tooltip :title="comment.resolvedAt ? '取消已处理' : '标记已处理'">
              <button
                type="button"
                class="rr__comment-action"
                :class="{ 'rr__comment-action--resolved': Boolean(comment.resolvedAt) }"
                @click.stop="ctx.comments.toggleResolve(comment.id)"
              >
                <CheckOutlined />
              </button>
            </a-tooltip>
            <a-tooltip title="编辑">
              <button type="button" class="rr__comment-action" @click.stop="startEdit(comment)">
                <EditOutlined />
              </button>
            </a-tooltip>
            <a-tooltip title="删除">
              <button type="button" class="rr__comment-action" @click.stop="confirmDelete(comment)">
                <DeleteOutlined />
              </button>
            </a-tooltip>
          </div>
        </div>

        <!-- 圈注截图 -->
        <a-image
          v-if="comment.screenshotDataUrl"
          :src="comment.screenshotDataUrl"
          class="rr__comment-screenshot"
        />

        <!-- 正文 -->
        <div v-if="editingId === comment.id" class="rr__comment-editor" @click.stop>
          <a-textarea v-model:value="editingContent" :rows="2" :maxlength="500" />
          <div class="rr__comment-editor-actions">
            <a-button size="small" @click="editingId = ''">取消</a-button>
            <a-button size="small" type="primary" @click="saveEdit(comment)">保存</a-button>
          </div>
        </div>
        <div v-else class="rr__comment-summary">
          <p class="rr__comment-text">{{ comment.content }}</p>
          <div class="rr__comment-inline-actions">
            <a-tooltip title="回复">
              <button type="button" class="rr__comment-action" @click.stop="toggleReplies(comment)">
                <CommentOutlined />
              </button>
            </a-tooltip>
            <a-popover
              :open="emojiOpenFor === comment.id"
              trigger="click"
              placement="bottomRight"
              @update:open="(open: boolean) => (emojiOpenFor = open ? comment.id : '')"
            >
              <template #content>
                <div class="rr__emoji-popover">
                  <button
                    v-for="emoji in REVIEW_QUICK_EMOJIS"
                    :key="emoji"
                    type="button"
                    class="rr__emoji-btn"
                    @click.stop="ctx.comments.addReaction(comment.id, emoji); emojiOpenFor = ''"
                  >
                    {{ emoji }}
                  </button>
                </div>
              </template>
              <button type="button" class="rr__comment-action" @click.stop>
                <SmileOutlined />
              </button>
            </a-popover>
          </div>
        </div>

        <!-- reaction 行 -->
        <div v-if="reactionEntries(comment).length > 0" class="rr__comment-reaction-row">
          <button
            v-for="entry in reactionEntries(comment)"
            :key="entry.emoji"
            type="button"
            class="rr__reaction-chip"
            @click.stop="ctx.comments.addReaction(comment.id, entry.emoji)"
          >
            {{ entry.emoji }} {{ entry.count }}
          </button>
        </div>

        <!-- 回复 -->
        <button
          v-if="comment.replies.length > 0"
          type="button"
          class="rr__reply-toggle"
          @click.stop="toggleReplies(comment)"
        >
          {{ replyOpenMap[comment.id] ? '收起回复' : `展开 ${comment.replies.length} 条回复` }}
        </button>
        <div v-if="replyOpenMap[comment.id]" class="rr__reply-list" @click.stop>
          <div v-for="reply in comment.replies" :key="reply.id" class="rr__reply-item">
            <span class="rr__avatar rr__avatar--small" :style="{ background: authorColor(reply.authorId) }">
              {{ authorInitial(reply.authorId) }}
            </span>
            <div class="rr__reply-item-body">
              <div class="rr__reply-item-head">
                <strong>{{ resolveStaffName(reply.authorId) }}</strong>
                <span>{{ formatTime(reply.createdAt) }}</span>
              </div>
              <p>{{ reply.content }}</p>
            </div>
          </div>
          <div class="rr__reply-box">
            <a-mentions
              v-model:value="replyDraftMap[comment.id]"
              :rows="2"
              :maxlength="300"
              placeholder="请输入评论..."
              :options="ctx.comments.mentionUserOptions"
              @keydown.ctrl.enter.prevent="submitReply(comment)"
            />
            <div class="rr__reply-box-actions">
              <a-button
                size="small"
                type="primary"
                :disabled="!(replyDraftMap[comment.id] ?? '').trim()"
                @click="submitReply(comment)"
              >
                发送
              </a-button>
            </div>
          </div>
        </div>
      </article>
    </template>
    <a-empty
      v-else
      :description="ctx.comments.hasActiveFilter ? '暂无符合筛选条件的评论。' : '暂无评论，添加第一条审片意见。'"
      :image-style="{ height: '80px' }"
      class="rr__comment-empty"
    />
  </div>
</template>

<style scoped>
.rr__comment-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
}

.rr__comment-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-4);
  background: var(--component-card-background);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.rr__comment-card:hover {
  border-color: var(--color-action-primary);
}

.rr__comment-card--resolved {
  opacity: 0.62;
}

.rr__comment-card-head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--spacing-2);
}

.rr__avatar {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: #fff;
  font-size: var(--font-size-12);
  font-weight: 600;
  flex-shrink: 0;
}

.rr__avatar--small {
  width: 22px;
  height: 22px;
  font-size: 11px;
}

.rr__comment-author-row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  min-width: 0;
}

.rr__comment-author-row strong {
  font-size: var(--font-size-13);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rr__comment-author-row span {
  font-size: var(--font-size-12);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.rr__comment-head-right {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.rr__comment-time {
  padding: 1px 6px;
  border: 0;
  border-radius: var(--radius-full);
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
  font-size: 11px;
  font-family: 'SF Mono', Consolas, monospace;
  cursor: pointer;
}

.rr__annotation-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: var(--color-feedback-warning);
  font-size: 13px;
}

.rr__comment-action {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-2);
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.rr__comment-action:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.rr__comment-action--resolved {
  color: var(--color-feedback-success);
}

.rr__comment-screenshot {
  width: 128px;
  border-radius: var(--radius-2);
  border: 1px solid var(--color-border-default);
}

.rr__comment-screenshot :deep(img) {
  border-radius: var(--radius-2);
}

.rr__comment-editor {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.rr__comment-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
}

.rr__comment-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-2);
}

.rr__comment-text {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-13);
  color: var(--color-text-primary);
  line-height: 1.6;
  word-break: break-word;
}

.rr__comment-inline-actions {
  display: inline-flex;
  gap: 2px;
  flex-shrink: 0;
}

.rr__comment-reaction-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rr__reaction-chip {
  padding: 1px 8px;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-full);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
}

.rr__reaction-chip:hover {
  border-color: var(--color-action-primary);
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

.rr__reply-toggle {
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-action-primary);
  font-size: var(--font-size-12);
  cursor: pointer;
}

.rr__reply-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  border-radius: var(--radius-3);
  background: var(--color-bg-hover);
}

.rr__reply-item {
  display: flex;
  gap: var(--spacing-2);
}

.rr__reply-item-body {
  flex: 1;
  min-width: 0;
}

.rr__reply-item-head {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
}

.rr__reply-item-head strong {
  font-size: var(--font-size-12);
  color: var(--color-text-primary);
}

.rr__reply-item-head span {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.rr__reply-item-body p {
  margin: 2px 0 0;
  font-size: var(--font-size-12);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.rr__reply-box {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.rr__reply-box-actions {
  display: flex;
  justify-content: flex-end;
}

.rr__comment-empty {
  margin: auto;
}
</style>
