<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { ArrowRightOutlined } from '@ant-design/icons-vue';
import AppLogo from '@/shared/components/AppLogo.vue';
import { DEMO_USERS, type DemoUser } from '@/constants/roles';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const enteringId = ref<string | null>(null);

async function enter(user: DemoUser): Promise<void> {
  if (enteringId.value) return;
  enteringId.value = user.id;
  try {
    await authStore.loginAs(user);
    message.success(`已进入：${user.name} · ${user.roleLabel}`);
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    router.push(redirect);
  } catch {
    message.error('登录失败，请重试');
    enteringId.value = null;
  }
}
</script>

<template>
  <div class="auth-shell flex min-h-screen items-center justify-center p-6">
    <div class="w-full max-w-3xl">
      <div class="mb-8 text-center">
        <AppLogo :size="56" class="mb-4" />
        <h1 class="text-2xl font-semibold text-text-primary">AIGC 制作管理系统</h1>
        <p class="mt-2 text-text-tertiary">团队创作协作演示 · 选择一个角色进入系统</p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="user in DEMO_USERS"
          :key="user.id"
          class="role-card"
          :aria-disabled="enteringId !== null"
          @click="enter(user)"
        >
          <div
            class="role-avatar"
            :style="{ color: user.color, background: `${user.color}1f` }"
          >
            <component :is="user.icon" />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[16px] font-semibold text-text-primary">{{ user.name }}</span>
            <span
              class="rounded-full px-2 py-0.5 text-xs text-text-secondary"
              :style="{ background: `${user.color}1a` }"
            >
              {{ user.roleLabel }}
            </span>
          </div>
          <p class="min-h-10 text-[13px] leading-5 text-text-tertiary">{{ user.description }}</p>
          <div class="role-enter flex items-center gap-1">
            <span>{{ enteringId === user.id ? '正在进入…' : '进入系统' }}</span>
            <ArrowRightOutlined v-if="enteringId !== user.id" class="text-[11px]" />
          </div>
        </button>
      </div>

      <p class="mt-6 text-center text-xs text-text-placeholder">
        演示数据保存在本地浏览器，可随时通过顶栏"重置演示数据"恢复
      </p>
    </div>
  </div>
</template>
