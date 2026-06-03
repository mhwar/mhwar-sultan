import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  theme: 'dark' | 'light'
  toggle: () => void
  apply: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggle: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        document.documentElement.classList.toggle('light', next === 'light')
      },

      apply: () => {
        document.documentElement.classList.toggle('light', get().theme === 'light')
      },
    }),
    { name: 'mhwar-theme', version: 1, skipHydration: true }
  )
)
