import { computed, reactive, ref } from 'vue';
import { REVIEW_ANNOTATE_COLORS } from '../constants';
import {
  createAnnotationSnapshot,
  denormalizeAnnotationConfig,
  restoreAnnotationSnapshot,
} from '../annotation-contracts';
import { ANNOTATION_TIME_TOLERANCE_SECONDS } from '../contracts';
import type {
  ReviewAnnotationShape,
  ReviewAnnotationSnapshot,
  ReviewDrawingShape,
  ReviewDrawTool,
  VisibleAnnotationSource,
} from '../types';

/** CSS token → 实际色值（getComputedStyle 解析，对齐 KK resolveTokenColor） */
const colorCache = new Map<string, string>();
function resolveTokenColor(token: string): string {
  const cached = colorCache.get(token);
  if (cached) return cached;
  const el = document.createElement('span');
  el.style.color = token;
  el.style.display = 'none';
  document.body.appendChild(el);
  const resolved = getComputedStyle(el).color || '#f5222d';
  el.remove();
  colorCache.set(token, resolved);
  return resolved;
}

let shapeSeq = 0;
function nextShapeId(): string {
  shapeSeq += 1;
  return `s-${Date.now()}-${shapeSeq}`;
}

/**
 * 圈注编排（对齐 KK useReviewRoomAnnotations）：
 * 五工具（画笔/矩形/箭头/文字/橡皮）+ 五色板 + 撤销(30 步)/清空；
 * Konva 层默认 pointer-events:none，激活工具时接管鼠标；
 * 草稿提交时归一化为 0~1 快照；评论圈注按时间容差自动显隐。
 */
