import { theme as antdTheme } from 'ant-design-vue';
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';

/**
 * Ant Design Vue 主题桥（对齐 KMOKE4 设计）
 *
 * variables.css 是主题单一事实源；本桥在运行时读取
 * CSS 变量计算值并映射为 AntD ThemeConfig，使组件库
 * 与自定义 token 保持同源，明暗主题一次切换全站生效。
 */

export type ThemeName = 'light' | 'dark';

const cache = new Map<ThemeName, ThemeConfig>();

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function readRadius(name: string, fallback: number): number {
  const value = Number.parseInt(readVar(name), 10);
  return Number.isFinite(value) ? value : fallback;
}

export function getAntdThemeConfig(mode: ThemeName): ThemeConfig {
  const cached = cache.get(mode);
  if (cached) {
    return cached;
  }

  const config: ThemeConfig = {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: readVar('--color-action-primary'),
      colorBgContainer: readVar('--color-bg-surface'),
      colorBgLayout: readVar('--color-bg-page'),
      colorBgElevated: readVar('--color-bg-elevated'),
      colorText: readVar('--color-text-primary'),
      colorTextSecondary: readVar('--color-text-secondary'),
      colorTextTertiary: readVar('--color-text-tertiary'),
      colorTextDisabled: readVar('--color-text-disabled'),
      colorBorder: readVar('--color-border-default'),
      colorBorderSecondary: readVar('--color-border-divider'),
      colorLink: readVar('--color-action-link'),
      colorLinkHover: readVar('--color-action-link-hover'),
      colorSuccess: readVar('--color-feedback-success'),
      colorWarning: readVar('--color-feedback-warning'),
      colorError: readVar('--color-feedback-error'),
      colorInfo: readVar('--color-feedback-info'),
      borderRadius: readRadius('--radius-3', 6),
      borderRadiusSM: readRadius('--radius-2', 4),
      borderRadiusLG: readRadius('--radius-4', 8),
      controlHeight: readControlHeight(),
      fontFamily: readVar('--font-family-sans'),
      fontSize: 14,
    },
  };

  cache.set(mode, config);
  return config;
}

function readControlHeight(): number {
  const value = Number.parseInt(readVar('--control-height'), 10);
  return Number.isFinite(value) ? value : 32;
}
