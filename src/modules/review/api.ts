import { readDB, writeDB, type DemoReviewComment, type DemoReviewTimeline } from '@/shared/mock/db';
import type { ReviewAnnotationSnapshot, ReviewShotColorKey, ReviewShotRating } from './types';

/**
 * 审片室 API 契约层（Mock 实现）
 * 数据源 = db.reviewTimelines / db.reviewShotFields；未来接真实后端只替换本层。
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timelineOf(timelineId: string): DemoReviewTimeline | null {
  return readDB().reviewTimelines.find((item) => item.id === timelineId) ?? null;
}

/** 项目时间线列表（不含评论，首屏队列用） */
export async function fetchReviewTimelines(
  projectId: string
): Promise<Omit<DemoReviewTimeline, 'comments'>[]> {
  await delay(180);
  return readDB()
    .reviewTimelines.filter((item) => item.projectId === projectId)
    .map(({ comments: _comments, ...rest }) => rest);
}

/** 时间线详情（含评论树） */
export async function fetchReviewTimelineDetail(timelineId: string): Promise<DemoReviewTimeline | null> {
  await delay(200);
  const timeline = timelineOf(timelineId);
  if (!timeline) return null;
  const detail = JSON.parse(JSON.stringify(timeline)) as DemoReviewTimeline;
  // 镜头段与侧栏镜头卡片对位：useProductionShots 时从制作工坊任务的镜头段时间码生成
  if (detail.useProductionShots) {
    const tasks = readDB().production[detail.projectId]?.tasks ?? [];
    const shotClips = tasks
      .filter((task) => task.clipStartSec !== undefined && task.clipEndSec !== undefined)
      .sort((a, b) => (a.clipStartSec ?? 0) - (b.clipStartSec ?? 0))
      .map((task) => ({
        id: `clip-${task.id}`,
        // 镜头段只标镜头号，不拼接工序阶段名
        label: task.code ?? task.id,
        startSec: task.clipStartSec as number,
        endSec: task.clipEndSec as number,
      }));
    if (shotClips.length > 0) detail.clips = shotClips;
  }
  return detail;
}

export interface ReviewCommentCreateInput {
  timelineId: string;
  authorId: string;
  content: string;
  mentionUserIds: string[];
  timeSeconds: number;
  annotations: ReviewAnnotationSnapshot | null;
  screenshotDataUrl: string | null;
  parentId?: string | null;
}

function appendComment(
  comments: DemoReviewComment[],
  comment: DemoReviewComment,
  parentId?: string | null
): boolean {
  if (!parentId) {
    comments.push(comment);
    return true;
  }
  for (const item of comments) {
    if (item.id === parentId) {
      item.replies.push(comment);
      return true;
    }
    if (appendComment(item.replies, comment, parentId)) return true;
  }
  return false;
}

/** 发布评论 / 回复 */
export async function createReviewComment(input: ReviewCommentCreateInput): Promise<DemoReviewComment> {
  await delay(160);
  const db = readDB();
  const timeline = db.reviewTimelines.find((item) => item.id === input.timelineId);
  if (!timeline) throw new Error('timeline not found');
  const comment: DemoReviewComment = {
    id: `rc-${Date.now()}`,
    authorId: input.authorId,
    content: input.content,
    mentionUserIds: input.mentionUserIds,
    createdAt: new Date().toISOString(),
    timeSeconds: input.timeSeconds,
    annotations: input.annotations,
    screenshotDataUrl: input.screenshotDataUrl,
    resolvedAt: null,
    replies: [],
    reactions: {},
  };
  appendComment(timeline.comments, comment, input.parentId);
  writeDB(db);
  return comment;
}

function findComment(
  comments: DemoReviewComment[],
  commentId: string
): { comment: DemoReviewComment; siblings: DemoReviewComment[] } | null {
  for (let i = 0; i < comments.length; i += 1) {
    const item = comments[i];
    if (item.id === commentId) return { comment: item, siblings: comments };
    const found = findComment(item.replies, commentId);
    if (found) return found;
  }
  return null;
}

/** 编辑评论内容 */
export async function updateReviewComment(
  timelineId: string,
  commentId: string,
  content: string,
  mentionUserIds: string[]
): Promise<void> {
  await delay(140);
  const db = readDB();
  const timeline = db.reviewTimelines.find((item) => item.id === timelineId);
  const found = timeline ? findComment(timeline.comments, commentId) : null;
  if (found) {
    found.comment.content = content;
    found.comment.mentionUserIds = mentionUserIds;
    writeDB(db);
  }
}

/** 删除评论（含其子回复） */
export async function deleteReviewComment(timelineId: string, commentId: string): Promise<void> {
  await delay(140);
  const db = readDB();
  const timeline = db.reviewTimelines.find((item) => item.id === timelineId);
  const found = timeline ? findComment(timeline.comments, commentId) : null;
  if (found) {
    const index = found.siblings.findIndex((item) => item.id === commentId);
    if (index >= 0) found.siblings.splice(index, 1);
    writeDB(db);
  }
}

/** 切换已处理状态 */
export async function toggleResolveReviewComment(
  timelineId: string,
  commentId: string
): Promise<void> {
  await delay(120);
  const db = readDB();
  const timeline = db.reviewTimelines.find((item) => item.id === timelineId);
  const found = timeline ? findComment(timeline.comments, commentId) : null;
  if (found) {
    found.comment.resolvedAt = found.comment.resolvedAt ? null : new Date().toISOString();
    writeDB(db);
  }
}

/** 表情 reaction（再投一次累加） */
export async function addReviewCommentReaction(
  timelineId: string,
  commentId: string,
  emoji: string
): Promise<void> {
  await delay(100);
  const db = readDB();
  const timeline = db.reviewTimelines.find((item) => item.id === timelineId);
  const found = timeline ? findComment(timeline.comments, commentId) : null;
  if (found) {
    found.comment.reactions[emoji] = (found.comment.reactions[emoji] ?? 0) + 1;
    writeDB(db);
  }
}

/** 更新镜头审片字段（颜色分类 / 评级） */
export async function updateReviewShotFields(
  shotId: string,
  patch: { colorCategory?: ReviewShotColorKey | null; rating?: ReviewShotRating | null }
): Promise<void> {
  await delay(120);
  const db = readDB();
  const current = db.reviewShotFields[shotId] ?? { colorCategory: null, rating: null, directorComments: '' };
  db.reviewShotFields[shotId] = {
    ...current,
    colorCategory: patch.colorCategory !== undefined ? patch.colorCategory : current.colorCategory,
    rating: patch.rating !== undefined ? patch.rating : current.rating,
  };
  writeDB(db);
}
