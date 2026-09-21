import { defineStore } from 'pinia';
import { loginAsUser } from '@/modules/auth/api';
import { DEMO_USERS, type DemoUser } from '@/constants/roles';

const AUTH_KEY = 'aigc_studio_auth';

interface PersistedAuth {
  token: string;
  userId: string;
}

function persistAuth(token: string, user: DemoUser): void {
  localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({ token, userId: user.id } satisfies PersistedAuth)
  );
}

function clearPersistedAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

function restoreUser(): { token: string; user: DemoUser } | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedAuth;
    if (!parsed.token || !parsed.userId) return null;
    const user = DEMO_USERS.find((item) => item.id === parsed.userId);
    return user ? { token: parsed.token, user } : null;
  } catch {
    return null;
  }
}

/** 认证状态：演示模式下的当前用户（角色切换即重新登录） */
export const useAuthStore = defineStore('auth', () => {
  const restored = restoreUser();
  // 演示模式：无持久化时自动以默认用户（制片）登录，跳过选人页
  const fallback = restored ?? {
    token: `demo-token-${DEMO_USERS[0].id}`,
    user: DEMO_USERS[0],
  };
  if (!restored) {
    persistAuth(fallback.token, fallback.user);
  }
  const token = ref(fallback.token);
  const currentUser = ref<DemoUser | null>(fallback.user);

  const isAuthenticated = computed(() => currentUser.value !== null);

  async function loginAs(user: DemoUser): Promise<void> {
    const response = await loginAsUser(user.id);
    token.value = response.token;
    currentUser.value = response.user;
    persistAuth(response.token, response.user);
  }

  function logout(): void {
    token.value = '';
    currentUser.value = null;
    clearPersistedAuth();
  }

  return { token, currentUser, isAuthenticated, loginAs, logout };
});