export function useReviewRoomAnnotations(options: {
  currentTime: () => number;
}) {
  const konvaStageRef = ref<{ getStage: () => { toDataURL: (config?: { pixelRatio?: number }) => string } } | null>(null);
  const stageConfig = reactive({ width: 800, height: 600 });

  const activeTool = ref<ReviewDrawTool | null>(null);
  const annotateColorKey = ref(REVIEW_ANNOTATE_COLORS[0].key);
  const annotateColor = computed(
    () =>
      resolveTokenColor(
        REVIEW_ANNOTATE_COLORS.find((item) => item.key === annotateColorKey.value)?.token ??
          REVIEW_ANNOTATE_COLORS[0].token
      )
  );

  const konvaLines = ref<ReviewAnnotationShape[]>([]);
  const konvaRects = ref<ReviewAnnotationShape[]>([]);
  const konvaArrows = ref<ReviewAnnotationShape[]>([]);
  const konvaTexts = ref<ReviewAnnotationShape[]>([]);
  const currentDrawing = ref<ReviewDrawingShape | null>(null);

  /** 当前画面圈注的来源与时间（草稿 or 某评论），用于自动显隐 */
  const visibleAnnotation = ref<VisibleAnnotationSource | null>(null);

  /** 撤销栈（图形 id 集合快照，上限 30） */
  const undoStack = ref<string[][]>([]);

  /** 文字输入浮层 */
  const textInputVisible = ref(false);
  const textInputValue = ref('');
  const textInputPos = reactive({ x: 0, y: 0 });

  let drawing = false;
  let drawStart = { x: 0, y: 0 };

  function allShapeIds(): string[] {
    return [
      ...konvaLines.value,
      ...konvaRects.value,
      ...konvaArrows.value,
      ...konvaTexts.value,
    ].map((shape) => shape.id);
  }

  function pushUndo(): void {
    undoStack.value.push(allShapeIds());
    if (undoStack.value.length > 30) undoStack.value.shift();
  }

  function filterByIds(ids: string[]): void {
    konvaLines.value = konvaLines.value.filter((shape) => ids.includes(shape.id));
    konvaRects.value = konvaRects.value.filter((shape) => ids.includes(shape.id));
    konvaArrows.value = konvaArrows.value.filter((shape) => ids.includes(shape.id));
    konvaTexts.value = konvaTexts.value.filter((shape) => ids.includes(shape.id));
  }

  function toggleTool(tool: ReviewDrawTool): void {
    activeTool.value = activeTool.value === tool ? null : tool;
  }

  function setColor(key: string): void {
    annotateColorKey.value = key;
  }

  /** Konva 事件取 stage 坐标（vue-konva 事件非 DOM 事件，currentTarget 无 getBoundingClientRect） */
  function stagePoint(event: { target?: { getStage?: () => { getPointerPosition?: () => { x: number; y: number } | null } | null } }): { x: number; y: number } {
    const stage = event.target?.getStage?.();
    const pos = stage?.getPointerPosition?.();
    return pos ?? { x: 0, y: 0 };
  }

  function onStageMouseDown(event: Parameters<typeof stagePoint>[0]): void {
    const tool = activeTool.value;
    if (!tool) return;
    const point = stagePoint(event);
    if (tool === 'text') {
      textInputPos.x = point.x;
      textInputPos.y = point.y;
      textInputValue.value = '';
      textInputVisible.value = true;
      return;
    }
    pushUndo();
    drawing = true;
    drawStart = point;
    if (!visibleAnnotation.value || visibleAnnotation.value.kind !== 'draft') {
      visibleAnnotation.value = { kind: 'draft', time: options.currentTime() };
    }
    const stroke = annotateColor.value;
    if (tool === 'pen' || tool === 'eraser') {
      currentDrawing.value = {
        type: 'line',
        config: {
          points: [point.x, point.y],
          stroke,
          strokeWidth: tool === 'eraser' ? 20 : 2.5,
          lineCap: 'round',
          lineJoin: 'round',
          tension: 0.5,
          globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over',
        },
      };
    } else if (tool === 'rect') {
      currentDrawing.value = {
        type: 'rect',
        config: { x: point.x, y: point.y, width: 0, height: 0, stroke, strokeWidth: 2.5 },
      };
    } else {
      currentDrawing.value = {
        type: 'arrow',
        config: {
          points: [point.x, point.y, point.x, point.y],
          stroke,
          strokeWidth: 2.5,
          fill: stroke,
          pointerLength: 12,
          pointerWidth: 10,
        },
      };
    }
  }

  function onStageMouseMove(event: Parameters<typeof stagePoint>[0]): void {
    if (!drawing || !currentDrawing.value) return;
    const point = stagePoint(event);
    const draft = currentDrawing.value;
    if (draft.type === 'line') {
      (draft.config.points as number[]).push(point.x, point.y);
    } else if (draft.type === 'rect') {
      draft.config.x = Math.min(drawStart.x, point.x);
      draft.config.y = Math.min(drawStart.y, point.y);
      draft.config.width = Math.abs(point.x - drawStart.x);
      draft.config.height = Math.abs(point.y - drawStart.y);
    } else {
      draft.config.points = [drawStart.x, drawStart.y, point.x, point.y];
    }
  }

  function onStageMouseUp(): void {
    if (!drawing) return;
    drawing = false;
    const draft = currentDrawing.value;
    currentDrawing.value = null;
    if (!draft) return;
    const shape: ReviewAnnotationShape = { id: nextShapeId(), type: draft.type, config: draft.config };
    if (draft.type === 'line') konvaLines.value.push(shape);
    else if (draft.type === 'rect') konvaRects.value.push(shape);
    else konvaArrows.value.push(shape);
  }

  function confirmTextAnnotation(): void {
    const text = textInputValue.value.trim();
    textInputVisible.value = false;
    if (!text) return;
    pushUndo();
    if (!visibleAnnotation.value || visibleAnnotation.value.kind !== 'draft') {
      visibleAnnotation.value = { kind: 'draft', time: options.currentTime() };
    }
    konvaTexts.value.push({
      id: nextShapeId(),
      type: 'text',
      config: {
        x: textInputPos.x,
        y: textInputPos.y,
        text,
        fontSize: 16,
        fill: annotateColor.value,
        fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
      },
    });
  }

  function cancelTextAnnotation(): void {
    textInputVisible.value = false;
    textInputValue.value = '';
  }

  function undo(): void {
    const previous = undoStack.value.pop();
    if (previous === undefined) return;
    filterByIds(previous);
  }

  function clearAnnotations(): void {
    pushUndo();
    konvaLines.value = [];
    konvaRects.value = [];
    konvaArrows.value = [];
    konvaTexts.value = [];
    visibleAnnotation.value = null;
  }

  const hasDraftShapes = computed(
    () =>
      konvaLines.value.length + konvaRects.value.length + konvaArrows.value.length + konvaTexts.value.length >
      0
  );

  /** 当前草稿的归一化快照（提交评论时调用） */
  function createDraftSnapshot(): ReviewAnnotationSnapshot {
    const shapes: ReviewAnnotationShape[] = [
      ...konvaLines.value,
      ...konvaRects.value,
      ...konvaArrows.value,
      ...konvaTexts.value,
    ];
    return createAnnotationSnapshot(shapes, stageConfig.width, stageConfig.height);
  }

  /** 把某条评论的圈注快照铺回画面 */
  function restoreSnapshot(snapshot: ReviewAnnotationSnapshot, time: number): void {
    clearWithoutUndo();
    const shapes = restoreAnnotationSnapshot(snapshot, stageConfig.width, stageConfig.height);
    konvaLines.value = shapes.filter((shape) => shape.type === 'line');
    konvaRects.value = shapes.filter((shape) => shape.type === 'rect');
    konvaArrows.value = shapes.filter((shape) => shape.type === 'arrow');
    konvaTexts.value = shapes.filter((shape) => shape.type === 'text');
    visibleAnnotation.value = { kind: 'comment', time };
  }

  function clearWithoutUndo(): void {
    konvaLines.value = [];
    konvaRects.value = [];
    konvaArrows.value = [];
    konvaTexts.value = [];
    undoStack.value = [];
  }

  /** 播放中自动显隐：偏离绑定时间超过 0.25s 即清屏（对齐 KK） */
  function syncAnnotationVisibilityForTime(currentTime: number): void {
    const source = visibleAnnotation.value;
    if (!source) return;
    if (Math.abs(currentTime - source.time) > ANNOTATION_TIME_TOLERANCE_SECONDS) {
      clearWithoutUndo();
      visibleAnnotation.value = null;
    }
  }

  /** 跟随 viewer 尺寸同步 stage（ResizeObserver 调用） */
  function syncStageSize(entry: ResizeObserverEntry): void {
    stageConfig.width = Math.round(entry.contentRect.width);
    stageConfig.height = Math.round(entry.contentRect.height);
  }

  /** Konva 层导出 dataURL（帧截图合成用） */
  function exportStageDataUrl(): string | null {
    const stage = konvaStageRef.value?.getStage?.();
    if (!stage || !hasDraftShapes.value) return null;
    return stage.toDataURL({ pixelRatio: 1 });
  }

  /** 重置（切换时间线时） */
  function resetAnnotations(): void {
    clearWithoutUndo();
    visibleAnnotation.value = null;
    activeTool.value = null;
    currentDrawing.value = null;
    textInputVisible.value = false;
  }

  return reactive({
    konvaStageRef,
    stageConfig,
    activeTool,
    annotateColorKey,
    annotateColor,
    konvaLines,
    konvaRects,
    konvaArrows,
    konvaTexts,
    currentDrawing,
    visibleAnnotation,
    hasDraftShapes,
    textInputVisible,
    textInputValue,
    textInputPos,
    toggleTool,
    setColor,
    onStageMouseDown,
    onStageMouseMove,
    onStageMouseUp,
    confirmTextAnnotation,
    cancelTextAnnotation,
    undo,
    clearAnnotations,
    createDraftSnapshot,
    restoreSnapshot,
    syncAnnotationVisibilityForTime,
    syncStageSize,
    exportStageDataUrl,
    resetAnnotations,
  });
}

export type ReviewRoomAnnotationsContext = ReturnType<typeof useReviewRoomAnnotations>;

/** 供截图合成：把快照反归一化到指定尺寸（用于离屏绘制） */
export function denormalizeForCapture(
  config: Record<string, unknown>,
  width: number,
  height: number
): Record<string, unknown> {
  return denormalizeAnnotationConfig(config, width, height);
}
