import { readDB } from '@/shared/mock/db';
import type { DemoUser } from '@/constants/roles';

/**
 * 认证 API（契约层）
 *
 * 当前为 Mock 实现（无后端演示模式）：
 * 模拟真实后端的登录响应结构，未来替换为真实请求时签名不变。
 */

export interface AuthResponse {
  token: string;
  user: DemoUser;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginAsUser(userId: string): Promise<AuthResponse> {
  await delay(250);
  const db = readDB();
  const user = db.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  return {
    token: `demo-token-${user.id}`,
    user,
  };
}
