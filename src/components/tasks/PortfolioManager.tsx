'use client'
import { useEffect, useRef, useState } from 'react'
import { X, Plus, Trash2, Check, Pencil, Briefcase, ImagePlus } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { usePortfolioStore, useProjectStore } from '@/store/store'
import type { Portfolio } from '@/types'
import ProjectIcon, { PROJECT_ICON_KEYS } from '@/lib/icons'
import ProjectForm from '@/components/projects/ProjectForm'

const COLOR_OPTIONS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#06B6D4']

interface Props { onClose: () => void }

export default function PortfolioManager({ onClose }: Props) {
  const portfolios = usePortfolioStore(useShallow((s) => s.portfolios))
  const { addPortfolio, updatePortfolio, deletePortfolio } = usePortfolioStore()
  const projects = useProjectStore(useShallow((s) => s.projects))
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [showNewProject, setShowNewProject] = useState<string | null>(null) // portfolioId for which project is being created

  useEffect(() => { requestAnimationFrame(() => setOpen(true)) }, [])
  const close = () => { setOpen(false); setTimeout(onClose, 320) }

  return (
    <>
      <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
        <div className="axis-drawer-overlay__scrim" onClick={close} />
        <div className="axis-drawer" style={{ width: 480 }}>
          <div className="axis-drawer__head">
            <div className="flex items-center gap-2 flex-1">
              <Briefcase size={18} style={{ color: 'var(--iris-500)' }} />
              <span className="axis-drawer__title">المحافظ</span>
            </div>
            <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0" onClick={close} aria-label="إغلاق">
              <X size={16} />
            </button>
          </div>

          <div className="axis-drawer__body space-y-3">
            {!adding && (
              <button
                onClick={() => { setAdding(true); setEditId(null) }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'color-mix(in oklch, var(--iris-500) 12%, transparent)', color: 'var(--iris-500)', border: '1px dashed color-mix(in oklch, var(--iris-500) 40%, transparent)' }}
              >
                <Plus size={15} /> محفظة جديدة
              </button>
            )}

            {adding && (
              <PortfolioForm
                projects={projects}
                onSave={(d) => { addPortfolio(d); setAdding(false) }}
                onCancel={() => setAdding(false)}
                onNewProject={() => setShowNewProject('__new')}
              />
            )}

            {portfolios.map((pf) =>
              editId === pf.id ? (
                <PortfolioForm
                  key={pf.id}
                  initial={pf}
                  projects={projects}
                  onSave={(d) => { updatePortfolio(pf.id, d); setEditId(null) }}
                  onCancel={() => setEditId(null)}
                  onNewProject={() => setShowNewProject(pf.id)}
                />
              ) : (
                <PortfolioCard
                  key={pf.id}
                  portfolio={pf}
                  projectCount={pf.projectIds.length}
                  onEdit={() => { setEditId(pf.id); setAdding(false) }}
                  onDelete={() => deletePortfolio(pf.id)}
                  onNewProject={() => setShowNewProject(pf.id)}
                />
              )
            )}

            {portfolios.length === 0 && !adding && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>لا محافظ بعد — أنشئ واحدة لتجميع مشاريعك</p>
            )}
          </div>
        </div>
      </div>

      {/* New project modal (opens over the drawer) */}
      {showNewProject !== null && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowNewProject(null)} />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-surface-border)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
              <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>مشروع جديد</p>
              <button className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" onClick={() => setShowNewProject(null)}><X size={14} /></button>
            </div>
            <div className="p-4">
              <ProjectForm
                onClose={() => setShowNewProject(null)}
                onSaved={(newId) => {
                  if (showNewProject && showNewProject !== '__new') {
                    const pf = portfolios.find((p) => p.id === showNewProject)
                    if (pf) {
                      updatePortfolio(showNewProject, { projectIds: [...pf.projectIds, newId] })
                    }
                  }
                  setShowNewProject(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PortfolioCard({ portfolio: pf, projectCount, onEdit, onDelete, onNewProject }: {
  portfolio: Portfolio
  projectCount: number
  onEdit: () => void
  onDelete: () => void
  onNewProject: () => void
}) {
  return (
    <div className="group rounded-xl overflow-hidden" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
      {/* Color strip */}
      <div style={{ height: 3, background: pf.color }} />
      <div className="flex items-start gap-3 p-3">
        {/* Logo or icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `color-mix(in oklch, ${pf.color} 18%, transparent)`, color: pf.color }}>
          {pf.logo
            ? <img src={pf.logo} alt="" className="w-full h-full object-cover" />
            : <ProjectIcon name={pf.icon} size={18} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{pf.name}</p>
          {pf.description && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{pf.description}</p>}
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            <span className="axis-num">{projectCount}</span> مشروع
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onNewProject}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 h-6 rounded text-xs transition-all"
            style={{ color: 'var(--iris-500)', border: '1px solid color-mix(in oklch, var(--iris-500) 30%, transparent)' }}
          >
            <Plus size={11} /> مشروع
          </button>
          <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all hover:bg-white/10" style={{ color: 'var(--color-text-muted)' }} aria-label="تعديل">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all" style={{ color: 'var(--danger-500)' }} aria-label="حذف">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PortfolioForm({
  initial, projects, onSave, onCancel, onNewProject,
}: {
  initial?: Portfolio
  projects: { id: string; name: string; color: string; icon?: string }[]
  onSave: (d: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  onNewProject: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0])
  const [icon, setIcon] = useState(initial?.icon ?? 'folder')
  const [logo, setLogo] = useState(initial?.logo ?? '')
  const [projectIds, setProjectIds] = useState<string[]>(initial?.projectIds ?? [])
  const logoRef = useRef<HTMLInputElement>(null)

  const toggle = (id: string) => setProjectIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const save = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), description: description.trim() || undefined, color, icon, logo: logo || undefined, projectIds })
  }

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      {/* Logo + name row */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: `color-mix(in oklch, ${color} 18%, transparent)`, color }}>
            {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <ProjectIcon name={icon} size={22} />}
          </div>
          <button
            type="button"
            onClick={() => logoRef.current?.click()}
            className="text-xs px-1.5 py-0.5 rounded transition-colors hover:bg-white/8"
            style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
          >
            <ImagePlus size={11} />
          </button>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onPickLogo} />
          {logo && (
            <button type="button" onClick={() => setLogo('')} className="text-xs" style={{ color: 'var(--danger-500)' }}>
              <X size={10} />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <label className="axis-label mb-1 block">اسم المحفظة *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: منتجات رقمية"
              autoFocus
              className="w-full h-8 rounded-md px-2 text-sm outline-none"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label className="axis-label mb-1 block">الوصف</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف قصير للمحفظة…"
              className="w-full h-8 rounded-md px-2 text-sm outline-none"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Icon picker */}
      <div>
        <label className="axis-label mb-1.5 block">الأيقونة</label>
        <div className="flex flex-wrap gap-1">
          {PROJECT_ICON_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setIcon(k)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
              style={{
                background: icon === k ? color : 'var(--color-surface-muted)',
                color: icon === k ? 'white' : 'var(--color-text-secondary)',
                border: `1px solid ${icon === k ? 'transparent' : 'var(--color-surface-border)'}`,
              }}
              aria-label={k}
              title={k}
            >
              <ProjectIcon name={k} size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label className="axis-label mb-1.5 block">اللون</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
              style={{ background: c, outline: color === c ? '2px solid var(--color-text-primary)' : 'none', outlineOffset: 2 }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="axis-label">المشاريع</label>
          <button
            type="button"
            onClick={onNewProject}
            className="flex items-center gap-1 text-xs px-2 h-6 rounded transition-colors hover:bg-white/8"
            style={{ color: 'var(--iris-500)', border: '1px solid color-mix(in oklch, var(--iris-500) 30%, transparent)' }}
          >
            <Plus size={11} /> مشروع جديد
          </button>
        </div>
        {projects.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>لا مشاريع — أنشئ مشروعاً أولاً</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {projects.map((p) => {
              const on = projectIds.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="px-2.5 h-7 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                  style={{
                    background: on ? p.color : 'var(--color-surface-muted)',
                    color: on ? 'white' : 'var(--color-text-secondary)',
                    border: `1px solid ${on ? 'transparent' : 'var(--color-surface-border)'}`,
                  }}
                >
                  {!on && <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />}
                  {on && <Check size={11} />}
                  {p.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={save} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Check size={12} /> حفظ
        </button>
        <button type="button" onClick={onCancel} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          <X size={12} /> إلغاء
        </button>
      </div>
    </div>
  )
}
