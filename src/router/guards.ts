import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const APP_TITLE = 'AI漫剧studio';

/**
 * 全局守卫（对齐 KMOKE 模式，简化版）：
 * - 未认证访问受保护路由 → 跳登录并携带 redirect
 * - 已认证访问 /login → 直接进工作台
 * - 文档标题同步
 */
export function setupGuards(router: Router): void {
  router.beforeEach((to) => {
    const authStore = useAuthStore();

    if (!to.meta.public && !authStore.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }

    if (to.path === '/login' && authStore.isAuthenticated) {
      return { path: '/dashboard' };
    }
  });

  router.afterEach((to) => {
    const title = to.meta.title;
    document.title = title ? `${title} · ${APP_TITLE}` : APP_TITLE;
  });
}
