import type {
  DemoReviewAnnotationShape,
  DemoReviewAnnotationSnapshot,
  DemoReviewClip,
  DemoReviewComment,
  DemoReviewTimeline,
} from '@/shared/mock/db';

/** 审片时间线 / 剪辑 / 评论 / 圈注（存储形状复用 db 定义） */
export type ReviewTimeline = DemoReviewTimeline;
export type ReviewClip = DemoReviewClip;
export type ReviewComment = DemoReviewComment;
export type ReviewAnnotationShape = DemoReviewAnnotationShape;
export type ReviewAnnotationSnapshot = DemoReviewAnnotationSnapshot;

/** 审片状态 */
export type ReviewStatus = DemoReviewTimeline['status'];

/** 侧栏资产 Tab（对齐 KK：镜头/剧本/数字资产） */
export type ReviewAssetTab = 'shot' | 'script' | 'digital';

/** 圈注工具（对齐 KK：画笔/矩形/箭头/文字/橡皮） */
export type ReviewDrawTool = 'pen' | 'rect' | 'arrow' | 'text' | 'eraser';

/** 时间显示模式（对齐 KK：秒/时间码/帧） */
export type ReviewTimeDisplayMode = 'seconds' | 'timecode' | 'frames';

/** 镜头颜色分类 / 评级 */
export type ReviewShotColorKey = 'red' | 'yellow' | 'green' | 'blue' | 'gray';
export type ReviewShotRating = 'S' | 'A' | 'B' | 'C' | 'N';

/** 侧栏资源项（对齐 KK ReviewSidebarResourceItem） */
export interface ReviewSidebarResourceItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  code?: string | null;
  kind?: ReviewAssetTab;
  /** 虚拟时间轴秒数（点击 seek 定位） */
  timeSeconds?: number;
  endSeconds?: number;
  thumbnailUrl?: string | null;
  colorCategory?: ReviewShotColorKey | null;
  rating?: ReviewShotRating | null;
  directorComments?: string | null;
  scriptContent?: string | null;
  /** 镜头详情字段 */
  detail?: {
    code: string;
    timeRange: string;
    fileName: string;
    frameLength: string;
    startFrame: string;
    endFrame: string;
  };
}

/** 视频画面上的评论标记（对齐 KK ReviewCommentMarker） */
export interface ReviewCommentMarker {
  comment: ReviewComment;
  index: number;
  timecode: string;
  left: number;
  align: 'left' | 'center' | 'right';
}

/** 正在绘制中的临时图形 */
export interface ReviewDrawingShape {
  type: 'line' | 'rect' | 'arrow';
  config: Record<string, unknown>;
}

/** 圈注快照来源（draft=当前草稿，comment=某条评论） */
export interface VisibleAnnotationSource {
  kind: 'draft' | 'comment';
  time: number;
}
