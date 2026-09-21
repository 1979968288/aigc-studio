<script setup lang="ts">
/**
 * 平台品牌标记（AIGC 制作管理系统）
 *
 * 设计语义：生成进度环（缺口环 + 端点光点）——环形代表持续生成，
 * 缺口与端点光点代表「正在生成 / 进度推进」，贴近 AI 产品语感。
 * 顶栏与登录页共用同一标记，保证品牌一致。
 */
defineOptions({ name: 'AppLogo' });

withDefaults(defineProps<{ size?: number }>(), { size: 32 });
</script>

<template>
  <span
    class="app-logo"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <svg class="app-logo__mark" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 6.5a9.5 9.5 0 1 1-8.2 4.7"
        stroke="currentColor"
        stroke-width="2.8"
        stroke-linecap="round"
        fill="none"
      />
      <circle cx="16" cy="16" r="3.4" fill="currentColor" />
    </svg>
  </span>
</template>

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
  border-radius: 30%;
  background: linear-gradient(
    135deg,
    var(--color-brand-primary),
    var(--color-brand-primary-hover)
  );
  color: #fff;
  box-shadow: var(--shadow-card);
}

.app-logo__mark {
  width: 75%;
  height: 75%;
}
</style>
