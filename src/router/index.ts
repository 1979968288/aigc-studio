import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';
import { setupGuards } from './guards';
import type { WorkbenchTabGroup } from '@/app/workbench/workbenchTabUtils';

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

setupGuards(router);

export default router;

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题（同步到 document.title） */
    title?: string;
    /** 公开路由，无需登录即可访问 */
    public?: boolean;
    /** 工作台标签页标题（缺省回退 title） */
    tabTitle?: string;
    /** 所属模块标题（面包屑根） */
    moduleTitle?: string;
    /** 路由名进入 keep-alive 缓存 */
    keepAlive?: boolean;
    /** 固定标签（不可关闭） */
    affix?: boolean;
    /** 标签分组：home（工作台）/ global-fixed（全局固定）/ normal（普通） */
    workbenchTabGroup?: WorkbenchTabGroup;
    /** global-fixed 组内排序 */
    workbenchTabFixedOrder?: number;
    /** 访问不产生工作台标签 */
    hideWorkbenchTab?: boolean;
    /** 面包屑链（从模块根到当前页）；中间层级可携带路由实现点击跳转 */
    breadcrumbs?: Array<string | { label: string; to?: string }>;
  }
}
