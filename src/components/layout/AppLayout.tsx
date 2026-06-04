'use client'
import { useState } from 'react'
import { Menu, Search } from 'lucide-react'
import AppSidebar from './AppSidebar'
import CommandPalette from '@/components/shared/CommandPalette'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--color-surface-base)' }}>
      <CommandPalette />
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header with hamburger */}
        <div
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{
            background: 'var(--glass-bg)',
            borderBottom: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'var(--color-brand)' }}
            >
              م
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>محور</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--color-text-secondary)' }}
              aria-label="بحث"
            >
              <Search size={16} />
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--color-text-secondary)',
              }}
              aria-label="القائمة"
            >
              <Menu size={17} />
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
