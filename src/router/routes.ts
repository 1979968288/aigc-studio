import type { RouteRecordRaw } from 'vue-router';

/**
 * 路由声明（对齐 KMOKE 模式：静态全量声明 + meta 承载页面属性）
 *
 * meta 字段约定：
 * - title：文档标题
 * - tabTitle：工作台标签页标题（缺省回退 title）
 * - moduleTitle：所属模块（面包屑根）
 * - keepAlive：路由名进入 keep-alive 缓存
 * - affix：固定标签（不可关闭）
 * - workbenchTabGroup：home / global-fixed / normal
 * - workbenchTabFixedOrder：global-fixed 组内排序
 * - hideWorkbenchTab：路由访问不产生标签
 */
const routes: RouteRecordRaw[] = [
  {
    // 演示模式：去掉选人页，/login 直接进首页
    path: '/login',
    redirect: '/dashboard',
  },
  {
    path: '/',
    component: () => import('@/app/layout/AppLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: {
          title: '首页',
          tabTitle: '首页',
          moduleTitle: '首页',
          keepAlive: true,
          affix: true,
          workbenchTabGroup: 'home',
          breadcrumbs: ['首页'],
        },
      },
      {
        path: 'projects',
        name: 'ProjectList',
        component: () => import('@/pages/projects/ProjectListPage.vue'),
        meta: {
          title: '项目管理',
          moduleTitle: '项目管理',
          keepAlive: true,
          workbenchTabGroup: 'global-fixed',
          workbenchTabFixedOrder: 10,
          breadcrumbs: ['项目管理'],
        },
      },
      {
        path: 'projects/:id/detail',
        name: 'ProjectDetail',
        component: () => import('@/pages/projects/ProjectDetailPage.vue'),
        meta: {
          title: '项目详情',
          moduleTitle: '项目管理',
          keepAlive: true,
          workbenchTabGroup: 'project',
        },
      },
      {
        path: 'projects/:id/shots',
        name: 'ProjectShotsLine',
        component: () => import('@/pages/projects/ProjectShotsLinePage.vue'),
        meta: {
          title: '镜头线',
          moduleTitle: '项目管理',
          keepAlive: true,
          workbenchTabGroup: 'project',
        },
      },
      {
        path: 'projects/:id/assets',
        name: 'ProjectAssetLine',
        component: () => import('@/pages/projects/ProjectAssetLinePage.vue'),
        meta: {
          title: '资产线',
          moduleTitle: '项目管理',
          keepAlive: true,
          workbenchTabGroup: 'project',
        },
      },
      {
        path: 'projects/:id/workshop',
        name: 'ProjectWorkshop',
        component: () => import('@/pages/projects/ProjectWorkshopPage.vue'),
        meta: {
          title: '制作工坊',
          moduleTitle: '项目管理',
          keepAlive: true,
          workbenchTabGroup: 'project',
        },
      },
      {
        path: 'projects/:id/review',
        name: 'ProjectReview',
        component: () => import('@/pages/projects/ProjectReviewPage.vue'),
        meta: {
          title: '审片室',
          moduleTitle: '项目管理',
          keepAlive: true,
          workbenchTabGroup: 'project',
        },
      },
      {
        path: 'projects/:id/data-list',
        name: 'ProjectDataList',
        component: () => import('@/pages/projects/ProjectDataListPage.vue'),
        meta: {
          title: '数据清单',
          moduleTitle: '项目管理',
          keepAlive: true,
          workbenchTabGroup: 'project',
        },
      },
      {
        path: 'projects/:id/asset-list',
        name: 'ProjectAssets',
        component: () => import('@/pages/projects/ProjectAssetsPage.vue'),
        meta: {
          title: '资产清单',
          moduleTitle: '项目管理',
          keepAlive: true,
          workbenchTabGroup: 'project',
        },
      },
      {
        path: 'staff',
        name: 'StaffManagement',
        component: () => import('@/pages/staff/StaffManagementPage.vue'),
        meta: {
          title: '人员管理',
          moduleTitle: '组织管理',
          keepAlive: true,
          workbenchTabGroup: 'global-fixed',
          workbenchTabFixedOrder: 25,
          breadcrumbs: ['组织管理'],
        },
      },
      {
        path: 'my-tasks',
        name: 'MyTasks',
        component: () => import('@/pages/tasks/MyTasksPage.vue'),
        meta: {
          title: '任务管理',
          moduleTitle: '任务管理',
          keepAlive: true,
          workbenchTabGroup: 'global-fixed',
          workbenchTabFixedOrder: 20,
          breadcrumbs: ['任务管理'],
        },
      },
      {
        path: 'inbox',
        name: 'Inbox',
        component: () => import('@/pages/inbox/InboxPage.vue'),
        meta: {
          title: '收件箱',
          moduleTitle: '任务管理',
          keepAlive: true,
          workbenchTabGroup: 'global-fixed',
          workbenchTabFixedOrder: 30,
          breadcrumbs: ['任务管理'],
        },
      },
      {
        path: 'assets',
        name: 'AssetLibrary',
        component: () => import('@/pages/assets/AssetLibraryPage.vue'),
        meta: {
          title: '资产库',
          moduleTitle: '资产中心',
          keepAlive: true,
          workbenchTabGroup: 'global-fixed',
          workbenchTabFixedOrder: 40,
          breadcrumbs: ['资产中心'],
        },
      },
      {
        path: 'approvals',
        name: 'ApprovalCenter',
        component: () => import('@/pages/approvals/ApprovalCenterPage.vue'),
        meta: {
          title: '审核管理',
          moduleTitle: '审核管理',
          keepAlive: true,
          workbenchTabGroup: 'global-fixed',
          workbenchTabFixedOrder: 50,
          breadcrumbs: ['审核管理'],
        },
      },
      {
        path: 'review',
        name: 'ReviewRoom',
        component: () => import('@/pages/review/ReviewRoomPage.vue'),
        meta: {
          title: '审片室',
          moduleTitle: '审核管理',
          keepAlive: true,
          workbenchTabGroup: 'global-fixed',
          workbenchTabFixedOrder: 60,
          breadcrumbs: ['审核管理'],
        },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/status/NotFoundPage.vue'),
    meta: { public: true, title: '页面不存在', hideWorkbenchTab: true },
  },
];

export default routes;
