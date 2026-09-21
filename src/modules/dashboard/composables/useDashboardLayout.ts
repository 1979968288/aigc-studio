import { useRoute } from 'vue-router';
import { cardMetaList, cardMetaMap, GRID_COLS } from '../constants';
import {
  createDefaultLayout,
  createDefaultVisibility,
  mergeLayoutWithMeta,
  packLayout,
  readStoredDashboardLayout,
  writeStoredDashboardLayout,
  clearStoredDashboardLayout,
} from '../card-settings';
import type { LayoutCard, VisibleLayoutCard } from '../types';

/**
 * 首页布局管理（对齐 KK useDashboardLayout，简化为纯本地持久化）：
 * - 拖拽/缩放后写入 localStorage
 * - 弹窗模式：query 携带 cardId + popup=1 时单卡全屏
 * - 可见性过滤 + 隐藏后垂直紧缩
 */
export function useDashboardLayout() {
  const route = useRoute();

  const layout = ref<LayoutCard[]>(createDefaultLayout());
  const visibility = ref<Record<string, boolean>>(createDefaultVisibility());
  const isPopupMode = ref(false);
  const popupCardId = ref<string | null>(null);

  const visibleCards = computed<VisibleLayoutCard[]>(() => {
    if (isPopupMode.value && popupCardId.value) {
      const meta = cardMetaMap[popupCardId.value];
      if (!meta || visibility.value[meta.id] !== true) return [];
      return [{ i: meta.id, x: 0, y: 0, w: GRID_COLS, h: 100, meta }];
    }

    const cards = layout.value.flatMap<VisibleLayoutCard>((item) => {
      const meta = cardMetaMap[item.i];
      if (!meta || visibility.value[meta.id] !== true) return [];
      return [{ ...item, meta }];
    });

    // 有隐藏卡片时垂直紧缩，避免留洞
    const hasHidden = layout.value.length !== cards.length;
    if (!hasHidden) return cards;

    const packed = packLayout(cards.map(({ meta: _meta, ...card }) => card));
    return packed.flatMap<VisibleLayoutCard>((card) => {
      const meta = cardMetaMap[card.i];
      return meta ? [{ ...card, meta }] : [];
    });
  });

  const showDashboardCardEmpty = computed(
    () => !isPopupMode.value && visibleCards.value.length === 0
  );

  function initLayout(): void {
    const stored = readStoredDashboardLayout();
    if (stored) {
      visibility.value = stored.visibility;
      layout.value = mergeLayoutWithMeta(stored.layout);
    } else {
      visibility.value = createDefaultVisibility();
      layout.value = createDefaultLayout();
    }
  }

  function persist(): void {
    writeStoredDashboardLayout(layout.value, visibility.value);
  }

  function setCardVisible(cardId: string, visible: boolean): void {
    visibility.value = { ...visibility.value, [cardId]: visible };
    persist();
  }

  function resetLayoutToDefault(): void {
    visibility.value = createDefaultVisibility();
    layout.value = createDefaultLayout();
    clearStoredDashboardLayout();
    persist();
  }

  function initPopupMode(): void {
    const cardId = route.query.cardId;
    const popup = route.query.popup;
    if (typeof cardId !== 'string' || popup !== '1') return;
    if (!cardMetaList.some((meta) => meta.id === cardId)) return;

    isPopupMode.value = true;
    popupCardId.value = cardId;
    const meta = cardMetaMap[cardId];
    if (meta) {
      document.title = `${meta.title} · AI漫剧studio`;
    }
  }

  watch(layout, persist, { deep: true });

  return {
    layout,
    visibility,
    visibleCards,
    showDashboardCardEmpty,
    isPopupMode,
    popupCardId,
    initLayout,
    initPopupMode,
    setCardVisible,
    resetLayoutToDefault,
  };
}
