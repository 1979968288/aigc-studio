<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  BulbOutlined,
  DownOutlined,
  LogoutOutlined,
  MessageOutlined,
  ExpandOutlined,
  CompressOutlined,
  UserOutlined,
} from '@ant-design/icons-vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { readDB } from '@/shared/mock/db';

/** 页面动作（KK PageTopAction 同款：页面 onMounted 注册，卸载清除） */
export interface PageTopAction {
  key: string;
  label: string;
  icon: 'reload' | 'layout-reset' | 'settings';
  handler: () => void;
}

const props = withDefaults(
  defineProps<{
    pageTopActions?: PageTopAction[];
    browserFullscreen?: boolean;
  }>(),
  {
    pageTopActions: () => [],
    browserFullscreen: false,
  }
);

const emit = defineEmits<{
  (e: 'toggle-theme'): void;
  (e: 'toggle-browser-fullscreen'): void;
  (e: 'logout'): void;
  (e: 'open-messages'): void;
}>();

const appStore = useAppStore();
const authStore = useAuthStore();

const userMenuOpen = ref(false);
const messageDropdownOpen = ref(false);

const user = computed(() => authStore.currentUser);
const displayName = computed(() => user.value?.name ?? '用户');

/** Mock 未读消息（演示数据，模拟 IM 会话） */
interface MockUnreadConversation {
  id: string;
  name: string;
  latestMsg: string;
  unreadCount: number;
}

const unreadConversations = computed<MockUnreadConversation[]>(() => {
  const db = readDB();
  const source: Array<Omit<MockUnreadConversation, 'unreadCount'>> = [
    { id: 'c1', name: '李慕', latestMsg: 'S01-013 这版的构图可以，眼神再看下' },
    { id: 'c2', name: '苏晚', latestMsg: '白小满 v3 三视图已提交锁定审批' },
    { id: 'c3', name: '张远', latestMsg: '客户那边周五要看粗剪，来得及吗' },
  ];
  void db;
  return source.map((conv, index) => ({ ...conv, unreadCount: index + 1 }));
});

const unreadCount = computed(() =>
  unreadConversations.value.reduce((total, conv) => total + conv.unreadCount, 0)
);

function closeUserMenu(): void {
  userMenuOpen.value = false;
}

function handleMenuThemeToggle(): void {
  closeUserMenu();
  emit('toggle-theme');
}

function handleBrowserFullscreen(): void {
  closeUserMenu();
  emit('toggle-browser-fullscreen');
}

function handleLogout(): void {
  closeUserMenu();
  emit('logout');
}

function handlePageTopAction(handler: () => void): void {
  closeUserMenu();
  handler();
}

function handleViewAllMessages(): void {
  messageDropdownOpen.value = false;
  emit('open-messages');
}
</script>

<script lang="ts">
export default { name: 'TopbarUserMenu' };
</script>

