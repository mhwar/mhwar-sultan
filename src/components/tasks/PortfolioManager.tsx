'use client'
import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Check, Pencil, Briefcase } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { usePortfolioStore, useProjectStore } from '@/store/store'
import type { Portfolio } from '@/types'
import ProjectIcon from '@/lib/icons'

const COLOR_OPTIONS = ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#06B6D4']

interface Props { onClose: () => void }

export default function PortfolioManager({ onClose }: Props) {
  const portfolios = usePortfolioStore(useShallow((s) => s.portfolios))
  const { addPortfolio, updatePortfolio, deletePortfolio } = usePortfolioStore()
  const projects = useProjectStore(useShallow((s) => s.projects))
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setOpen(true)) }, [])
  const close = () => { setOpen(false); setTimeout(onClose, 320) }

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 440 }}>
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
              />
            ) : (
              <div
                key={pf.id}
                className="group flex items-center gap-3 rounded-xl p-3"
                style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in oklch, ${pf.color} 18%, transparent)`, color: pf.color }}>
                  <ProjectIcon name={pf.icon} size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{pf.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="axis-num">{pf.projectIds.length}</span> مشروع
                  </p>
                </div>
                <button onClick={() => { setEditId(pf.id); setAdding(false) }} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center transition-all hover:bg-white/10" style={{ color: 'var(--color-text-muted)' }} aria-label="تعديل">
                  <Pencil size={13} />
                </button>
                <button onClick={() => deletePortfolio(pf.id)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded flex items-center justify-center transition-all" style={{ color: 'var(--danger-500)' }} aria-label="حذف">
                  <Trash2 size={13} />
                </button>
              </div>
            )
          )}

          {portfolios.length === 0 && !adding && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>لا محافظ بعد — أنشئ واحدة لتجميع مشاريعك</p>
          )}
        </div>
      </div>
    </div>
  )
}

function PortfolioForm({
  initial, projects, onSave, onCancel,
}: {
  initial?: Portfolio
  projects: { id: string; name: string; color: string }[]
  onSave: (d: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0])
  const [projectIds, setProjectIds] = useState<string[]>(initial?.projectIds ?? [])

  const toggle = (id: string) => setProjectIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])
  const save = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), color, icon: initial?.icon ?? 'folder', projectIds })
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      <div>
        <label className="axis-label mb-1 block">اسم المحفظة</label>
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
        <label className="axis-label mb-1.5 block">اللون</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full transition-transform"
              style={{ background: c, outline: color === c ? '2px solid var(--color-text-primary)' : 'none', outlineOffset: 2 }}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="axis-label mb-1.5 block">المشاريع</label>
        <div className="flex flex-wrap gap-1.5">
          {projects.map((p) => {
            const on = projectIds.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className="px-2.5 h-7 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                style={{
                  background: on ? p.color : 'var(--color-surface-muted)',
                  color: on ? 'white' : 'var(--color-text-secondary)',
                  border: `1px solid ${on ? 'transparent' : 'var(--color-surface-border)'}`,
                }}
              >
                {!on && <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />}
                {p.name}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={save} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Check size={12} /> حفظ
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          <X size={12} /> إلغاء
        </button>
      </div>
    </div>
  )
}
