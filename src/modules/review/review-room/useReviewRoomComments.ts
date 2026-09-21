import { computed, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { readStaffList, resolveStaffName } from '@/modules/staff/api';
import {
  addReviewCommentReaction,
  createReviewComment,
  deleteReviewComment,
  toggleResolveReviewComment,
  updateReviewComment,
} from '../api';
import type { ReviewAnnotationSnapshot, ReviewComment, ReviewTimeline } from '../types';
import type { ReviewCommentTimeFilter } from '../constants';

/**
 * 评论编排（对齐 KK useReviewRoomComments + useReviewRoomCommentFilters）：
 * 发布（携带圈注快照+帧截图）/编辑/删除/已处理/表情/回复 + 三维筛选 + @人候选。
 */
export function useReviewRoomComments(options: {
  timeline: () => ReviewTimeline | null;
  currentTime: () => number;
  currentUserId: () => string;
  createAnnotationSnapshot: () => ReviewAnnotationSnapshot;
  hasAnnotations: () => boolean;
  createAnnotatedFrameDataUrl: () => Promise<string | null>;
  clearAnnotations: () => void;
  onChanged: () => Promise<void>;
}) {
  const submitting = ref(false);

  /** ---------- 筛选（对齐 KK ReviewRoomCommentFilters） ---------- */
  const filterAuthor = ref('');
  const filterStatus = ref<'all' | 'unresolved' | 'resolved'>('all');
  const filterTime = ref<ReviewCommentTimeFilter>('all');

  const authorOptions = computed(() => {
    const timeline = options.timeline();
    if (!timeline) return [];
    const ids = new Set<string>();
    const collect = (comments: ReviewComment[]): void => {
      comments.forEach((comment) => {
        ids.add(comment.authorId);
        collect(comment.replies);
      });
    };
    collect(timeline.comments);
    return [...ids].map((id) => ({ value: id, label: resolveStaffName(id) }));
  });

  function matchTimeFilter(createdAt: string): boolean {
    if (filterTime.value === 'all') return true;
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    if (filterTime.value === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return created >= today.getTime();
    }
    if (filterTime.value === 'week') return created >= now - 7 * 86400_000;
    return created >= now - 30 * 86400_000;
  }

  const filteredComments = computed<ReviewComment[]>(() => {
    const timeline = options.timeline();
    if (!timeline) return [];
    return timeline.comments.filter((comment) => {
      if (filterAuthor.value && comment.authorId !== filterAuthor.value) return false;
      if (filterStatus.value === 'resolved' && !comment.resolvedAt) return false;
      if (filterStatus.value === 'unresolved' && comment.resolvedAt) return false;
      return matchTimeFilter(comment.createdAt);
    });
  });

  const hasActiveFilter = computed(
    () =>
      filterAuthor.value !== '' || filterStatus.value !== 'all' || filterTime.value !== 'all'
  );

  function clearFilters(): void {
    filterAuthor.value = '';
    filterStatus.value = 'all';
    filterTime.value = 'all';
  }

  /** ---------- 提及候选（@ 在职人员 / # 问题分类） ---------- */
  const mentionUserOptions = computed(() =>
    readStaffList()
      .filter((user) => user.employmentStatus === 'active')
      .map((user) => ({ value: user.name, label: `${user.name}（${user.roleLabel}）`, id: user.id }))
  );

  /** # 问题分类（对齐 KK 描述分类，静态 AIGC 审片维度） */
  const mentionCategoryOptions = ['表演', '画面构图', '色彩', '节奏', '口型', '细节'].map((name) => ({
    value: name,
    label: name,
  }));

  function extractMentionUserIds(content: string): string[] {
    return readStaffList()
      .filter((user) => content.includes(`@${user.name}`))
      .map((user) => user.id);
  }

  /** ---------- 发布 ---------- */
  async function submitComment(content: string, parentId: string | null = null): Promise<boolean> {
    const timeline = options.timeline();
    const trimmed = content.trim();
    if (!timeline || !trimmed || submitting.value) return false;
    submitting.value = true;
    try {
      const hasAnnotations = options.hasAnnotations() && !parentId;
      const snapshot = hasAnnotations ? options.createAnnotationSnapshot() : null;
      const screenshot = hasAnnotations ? await options.createAnnotatedFrameDataUrl() : null;
      await createReviewComment({
        timelineId: timeline.id,
        authorId: options.currentUserId(),
        content: trimmed,
        mentionUserIds: extractMentionUserIds(trimmed),
        timeSeconds: options.currentTime(),
        annotations: snapshot && snapshot.shapes.length > 0 ? snapshot : null,
        screenshotDataUrl: screenshot,
        parentId,
      });
      if (hasAnnotations) options.clearAnnotations();
      await options.onChanged();
      message.success(parentId ? '回复已发送' : '评论已发布');
      return true;
    } catch (error) {
      console.error('submit comment failed', error);
      message.error('评论发布失败，请重试');
      return false;
    } finally {
      submitting.value = false;
    }
  }

  /** ---------- 行内操作 ---------- */
  async function editComment(commentId: string, content: string): Promise<void> {
    const timeline = options.timeline();
    if (!timeline) return;
    await updateReviewComment(timeline.id, commentId, content, extractMentionUserIds(content));
    await options.onChanged();
    message.success('评论已更新');
  }

  async function removeComment(commentId: string): Promise<void> {
    const timeline = options.timeline();
    if (!timeline) return;
    await deleteReviewComment(timeline.id, commentId);
    await options.onChanged();
    message.success('评论已删除');
  }

  async function toggleResolve(commentId: string): Promise<void> {
    const timeline = options.timeline();
    if (!timeline) return;
    await toggleResolveReviewComment(timeline.id, commentId);
    await options.onChanged();
  }

  async function addReaction(commentId: string, emoji: string): Promise<void> {
    const timeline = options.timeline();
    if (!timeline) return;
    await addReviewCommentReaction(timeline.id, commentId, emoji);
    await options.onChanged();
  }

  return reactive({
    submitting,
    filterAuthor,
    filterStatus,
    filterTime,
    authorOptions,
    filteredComments,
    hasActiveFilter,
    clearFilters,
    mentionUserOptions,
    mentionCategoryOptions,
    submitComment,
    editComment,
    removeComment,
    toggleResolve,
    addReaction,
  });
}

export type ReviewRoomCommentsContext = ReturnType<typeof useReviewRoomComments>;
