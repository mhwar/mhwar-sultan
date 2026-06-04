import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  theme: 'dark' | 'light'
  toggle: () => void
  apply: () => void
}

// Keep the legacy `.light` class and the Axis `data-theme` attribute in sync.
function applyTheme(theme: 'dark' | 'light') {
  const el = document.documentElement
  el.classList.toggle('light', theme === 'light')
  el.setAttribute('data-theme', theme)
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        applyTheme(next)
      },

      apply: () => {
        applyTheme(get().theme)
      },
    }),
    { name: 'mhwar-theme', version: 1, skipHydration: true }
  )
)
