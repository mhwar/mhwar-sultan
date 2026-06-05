'use client'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { LayoutDashboard, FolderKanban, BarChart3, Settings, Plus, X, Search, Wallet } from 'lucide-react'
import { useProjectStore } from '@/store/store'
import ThemeToggle from '@/components/shared/ThemeToggle'

const navItems = [
  { href: '/',         label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/projects', label: 'المشاريع',    icon: FolderKanban    },
  { href: '/reports',  label: 'التقارير',    icon: BarChart3       },
]

interface AppSidebarProps {
  open: boolean
  onClose: () => void
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeProjectId = pathname === '/project' ? searchParams.get('id') : null
  const projects = useProjectStore((s) => s.projects)

  // Auto-close on navigation (mobile only — md:hidden backdrop handles visual)
  useEffect(() => {
    onClose()
  }, [pathname, activeProjectId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'oklch(0.10 0.01 260 / 0.45)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/*
        Sidebar — Axis glassmorphic floating panel
        Mobile  : fixed drawer, slides in from the start edge (right in RTL)
        Desktop : sticky floating card with a 12px gutter on all sides
      */}
      <aside
        className={[
          'fixed inset-y-0 right-0 z-50 w-72 flex flex-col p-3',
          'md:sticky md:top-0 md:h-dvh md:w-64 md:shrink-0 md:right-auto',
          'transition-transform duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
          'md:translate-x-0',
        ].join(' ')}
      >
        <div className="app-sidebar-panel flex flex-col flex-1 min-h-0 p-2.5">
          {/* Brand row */}
          <div className="flex items-center gap-2.5 px-2 pt-1 pb-3" style={{ minHeight: '44px' }}>
            <div
              className="w-7 h-7 flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{
                background: 'var(--color-iris-500)',
                borderRadius: '7px',
                boxShadow: 'inset 0 1px 0 0 oklch(0.40 0.16 275 / 0.4)',
              }}
            >
              م
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>محور</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>إدارة المشاريع</div>
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <button
                onClick={onClose}
                className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Search trigger */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="flex items-center gap-2 mb-2 px-2.5 h-8 w-full"
            style={{
              background: 'var(--surface-0)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--fg-3)',
            }}
          >
            <Search size={14} />
            <span className="text-xs flex-1 text-start">بحث</span>
            <span className="axis-kbd">⌘K</span>
          </button>

          {/* Primary navigation */}
          <nav className="flex flex-col gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`sidebar-nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Projects section */}
          <div className="flex-1 overflow-y-auto mt-4 min-h-0">
            <div
              className="flex items-center justify-between px-2.5 pb-1.5"
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.625rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              <span>المشاريع</span>
              <Link href="/projects" className="hover:text-iris-400 transition-colors" title="مشروع جديد">
                <Plus size={14} />
              </Link>
            </div>

            <div className="space-y-0.5">
              {projects.map((project) => {
                const isActive = activeProjectId === project.id
                return (
                  <Link
                    key={project.id}
                    href={`/project?id=${project.id}`}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-[120ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] group"
                    style={{
                      background: isActive ? 'var(--color-surface-overlay)' : 'transparent',
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      border: isActive ? '1px solid var(--color-surface-border)' : '1px solid transparent',
                      boxShadow: isActive ? 'var(--shadow-xs)' : 'none',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: project.color, opacity: isActive ? 1 : 0.6 }}
                    />
                    <span className="text-sm font-medium truncate flex-1">{project.name}</span>
                    <span
                      className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {project.progress}%
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Footer — settings + billing preview */}
          <div className="pt-2 mt-2 space-y-0.5" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
            <Link
              href="/billing"
              className={`sidebar-nav-item${pathname === '/billing' ? ' active' : ''}`}
            >
              <Wallet size={17} />
              <span>الرصيد والباقات</span>
              <span
                className="ms-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
              >
                معاينة
              </span>
            </Link>
            <Link
              href="/settings"
              className={`sidebar-nav-item${pathname === '/settings' ? ' active' : ''}`}
            >
              <Settings size={17} />
              <span>الإعدادات</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
