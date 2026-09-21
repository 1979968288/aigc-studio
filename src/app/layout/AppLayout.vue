<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import WorkbenchTabsBar from './WorkbenchTabsBar.vue';
import TopbarUserMenu, { type PageTopAction } from './TopbarUserMenu.vue';
import AppLogo from '@/shared/components/AppLogo.vue';
import { useWorkbenchTabs } from '@/app/workbench/useWorkbenchTabs';
import { buildWorkbenchTabShareUrl } from '@/app/workbench/workbenchTabUtils';
import { addShortcut } from '@/modules/dashboard/api';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { DEMO_USERS } from '@/constants/roles';
import { readDB } from '@/shared/mock/db';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const authStore = useAuthStore();

const {
  visitedTabs,
  activeTabKey,
  cacheableRouteNames,
  routeViewKey,
  navigateToTab,
  removeTab,
  closeLeft,
  closeRight,
  closeOthers,
  closeAll,
  reloadTab,
} = useWorkbenchTabs(route, router);

/** 浏览器全屏（KK toggleBrowserFullscreen 同款） */
const browserFullscreen = ref(typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false);

function syncBrowserFullscreenState(): void {
  browserFullscreen.value = Boolean(document.fullscreenElement);
}

async function toggleBrowserFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncBrowserFullscreenState);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncBrowserFullscreenState);
});

/** 面包屑（第二行）：中间层级可点击跳转 */
interface BreadcrumbEntry {
  label: string;
  to?: string;
}

const breadcrumbs = computed<BreadcrumbEntry[]>(() => {
  // 项目域页面（对齐 KK useWorkbenchProjectBreadcrumbs）：
  // 详情页仅显示项目名单层级；子页面显示 项目名(可点回详情) / 子页面名。
  // KK 项目域面包屑不含「项目管理/项目列表」层级，那些只出现在非项目页面。
  const projectMatch = /^\/projects\/([^/]+)\/(detail|shots|assets|workshop|review|data-list|asset-list)$/.exec(route.path);
  const queryName = typeof route.query.name === 'string' ? route.query.name.trim() : '';
  if (projectMatch) {
    const [, projectId, segment] = projectMatch;
    // name 查询参数缺失时（如外部链接/全局入口跳转）从 db 兜底项目名，避免面包屑行整体消失
    const projectName =
      queryName || readDB().projects.find((project) => project.id === projectId)?.name || '';
    if (!projectName) return [];
    if (segment === 'detail') {
      return [{ label: projectName }];
    }
    const subTitle = typeof route.meta.title === 'string' ? route.meta.title.trim() : '';
    return [
      {
        label: projectName,
        to: `/projects/${projectId}/detail?name=${encodeURIComponent(projectName)}`,
      },
      { label: subTitle || segment },
    ];
  }
  const chain = route.meta.breadcrumbs;
  if (!Array.isArray(chain)) return [];
  return chain.map((item) =>
    typeof item === 'string' ? { label: item } : { label: item.label, to: item.to }
  );
});

function goBreadcrumb(crumb: BreadcrumbEntry): void {
  if (!crumb.to) return;
  void router.push(crumb.to);
}

/** 页面动作注入区（KK pageTopActions 同款：页面注册，切换页面清除） */
const pageTopActions = ref<PageTopAction[]>([]);

/** 供页面注册动作（通过路由 meta 或 provide 全局约定，此处从 provide 取） */
const PAGE_ACTIONS_KEY = 'pageTopActions' as const;
provide(PAGE_ACTIONS_KEY, {
  set: (actions: PageTopAction[]) => {
    pageTopActions.value = actions;
  },
  clear: () => {
    pageTopActions.value = [];
  },
});

watch(
  () => route.fullPath,
  () => {
    pageTopActions.value = [];
  }
);

function toggleTheme(): void {
  appStore.toggleTheme();
}

function handleLogout(): void {
  // 演示模式：退出登录 = 重置回默认用户，直接留在首页，不进选人页
  authStore.logout();
  void authStore.loginAs(DEMO_USERS[0]).then(() => {
    router.push('/dashboard');
    message.success('已重置为默认视角（制片）');
  });
}

function handleOpenMessages(): void {
  message.info('消息中心在后续里程碑开放');
}

function handleCopyLink(fullPath: string): void {
  const url = buildWorkbenchTabShareUrl(fullPath);
  navigator.clipboard
    .writeText(url)
    .then(() => message.success('页面链接已复制'))
    .catch(() => message.error('复制失败，请手动复制地址栏'));
}

/** 收藏标签页到首页捷径（KK favoriteNameModal 同款闭环） */
const favoriteModalOpen = ref(false);
const favoriteNameInput = ref('');
const favoriteTarget = ref<{ fullPath: string; title: string } | null>(null);

function handleFavorite(fullPath: string): void {
  const tab = visitedTabs.value.find((item) => item.fullPath === fullPath);
  favoriteTarget.value = { fullPath, title: tab?.title ?? fullPath };
  favoriteNameInput.value = tab?.title ?? '';
  favoriteModalOpen.value = true;
}

