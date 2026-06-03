'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { LayoutDashboard, FolderKanban, Settings, Plus, X } from 'lucide-react'
import { useProjectStore } from '@/store/store'
import { hexToRgba } from '@/lib/utils'
import ThemeToggle from '@/components/shared/ThemeToggle'

const navItems = [
  { href: '/',         label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/projects', label: 'المشاريع',    icon: FolderKanban    },
]

interface AppSidebarProps {
  open: boolean
  onClose: () => void
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const projects = useProjectStore((s) => s.projects)

  // Auto-close on navigation (mobile only — md:hidden backdrop handles visual)
  useEffect(() => {
    onClose()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      {/*
        Sidebar
        Mobile  : fixed, right edge of screen (start-0 = right:0 in RTL),
                  hidden via translate-x-full, shown via translate-x-0
        Desktop : sticky in the flex layout — md:translate-x-0 overrides the
                  base translate-x-full because it's inside a media-query block
                  (higher cascade priority).  Inline styles are NOT used for
                  transform so the md: override actually works.
      */}
      <aside
        className={[
          // positioning
          'fixed inset-y-0 start-0 z-50 w-72 flex flex-col overflow-hidden',
          // desktop overrides
          'md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0',
          // slide animation — use Tailwind only (no inline transform)
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
          'md:translate-x-0',
        ].join(' ')}
        style={{
          background: 'var(--sidebar-bg, rgba(10,10,20,0.97))',
          borderInlineEnd: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo + close (mobile) */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
            >
              م
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>محور</div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>إدارة المشاريع</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mx-4 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Navigation */}
        <nav className="px-3 space-y-1 mb-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="sidebar-nav-item"
                style={isActive ? {
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366F1',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                } : {}}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mx-4 my-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Projects quick list */}
        <div className="px-3 flex-1 overflow-y-auto">
          <div
            className="flex items-center justify-between px-2 mb-2"
            style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 600 }}
          >
            <span>المشاريع</span>
            <Link href="/projects" className="hover:text-indigo-400 transition-colors" title="مشروع جديد">
              <Plus size={14} />
            </Link>
          </div>

          <div className="space-y-0.5">
            {projects.map((project) => {
              const isActive = pathname === `/projects/${project.id}`
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-200 group"
                  style={{
                    background: isActive ? hexToRgba(project.color, 0.1) : 'transparent',
                    color: isActive ? project.color : 'var(--color-text-secondary)',
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

        {/* Settings */}
        <div className="p-3 mt-auto">
          <div className="mx-1 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <Link
            href="/settings"
            className="sidebar-nav-item"
            style={pathname === '/settings' ? {
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#6366F1',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            } : {}}
          >
            <Settings size={17} />
            <span>الإعدادات</span>
          </Link>
        </div>
      </aside>
    </>
  )
}
