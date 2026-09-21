import { computed, reactive, ref, shallowRef } from 'vue';
import Player from 'xgplayer';
import 'xgplayer/dist/index.min.css';
import {
  DEFAULT_FRAME_RATE,
  formatReviewSeconds,
  formatReviewTimecode,
  normalizeReviewTimecodeInput,
  parseReviewTimecode,
  secondsToFrame,
} from '../contracts';
import type { ReviewTimeDisplayMode } from '../types';

/**
 * 播放器编排（对齐 KK useReviewRoomPlayback）：
 * - xgplayer 原生控制条承担播放/倍速/音量/全屏
 * - 时间轴 = 视频真实时长（1:1，无虚拟映射），播放/seek 直接读写视频 currentTime
 * - 时间显示三模式（秒/时间码/帧）+ 时间码搜索 + Ctrl+滚轮缩放（图片预览）
 */
export function useReviewRoomPlayback(options: {
  fallbackDuration: () => number;
  onTimeSync?: (seconds: number) => void;
}) {
  const playerContainerRef = ref<HTMLElement | null>(null);
  const playerInstance = shallowRef<Player | null>(null);

  /** 真实视频时长（metadata 加载后写入，播放器始终以它为准） */
  const actualDuration = ref(0);
  /** 当前播放秒数（= 视频 currentTime，1:1） */
  const playbackSeconds = ref(0);
  const timeDisplayMode = ref<ReviewTimeDisplayMode>('timecode');
  const timecodeSearch = ref('');
  /** 图片预览缩放（Ctrl+滚轮） */
  const zoomLevel = ref(1);

  const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

  /** 页面时间轴总时长：metadata 就绪后以真实时长为准，之前用种子兜底 */
  const displayDuration = computed(() =>
    actualDuration.value > 0 ? actualDuration.value : options.fallbackDuration()
  );

  function syncFromPlayer(): void {
    const player = playerInstance.value;
    if (!player) return;
    playbackSeconds.value = player.currentTime;
    options.onTimeSync?.(playbackSeconds.value);
  }

  function destroyPlayer(): void {
    if (playerInstance.value) {
      playerInstance.value.destroy();
      playerInstance.value = null;
    }
  }

  function initPlayer(url: string): void {
    destroyPlayer();
    const el = playerContainerRef.value;
    if (!el || !url) return;
    const player = new Player({
      el,
      url,
      width: '100%',
      height: '100%',
      autoplay: false,
      marginControls: false,
      controls: { autoHide: false, initShow: true },
      lang: 'zh-cn',
      volume: 0.6,
      playbackRate: [0.5, 0.75, 1, 1.25, 1.5, 2],
      // 防止内容被带走：禁用下载/画中画/截图插件
      ignores: ['pip', 'download', 'screenshot'],
      // 原生 <video> 层面禁用浏览器自带按钮（下载/画中画/远程播放/倍速）
      videoAttributes: {
        controlsList: 'nodownload noplaybackrate',
        disablePictureInPicture: true,
        disableRemotePlayback: true,
      },
    });
    playerInstance.value = player;
    player.on('loadedmetadata', () => {
      actualDuration.value = player.duration as number;
    });
    player.on('durationchange', () => {
      actualDuration.value = player.duration as number;
    });
    player.on('timeupdate', syncFromPlayer);
    player.on('seeking', syncFromPlayer);
    player.on('seeked', syncFromPlayer);
  }

  /** seek 到指定秒数（1:1 写入视频 currentTime） */
  function seekToSeconds(seconds: number): void {
    const clamped = Math.min(displayDuration.value, Math.max(0, seconds));
    playbackSeconds.value = clamped;
    const player = playerInstance.value;
    if (player) {
      player.currentTime = clamped;
    }
    options.onTimeSync?.(clamped);
  }

  function play(): void {
    void playerInstance.value?.play();
  }

  /** 时间显示三模式（对齐 KK displayCurrentTime / displayTotalTime） */
  const displayCurrentTime = computed(() => {
    if (timeDisplayMode.value === 'seconds') return formatReviewSeconds(playbackSeconds.value);
    if (timeDisplayMode.value === 'frames') return String(secondsToFrame(playbackSeconds.value));
    return formatReviewTimecode(playbackSeconds.value);
  });

  const displayTotalTime = computed(() => {
    if (timeDisplayMode.value === 'seconds') return formatReviewSeconds(displayDuration.value);
    if (timeDisplayMode.value === 'frames') return String(secondsToFrame(displayDuration.value));
    return formatReviewTimecode(displayDuration.value);
  });

  function setTimeDisplayMode(mode: ReviewTimeDisplayMode): void {
    timeDisplayMode.value = mode;
  }

  /** 时间码搜索跳转（8 位纯数字或 HH:MM:SS:FF） */
  function submitTimecodeSearch(): string | null {
    const normalized = normalizeReviewTimecodeInput(timecodeSearch.value);
    const seconds = parseReviewTimecode(normalized);
    if (seconds === null || seconds < 0 || seconds > displayDuration.value) {
      return '请输入有效时间码';
    }
    seekToSeconds(seconds);
    timecodeSearch.value = '';
    return null;
  }

  function onWheel(event: WheelEvent): void {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const currentIndex = ZOOM_STEPS.indexOf(zoomLevel.value);
    const nextIndex = Math.min(
      ZOOM_STEPS.length - 1,
      Math.max(0, (currentIndex < 0 ? 3 : currentIndex) + direction)
    );
    zoomLevel.value = ZOOM_STEPS[nextIndex];
  }

  /** 切换时间线时重置 */
  function resetPlayback(): void {
    destroyPlayer();
    actualDuration.value = 0;
    playbackSeconds.value = 0;
    timecodeSearch.value = '';
    zoomLevel.value = 1;
  }

  return reactive({
    playerContainerRef,
    playerInstance,
    playbackSeconds,
    actualDuration,
    displayDuration,
    timeDisplayMode,
    timecodeSearch,
    zoomLevel,
    displayCurrentTime,
    displayTotalTime,
    initPlayer,
    destroyPlayer,
    seekToSeconds,
    play,
    setTimeDisplayMode,
    submitTimecodeSearch,
    onWheel,
    resetPlayback,
  });
}

export type ReviewRoomPlaybackContext = ReturnType<typeof useReviewRoomPlayback>;