<template>
  <div class="topbar-user-menu__wrapper">
    <!-- 有未读消息时：按钮带角标 + hover 下拉未读面板 -->
    <a-dropdown
      v-if="unreadCount > 0"
      v-model:open="messageDropdownOpen"
      :trigger="['hover']"
      placement="bottomRight"
    >
      <a-tooltip title="消息">
        <button
          type="button"
          class="topbar-user-menu__messages-btn"
          @click.stop="emit('open-messages')"
        >
          <MessageOutlined />
          <span class="topbar-user-menu__messages-badge">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </button>
      </a-tooltip>
      <template #overlay>
        <div class="topbar-user-menu__messages-panel">
          <div class="topbar-user-menu__messages-header">
            <span class="topbar-user-menu__messages-title">未读消息</span>
            <span class="topbar-user-menu__messages-count">{{ unreadCount }} 条未读</span>
          </div>
          <div class="topbar-user-menu__messages-list">
            <div
              v-for="conv in unreadConversations"
              :key="conv.id"
              class="topbar-user-menu__message-item"
              @click="handleViewAllMessages"
            >
              <div class="topbar-user-menu__message-avatar">
                <span>{{ conv.name.charAt(0) }}</span>
              </div>
              <div class="topbar-user-menu__message-content">
                <div class="topbar-user-menu__message-name">{{ conv.name }}</div>
                <div class="topbar-user-menu__message-text">{{ conv.latestMsg }}</div>
              </div>
              <div class="topbar-user-menu__message-badge">
                {{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}
              </div>
            </div>
          </div>
          <div class="topbar-user-menu__messages-footer">
            <button
              type="button"
              class="topbar-user-menu__messages-view-all"
              @click="handleViewAllMessages"
            >
              查看全部消息
            </button>
          </div>
        </div>
      </template>
    </a-dropdown>
    <!-- 无未读消息：仅按钮 -->
    <a-tooltip v-else title="消息">
      <button
        type="button"
        class="topbar-user-menu__messages-btn"
        aria-label="消息"
        @click.stop="emit('open-messages')"
      >
        <MessageOutlined />
      </button>
    </a-tooltip>

    <a-dropdown
      v-model:open="userMenuOpen"
      :trigger="['click']"
      placement="bottomRight"
    >
      <button type="button" class="topbar-user-menu__trigger" :aria-label="displayName">
        <span
          class="topbar-user-menu__trigger-avatar"
          :style="user ? { background: user.color, color: '#fff' } : undefined"
        >
          {{ displayName.charAt(0) }}
        </span>
        <span class="topbar-user-menu__trigger-name">{{ displayName }}</span>
        <DownOutlined
          class="topbar-user-menu__trigger-chevron"
          :class="{ 'is-open': userMenuOpen }"
        />
      </button>
      <template #overlay>
        <div class="topbar-user-menu__panel">
          <button type="button" class="topbar-user-menu__item" @click="handleMenuThemeToggle">
            <BulbOutlined />
            <span>切换主题</span>
          </button>

          <button
            v-for="action in props.pageTopActions"
            :key="action.key"
            type="button"
            class="topbar-user-menu__item"
            @click="handlePageTopAction(action.handler)"
          >
            <ReloadOutlined v-if="action.icon === 'reload'" />
            <AppstoreOutlined v-else-if="action.icon === 'layout-reset'" />
            <SettingOutlined v-else />
            <span>{{ action.label }}</span>
          </button>

          <button type="button" class="topbar-user-menu__item" @click="handleBrowserFullscreen">
            <CompressOutlined v-if="browserFullscreen" />
            <ExpandOutlined v-else />
            <span>{{ browserFullscreen ? '退出浏览器全屏' : '进入浏览器全屏' }}</span>
          </button>

          <div class="topbar-user-menu__divider" />

          <button type="button" class="topbar-user-menu__item is-danger" @click="handleLogout">
            <LogoutOutlined />
            <span>退出登录</span>
          </button>
        </div>
      </template>
    </a-dropdown>
  </div>
</template>

<style scoped>
.topbar-user-menu__wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 消息按钮 */
.topbar-user-menu__messages-btn {
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.topbar-user-menu__messages-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.topbar-user-menu__messages-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--radius-full);
  background: var(--color-feedback-error);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 用户菜单触发器（KK 胶囊样式） */
.topbar-user-menu__trigger {
  max-width: 168px;
  min-width: 0;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--color-border-accent);
  border-radius: var(--radius-full);
  background: var(--color-fill-primary-subtle);
  color: var(--color-text-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 6px 16px -12px color-mix(in srgb, var(--color-action-primary) 34%, transparent);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.topbar-user-menu__trigger:hover {
  border-color: var(--color-action-primary);
  background: var(--color-fill-primary-hover);
  box-shadow: 0 8px 18px -12px color-mix(in srgb, var(--color-action-primary) 44%, transparent);
}

.topbar-user-menu__trigger-avatar {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-action-primary);
  background: var(--component-popover-background);
}

.topbar-user-menu__trigger-name {
  min-width: 0;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-user-menu__trigger-chevron {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--color-text-tertiary);
  transition: transform 0.15s ease;
}

.topbar-user-menu__trigger-chevron.is-open {
  transform: rotate(180deg);
}

/* 用户菜单面板 */
.topbar-user-menu__panel {
  width: 224px;
  padding: 8px;
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-5);
  background: var(--component-popover-background);
  box-shadow: var(--shadow-floating);
}

.topbar-user-menu__item {
  width: 100%;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-4);
  background: transparent;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  line-height: 20px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.topbar-user-menu__item:hover {
  background: var(--color-bg-hover);
  color: var(--color-action-primary);
}

.topbar-user-menu__item.is-danger {
  color: var(--color-feedback-error);
}

.topbar-user-menu__item.is-danger:hover {
  background: var(--color-fill-error-subtle);
}

.topbar-user-menu__divider {
  height: 1px;
  margin: 8px 0;
  background: var(--color-border-divider);
}

/* 未读消息面板 */
.topbar-user-menu__messages-panel {
  width: 320px;
  max-height: 400px;
  border: 1px solid var(--color-border-divider);
  border-radius: var(--radius-5);
  background: var(--component-popover-background);
  box-shadow: var(--shadow-floating);
  display: flex;
  flex-direction: column;
}

.topbar-user-menu__messages-header {
  padding: 12px;
  border-bottom: 1px solid var(--color-border-divider);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-user-menu__messages-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.topbar-user-menu__messages-count {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.topbar-user-menu__messages-list {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
}

.topbar-user-menu__message-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-divider);
  transition: background-color 0.15s ease;
}

.topbar-user-menu__message-item:last-child {
  border-bottom: none;
}

.topbar-user-menu__message-item:hover {
  background: var(--color-bg-hover);
}

.topbar-user-menu__message-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--color-action-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  flex-shrink: 0;
}

.topbar-user-menu__message-content {
  flex: 1;
  min-width: 0;
}

.topbar-user-menu__message-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-user-menu__message-text {
  font-size: 12px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-user-menu__message-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  background: var(--color-feedback-error);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.topbar-user-menu__messages-footer {
  padding: 8px;
  border-top: 1px solid var(--color-border-divider);
}

.topbar-user-menu__messages-view-all {
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: var(--radius-4);
  background: transparent;
  color: var(--color-action-primary);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.topbar-user-menu__messages-view-all:hover {
  background: var(--color-fill-primary-hover);
}
</style>