async function confirmFavorite(): Promise<void> {
  if (!favoriteTarget.value) return;
  const label = favoriteNameInput.value.trim();
  if (!label) {
    message.warning('请输入卡片名称');
    return;
  }
  await addShortcut(label, favoriteTarget.value.fullPath);
  favoriteModalOpen.value = false;
  message.success('已收藏到首页【收藏/捷径】');
}
</script>

<script lang="ts">
export default { name: 'AppLayout' };
</script>

<template>
  <div class="workbench-layout">
    <header class="workbench-header">
      <!-- 第一行：品牌 + 标签条 + 右侧动作 -->
      <div class="workbench-header__primary">
        <div class="workbench-header__brand" @click="router.push('/dashboard')">
          <AppLogo :size="32" />
          <span class="workbench-header__title">AI漫剧studio</span>
        </div>

        <div class="workbench-header__tabs">
          <WorkbenchTabsBar
            :tabs="visitedTabs"
            :active-tab-key="activeTabKey"
            @navigate="navigateToTab"
            @close="removeTab"
            @close-left="closeLeft"
            @close-right="closeRight"
            @close-others="closeOthers"
            @close-all="closeAll"
            @reload="reloadTab"
            @copy-link="handleCopyLink"
            @favorite="handleFavorite"
          />
        </div>

        <TopbarUserMenu
          :page-top-actions="pageTopActions"
          :browser-fullscreen="browserFullscreen"
          @toggle-theme="toggleTheme"
          @toggle-browser-fullscreen="toggleBrowserFullscreen"
          @logout="handleLogout"
          @open-messages="handleOpenMessages"
        />
      </div>

      <!-- 第二行：面包屑 + 页面上下文注入区（对齐 KK page-context-slot：审片对象选择器等 Teleport 到此） -->
      <div v-if="breadcrumbs.length" class="workbench-header__context">
        <nav class="workbench-breadcrumbs" aria-label="面包屑">
          <template v-for="(crumb, index) in breadcrumbs" :key="crumb.label + index">
            <button
              v-if="crumb.to && index < breadcrumbs.length - 1"
              type="button"
              class="workbench-breadcrumbs__item workbench-breadcrumbs__item--link"
              @click="goBreadcrumb(crumb)"
            >
              {{ crumb.label }}
            </button>
            <span
              v-else
              class="workbench-breadcrumbs__item"
              :class="{ 'workbench-breadcrumbs__item--current': index === breadcrumbs.length - 1 }"
            >
              {{ crumb.label }}
            </span>
            <span v-if="index < breadcrumbs.length - 1" class="workbench-breadcrumbs__sep">/</span>
          </template>
        </nav>
        <div class="workbench-header__page-context" data-workbench-topbar-page-context />
      </div>
    </header>

    <main class="workbench-content">
      <router-view v-slot="{ Component }">
        <keep-alive :include="cacheableRouteNames">
          <component :is="Component" :key="routeViewKey" />
        </keep-alive>
      </router-view>
    </main>

    <a-modal
      v-model:open="favoriteModalOpen"
      title="收藏标签页"
      ok-text="保存"
      cancel-text="取消"
      @ok="confirmFavorite"
    >
      <div class="workbench-favorite-modal">
        <p class="workbench-favorite-modal__hint">将此页面添加到首页【收藏/捷径】</p>
        <label class="workbench-favorite-modal__field">
          <span class="workbench-favorite-modal__label">卡片名称</span>
          <a-input
            v-model:value="favoriteNameInput"
            :maxlength="50"
            show-count
            allow-clear
            autofocus
            placeholder="请输入卡片名称"
            @press-enter="confirmFavorite"
          />
        </label>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.workbench-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--component-page-background);
}

.workbench-header {
  flex-shrink: 0;
  border-bottom: 1px solid var(--component-toolbar-border);
  background: var(--component-toolbar-background);
}

/* 第一行：品牌 + 标签条 + 右侧动作 */
.workbench-header__primary {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  height: 48px;
  padding: 0 var(--spacing-4) 0 var(--spacing-5);
}

.workbench-header__brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  cursor: pointer;
  flex-shrink: 0;
}

.workbench-header__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.workbench-header__tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  align-self: stretch;
  border-left: 1px solid var(--color-border-divider);
  border-right: 1px solid var(--color-border-divider);
  padding: 0 var(--spacing-2);
}

/* 第二行：面包屑 */
.workbench-header__context {
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 0 var(--spacing-5);
  border-top: 1px solid var(--color-border-divider);
}

.workbench-breadcrumbs {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

/* 页面上下文注入区：审片室等页面 Teleport 的对象选择器/状态落在这里，紧挨面包屑层级 */
.workbench-header__page-context {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  min-width: 0;
  flex: 1;
  margin-left: var(--spacing-4);
}

.workbench-breadcrumbs__item--current {
  color: var(--color-text-secondary);
}

.workbench-breadcrumbs__item--link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s ease;
}

.workbench-breadcrumbs__item--link:hover {
  color: var(--color-action-primary);
}

.workbench-breadcrumbs__sep {
  color: var(--color-text-disabled);
}

.workbench-content {
  flex: 1;
  min-height: 0;
  overflow: hidden auto;
}

.workbench-favorite-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.workbench-favorite-modal__hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 20px;
}

.workbench-favorite-modal__field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.workbench-favorite-modal__label {
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
</style>
