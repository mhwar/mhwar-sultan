'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, LayoutDashboard, FolderKanban, BarChart3, Settings, CornerDownLeft } from 'lucide-react'
import { useProjectStore } from '@/store/store'
import ProjectIcon from '@/lib/icons'

interface Command {
  id: string
  label: string
  hint?: string
  icon: React.ReactNode
  run: () => void
  group: string
}

/** Global ⌘K / Ctrl+K command palette — navigation + project jump. */
export default function CommandPalette() {
  const router = useRouter()
  const projects = useProjectStore((s) => s.projects)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global open shortcut + external trigger
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    const onTrigger = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onTrigger)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onTrigger)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const commands: Command[] = useMemo(() => {
    const nav: Command[] = [
      { id: 'nav-home', label: 'لوحة التحكم', icon: <LayoutDashboard size={16} />, run: () => router.push('/'), group: 'التنقل' },
      { id: 'nav-projects', label: 'المشاريع', icon: <FolderKanban size={16} />, run: () => router.push('/projects'), group: 'التنقل' },
      { id: 'nav-reports', label: 'التقارير', icon: <BarChart3 size={16} />, run: () => router.push('/reports'), group: 'التنقل' },
      { id: 'nav-settings', label: 'الإعدادات', icon: <Settings size={16} />, run: () => router.push('/settings'), group: 'التنقل' },
    ]
    const proj: Command[] = projects.map((p) => ({
      id: `proj-${p.id}`,
      label: p.name,
      hint: p.nameEn,
      icon: <ProjectIcon name={p.icon} size={16} />,
      run: () => router.push(`/projects/${p.id}`),
      group: 'المشاريع',
    }))
    return [...nav, ...proj]
  }, [projects, router])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q))
  }, [commands, query])

  // Group preserving order
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>()
    filtered.forEach((c) => {
      if (!map.has(c.group)) map.set(c.group, [])
      map.get(c.group)!.push(c)
    })
    return [...map.entries()]
  }, [filtered])

  if (!open) return null

  const select = (i: number) => {
    const cmd = filtered[i]
    if (!cmd) return
    cmd.run()
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    if (e.key === 'Enter') { e.preventDefault(); select(active) }
  }

  let flatIndex = -1

  return (
    <div className="palette-overlay" onClick={() => setOpen(false)}>
      <div className="palette" onClick={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="palette__search">
          <Search size={18} />
          <input
            ref={inputRef}
            placeholder="ابحث أو انتقل…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0) }}
          />
          <span className="axis-kbd">esc</span>
        </div>

        <div className="palette__list">
          {filtered.length === 0 && <div className="palette__empty">لا نتائج</div>}
          {groups.map(([group, items]) => (
            <div key={group} className="palette__section">
              <div className="palette__sectionTitle">{group}</div>
              {items.map((cmd) => {
                flatIndex++
                const i = flatIndex
                return (
                  <button
                    key={cmd.id}
                    className={`palette__row ${i === active ? 'is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => select(i)}
                  >
                    {cmd.icon}
                    <span>{cmd.label}</span>
                    {cmd.hint && <span className="axis-num" style={{ opacity: 0.6, direction: 'ltr' }}>{cmd.hint}</span>}
                    {i === active && <CornerDownLeft size={13} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="palette__footer">
          <span><span className="axis-kbd">↑↓</span> تنقل</span>
          <span><span className="axis-kbd">↵</span> فتح</span>
          <span><span className="axis-kbd">⌘K</span> فتح/إغلاق</span>
        </div>
      </div>
    </div>
  )
}
