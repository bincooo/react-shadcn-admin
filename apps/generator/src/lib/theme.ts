const STORAGE_KEY = 'generator-theme'

export type ThemeMode = 'light' | 'dark'

function preferred(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // 隐私模式可能禁用 localStorage
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  document.documentElement.style.colorScheme = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // 忽略存储失败
  }
}

export function currentTheme(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function initTheme() {
  applyTheme(preferred())
}

export function toggleTheme(): ThemeMode {
  const next = currentTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
