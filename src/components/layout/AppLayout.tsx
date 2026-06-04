'use client'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import AppSidebar from './AppSidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: 'var(--color-surface-base)' }}>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header with hamburger */}
        <div
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
          style={{
            background: 'rgba(10, 10, 20, 0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
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
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Menu size={17} />
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}
