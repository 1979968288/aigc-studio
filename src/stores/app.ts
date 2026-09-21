import { defineStore } from 'pinia';

const PREFS_KEY = 'aigc_studio_app_prefs';

export type ThemeMode = 'light' | 'dark';

interface AppPreferences {
  theme: ThemeMode;
}

function loadPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppPreferences>;
      if (parsed.theme === 'dark' || parsed.theme === 'light') {
        return { theme: parsed.theme };
      }
    }
  } catch {
    // 忽略损坏数据
  }
  return { theme: 'light' };
}

/** 应用级状态：主题等全局偏好 */
export const useAppStore = defineStore('app', () => {
  const theme = ref<ThemeMode>(loadPreferences().theme);

  function persist(): void {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ theme: theme.value } satisfies AppPreferences));
  }

  function applyThemeToDOM(mode: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', mode);
  }

  function setTheme(mode: ThemeMode): void {
    theme.value = mode;
    applyThemeToDOM(mode);
    persist();
  }

  function toggleTheme(): void {
    setTheme(theme.value === 'light' ? 'dark' : 'light');
  }

  /** 启动同步：store 与 DOM 属性对齐（index.html 已提前写入避免闪屏） */
  function initTheme(): void {
    applyThemeToDOM(theme.value);
  }

  return { theme, setTheme, toggleTheme, initTheme };
});
