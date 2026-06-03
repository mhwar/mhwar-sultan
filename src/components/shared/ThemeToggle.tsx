'use client'
import { useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export default function ThemeToggle() {
  const { theme, toggle, apply } = useThemeStore()

  // Apply theme whenever it changes (including after store rehydration)
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
      style={{
        background: theme === 'light' ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(128,128,128,0.15)',
        color: theme === 'light' ? '#6366F1' : '#94A3B8',
      }}
      title={theme === 'dark' ? 'تفعيل الثيم الفاتح' : 'تفعيل الثيم الداكن'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
