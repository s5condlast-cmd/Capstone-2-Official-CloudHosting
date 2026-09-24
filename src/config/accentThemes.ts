export const ACCENT_THEMES = [
  { id: 'default', color: 'bg-zinc-900 dark:bg-zinc-100', name: 'Monochrome' },
  { id: 'theme-deep-sky', color: 'bg-[#2F73AE]', name: 'Deep Sky Blue' },
  { id: 'theme-blue', color: 'bg-[#2563EB]', name: 'Modern Blue' },
  { id: 'theme-indigo', color: 'bg-[#4F46E5]', name: 'Indigo' },
  { id: 'theme-sti', color: 'bg-[#1D4ED8]', name: 'STI Inspired' },
  { id: 'theme-emerald', color: 'bg-[#15803D]', name: 'Emerald' },
  { id: 'theme-amber', color: 'bg-[#B45309]', name: 'Amber' },
  { id: 'theme-rose', color: 'bg-[#BE123C]', name: 'Rose' },
  { id: 'theme-plum', color: 'bg-[#7E22CE]', name: 'Plum' },
] as const

export type AccentThemeId = (typeof ACCENT_THEMES)[number]['id']

const DEFAULT_ACCENT_THEME: AccentThemeId = 'default'

const accentThemeIds = new Set<AccentThemeId>(
  ACCENT_THEMES.map((theme) => theme.id)
)

const accentThemeClasses = ACCENT_THEMES
  .map((theme) => theme.id)
  .filter((themeId): themeId is Exclude<AccentThemeId, 'default'> => themeId !== 'default')

// Clear the retired cyan class as well so it cannot compete with a selected accent.
const removableThemeClasses = [...accentThemeClasses, 'theme-cyan']

export function getStoredAccentTheme(): AccentThemeId {
  if (typeof window === 'undefined') return DEFAULT_ACCENT_THEME

  const storedTheme = window.localStorage.getItem('app-theme')
  return storedTheme && accentThemeIds.has(storedTheme as AccentThemeId)
    ? storedTheme as AccentThemeId
    : DEFAULT_ACCENT_THEME
}

export function applyAccentTheme(themeId: AccentThemeId): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  document.documentElement.classList.remove(...removableThemeClasses)
  if (themeId !== DEFAULT_ACCENT_THEME) {
    document.documentElement.classList.add(themeId)
  }
  window.localStorage.setItem('app-theme', themeId)
}
