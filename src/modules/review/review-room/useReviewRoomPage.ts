import { computed, nextTick, onActivated, onDeactivated, reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { fetchProduction } from '@/modules/production/api';
import { readDB } from '@/shared/mock/db';
import { useAuthStore } from '@/stores/auth';
import {
  fetchReviewTimelineDetail,
  fetchReviewTimelines,
  updateReviewShotFields,
} from '../api';
import { activeClipOf, createCommentMarkers, formatReviewSeconds } from '../contracts';
import type {
  ReviewAssetTab,
  ReviewCommentMarker,
  ReviewShotColorKey,
  ReviewShotRating,
  ReviewSidebarResourceItem,
  ReviewTimeline,
} from '../types';
import { useReviewRoomAnnotations } from './useReviewRoomAnnotations';
import { useReviewRoomComments } from './useReviewRoomComments';
import { useReviewRoomPlayback } from './useReviewRoomPlayback';

/** 镜头缩略图（按镜头内容生成占位图） */
function shotThumbnail(code: string, sceneName: string): string {
  const prompt = encodeURIComponent(
    `cinematic film still frame, chinese fantasy style, ${sceneName || code}, moody lighting, high detail, movie production frame`
  );
  return `https://console.enterprise.trae.cn/api/ide/v1/text_to_image?prompt=${prompt}&image_size=landscape_16_9`;
}

/**
 * 审片室页面总编排（对齐 KK useReviewRoomPage）：
 * 时间线队列与选中、播放器/圈注/评论组合、侧栏资源、左右面板拖宽收起。
 */
export function useReviewRoomPage(projectId: string) {
  const authStore = useAuthStore();

  const loading = ref(true);
  const timelines = ref<Omit<ReviewTimeline, 'comments'>[]>([]);
  const selectedTimelineId = ref('');
  const selectedTimeline = ref<ReviewTimeline | null>(null);

  /** ---------- 播放 + 圈注 + 评论组合 ---------- */
  const playback = useReviewRoomPlayback({
    fallbackDuration: () => selectedTimeline.value?.videoDurationSec ?? 0,
    onTimeSync: (seconds) => annotations.syncAnnotationVisibilityForTime(seconds),
  });

  const annotations = useReviewRoomAnnotations({
    currentTime: () => playback.playbackSeconds,
  });

  /** 帧截图合成（视频当前帧 + Konva 层，本地 dataURL；overlay 需 await decode 再画） */
  async function createAnnotatedFrameDataUrl(): Promise<string | null> {
    const stageDataUrl = annotations.exportStageDataUrl();
    if (!stageDataUrl) return null;
    const container = playback.playerContainerRef;
    const video = container?.querySelector('video') ?? null;
    const { width, height } = annotations.stageConfig;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (video && video.videoWidth > 0) {
      const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
      const dw = video.videoWidth * scale;
      const dh = video.videoHeight * scale;
      try {
        ctx.drawImage(video, (width - dw) / 2, (height - dh) / 2, dw, dh);
      } catch {
        // 跨域等异常时仅输出圈注层
      }
    }
    const overlay = new Image();
    overlay.src = stageDataUrl;
    try {
      await overlay.decode();
      ctx.drawImage(overlay, 0, 0, width, height);
    } catch {
      // 解码失败时忽略，保留视频帧
    }
    return canvas.toDataURL('image/png');
  }

  const comments = useReviewRoomComments({
    timeline: () => selectedTimeline.value,
    currentTime: () => playback.playbackSeconds,
    currentUserId: () => authStore.currentUser?.id ?? 'u-producer',
    createAnnotationSnapshot: () => annotations.createDraftSnapshot(),
    /** 仅把「用户本次画的草稿」作为新评论圈注，评论恢复的圈注不误提交（Bug 2） */
    hasAnnotations: () =>
      annotations.hasDraftShapes && annotations.visibleAnnotation?.kind === 'draft',
    createAnnotatedFrameDataUrl,
    clearAnnotations: () => annotations.clearAnnotations(),
    onChanged: () => reloadDetail({ keepPlayback: true }),
  });

  /** ---------- 加载 ---------- */
  async function loadDetail(): Promise<void> {
    if (!selectedTimelineId.value) {
      selectedTimeline.value = null;
      return;
    }
    const detail = await fetchReviewTimelineDetail(selectedTimelineId.value);
    selectedTimeline.value = detail;
    playback.resetPlayback();
    annotations.resetAnnotations();
    if (detail?.videoUrl) {
      await nextTick();
      playback.initPlayer(detail.videoUrl);
    }
  }

  /** 评论变更后刷新（保持播放位置与圈注不清屏由调用方控制） */
  async function reloadDetail(options: { keepPlayback: boolean }): Promise<void> {
    if (!selectedTimelineId.value) return;
    const seconds = playback.playbackSeconds;
    const detail = await fetchReviewTimelineDetail(selectedTimelineId.value);
    selectedTimeline.value = detail;
    if (options.keepPlayback) playback.playbackSeconds = seconds;
  }

  async function load(): Promise<void> {
    loading.value = true;
    try {
      timelines.value = await fetchReviewTimelines(projectId);
      selectedTimelineId.value = timelines.value[0]?.id ?? '';
      await loadDetail();
    } catch (error) {
      console.error('load review room failed', error);
      message.error('审片室加载失败');
    } finally {
      loading.value = false;
    }
  }

  async function selectTimeline(id: string): Promise<void> {
    if (id === selectedTimelineId.value) return;
    selectedTimelineId.value = id;
    await loadDetail();
  }

  /** ---------- 顶栏上下文槽（对齐 KK topbarContextTarget） ----------
   * 审片对象选择器/状态 Teleport 到工作台第二行页面上下文槽，与面包屑层级同排；
   * 挂载时标记，卸载时清除，避免污染其他页面。
   */
  const topbarContextTarget = ref<HTMLElement | null>(null);
  const reviewTopbarSlotClass = 'workbench-header__page-context--review-room';

  /** 审片室为 keep-alive 页：首次挂载与切回标签都会触发 onActivated，切走时清除 */
  onActivated(() => {
    nextTick(() => {
      const target = document.querySelector<HTMLElement>('[data-workbench-topbar-page-context]');
      target?.classList.add(reviewTopbarSlotClass);
      topbarContextTarget.value = target;
    });
  });

  onDeactivated(() => {
    topbarContextTarget.value?.classList.remove(reviewTopbarSlotClass);
    topbarContextTarget.value = null;
  });

  /** ---------- 视频画面评论标记 ---------- */
  const commentMarkers = computed<ReviewCommentMarker[]>(() =>
    selectedTimeline.value
      ? createCommentMarkers(selectedTimeline.value.comments, playback.displayDuration)
      : []
  );

  /** 点击评论 / 标记：seek + 恢复圈注（对齐 KK seekToComment） */
  function seekToComment(comment: ReviewTimeline['comments'][number], index: number): void {
    const seconds = comment.timeSeconds ?? 16 + index * 8;
    playback.seekToSeconds(seconds);
    if (comment.annotations && comment.annotations.shapes.length > 0) {
      annotations.restoreSnapshot(comment.annotations, seconds);
    } else {
      annotations.clearAnnotations();
    }
  }

  /** ---------- 侧栏资源（镜头 = 工坊任务，剧本 = 工坊剧本） ---------- */
  const activeAssetTab = ref<ReviewAssetTab>('shot');
  const shotViewMode = ref<'card' | 'list'>('card');
  const shotColorFilter = ref<ReviewShotColorKey | null>(null);
  const shotKeyword = ref('');
  const sidebarLoading = ref(false);
  const shotResources = ref<ReviewSidebarResourceItem[]>([]);
  const scriptResources = ref<ReviewSidebarResourceItem[]>([]);
  const activeShotResourceId = ref('');
  const shotDetailCollapsed = ref(false);

  async function loadSidebarResources(): Promise<void> {
    sidebarLoading.value = true;
    try {
      const data = await fetchProduction(projectId);
      const shotFields = readDB().reviewShotFields;
      const sceneNameOf = new Map(data.scenes.map((scene) => [scene.id, scene.name]));
      shotResources.value = data.tasks.map((task, index) => {
        /** 镜头段时间码优先取任务字段（与时间轴段同源对位），缺省回退按序分散 */
        const timeSeconds = task.clipStartSec ?? 3 + index * 8;
        const endSeconds = task.clipEndSec ?? timeSeconds + 7;
        const fields = shotFields[task.id];
        const sceneName = sceneNameOf.get(task.sceneId) ?? '';
        return {
          id: task.id,
          title: task.code ?? task.id,
          subtitle: sceneName,
          meta: task.stage ?? '',
          code: task.code,
          kind: 'shot' as const,
          timeSeconds,
          endSeconds,
          thumbnailUrl: shotThumbnail(task.code ?? task.id, sceneName),
          colorCategory: fields?.colorCategory ?? null,
          rating: fields?.rating ?? null,
          directorComments: fields?.directorComments ?? '',
          detail: {
            code: task.code ?? task.id,
            /** 时间范围按真实秒数（1:1 时间轴）格式化 */
            timeRange: `${formatReviewSeconds(timeSeconds)}–${formatReviewSeconds(endSeconds)}`,
            fileName: `${(task.code ?? task.id).toLowerCase()}_take.mp4`,
            frameLength: `${Math.round((endSeconds - timeSeconds) * 24)} 帧`,
            startFrame: String(Math.round(timeSeconds * 24)),
            endFrame: String(Math.round(endSeconds * 24)),
          },
        };
      });
      scriptResources.value = data.scripts.flatMap((script) =>
        script.acts.flatMap((act) =>
          act.scenes.map((scene) => ({
            id: scene.id,
            title: scene.title,
            subtitle: `${script.name} · ${act.name}`,
            meta: `v${script.versionNo}`,
            kind: 'script' as const,
            scriptContent: scene.paragraphs.join(' '),
          }))
        )
      );
    } catch (error) {
      console.error('load review sidebar failed', error);
    } finally {
      sidebarLoading.value = false;
    }
  }

  const visibleShotResources = computed(() => {
    const kw = shotKeyword.value.trim().toLowerCase();
    return shotResources.value.filter((item) => {
      if (shotColorFilter.value && item.colorCategory !== shotColorFilter.value) return false;
      if (!kw) return true;
      return [item.title, item.subtitle, item.meta].join(' ').toLowerCase().includes(kw);
    });
  });

  /** 当前播放项（按时间区间命中，对齐 KK activeShotResourceId） */
  const playingShotResourceId = computed(() => {
    const seconds = playback.playbackSeconds;
    return (
      shotResources.value.find(
        (item) =>
          item.timeSeconds !== undefined &&
          item.endSeconds !== undefined &&
          seconds >= item.timeSeconds &&
          seconds < item.endSeconds
      )?.id ?? ''
    );
  });

  const activeShotResource = computed(
    () => shotResources.value.find((item) => item.id === activeShotResourceId.value) ?? null
  );

  function selectSidebarResource(item: ReviewSidebarResourceItem): void {
    if (item.kind === 'shot') {
      activeShotResourceId.value = item.id;
      shotDetailCollapsed.value = false;
      if (item.timeSeconds !== undefined) {
        playback.seekToSeconds(item.timeSeconds);
        playback.play();
      }
    }
  }

  async function setShotColor(item: ReviewSidebarResourceItem, color: ReviewShotColorKey): Promise<void> {
    const next = item.colorCategory === color ? null : color;
    await updateReviewShotFields(item.id, { colorCategory: next });
    item.colorCategory = next;
  }

  async function setShotRating(item: ReviewSidebarResourceItem, rating: ReviewShotRating): Promise<void> {
    const next = item.rating === rating ? null : rating;
    await updateReviewShotFields(item.id, { rating: next });
    item.rating = next;
  }

  function handleDigitalTab(): void {
    message.info('功能开发中');
  }

  /** ---------- 左右面板拖宽/收起（对齐 KK useReviewRoomResizablePanels） ---------- */
  const leftWidth = ref(248);
  const rightWidth = ref(380);
  const leftCollapsed = computed(() => leftWidth.value <= 0);
  const rightCollapsed = computed(() => rightWidth.value <= 0);

  const PANEL_LIMITS = {
    left: { min: 208, max: 360, collapseBelow: 104, defaultWidth: 248 },
    right: { min: 320, max: 520, collapseBelow: 150, defaultWidth: 380 },
  };

  let resizeState: { side: 'left' | 'right'; startX: number; startWidth: number } | null = null;

  function onResizerPointerDown(side: 'left' | 'right', event: PointerEvent): void {
    resizeState = {
      side,
      startX: event.clientX,
      startWidth: side === 'left' ? leftWidth.value || PANEL_LIMITS.left.defaultWidth : rightWidth.value || PANEL_LIMITS.right.defaultWidth,
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  function onResizerPointerMove(event: PointerEvent): void {
    if (!resizeState) return;
    const { side, startX, startWidth } = resizeState;
    const limits = PANEL_LIMITS[side];
    const delta = side === 'left' ? event.clientX - startX : startX - event.clientX;
    const next = startWidth + delta;
    if (next < limits.collapseBelow) {
      if (side === 'left') leftWidth.value = 0;
      else rightWidth.value = 0;
    } else {
      const clamped = Math.min(limits.max, Math.max(limits.min, next));
      if (side === 'left') leftWidth.value = clamped;
      else rightWidth.value = clamped;
    }
  }

  function onResizerPointerUp(): void {
    resizeState = null;
  }

  function togglePanel(side: 'left' | 'right'): void {
    if (side === 'left') {
      leftWidth.value = leftCollapsed.value ? PANEL_LIMITS.left.defaultWidth : 0;
    } else {
      rightWidth.value = rightCollapsed.value ? PANEL_LIMITS.right.defaultWidth : 0;
    }
  }

  function onResizerKeydown(side: 'left' | 'right', event: KeyboardEvent): void {
    const limits = PANEL_LIMITS[side];
    const current = side === 'left' ? leftWidth.value : rightWidth.value;
    const set = (value: number): void => {
      if (side === 'left') leftWidth.value = value;
      else rightWidth.value = value;
    };
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 24 : -24;
      const next = side === 'left' ? current + delta : current - delta;
      set(Math.min(limits.max, Math.max(0, next)));
    } else if (event.key === 'Home') {
      event.preventDefault();
      set(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      set(limits.defaultWidth);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      togglePanel(side);
    }
  }

  const panelStyle = computed(() => ({
    '--rr-sidebar-width': `${leftWidth.value}px`,
    '--rr-comments-width': `${rightWidth.value}px`,
  }));

  /** ---------- 当前剪辑段 / 空态 ---------- */
  const activeClip = computed(() => activeClipOf(selectedTimeline.value, playback.playbackSeconds));

  const emptyText = computed(() =>
    timelines.value.length > 0 ? '从左侧选择一个审片项开始审阅。' : '还没有已经上传的时间线'
  );

  return reactive({
    loading,
    timelines,
    selectedTimelineId,
    selectedTimeline,
    topbarContextTarget,
    playback,
    annotations,
    comments,
    load,
    selectTimeline,
    commentMarkers,
    seekToComment,
    activeAssetTab,
    shotViewMode,
    shotColorFilter,
    shotKeyword,
    sidebarLoading,
    shotResources,
    scriptResources,
    visibleShotResources,
    playingShotResourceId,
    activeShotResourceId,
    activeShotResource,
    shotDetailCollapsed,
    loadSidebarResources,
    selectSidebarResource,
    setShotColor,
    setShotRating,
    handleDigitalTab,
    leftWidth,
    rightWidth,
    leftCollapsed,
    rightCollapsed,
    onResizerPointerDown,
    onResizerPointerMove,
    onResizerPointerUp,
    onResizerKeydown,
    togglePanel,
    panelStyle,
    activeClip,
    emptyText,
  });
}

export type ReviewRoomPageContext = ReturnType<typeof useReviewRoomPage>;
