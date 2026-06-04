'use client'
import { useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore()

  // Apply theme whenever it changes (including after store rehydration)
  useEffect(() => {
    const el = document.documentElement
    el.classList.toggle('light', theme === 'light')
    el.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <button
      onClick={toggle}
      className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost"
      title={theme === 'dark' ? 'تفعيل الثيم الفاتح' : 'تفعيل الثيم الداكن'}
      aria-label={theme === 'dark' ? 'تفعيل الثيم الفاتح' : 'تفعيل الثيم الداكن'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
