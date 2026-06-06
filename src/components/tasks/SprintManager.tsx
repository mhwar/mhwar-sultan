'use client'
import { useEffect, useState } from 'react'
import { X, Plus, Zap, Trash2 } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useSprintStore, useProjectStore } from '@/store/store'
import type { SprintStatus } from '@/types'
import { formatDateAr } from '@/lib/utils'

const STATUS_LABELS: Record<SprintStatus, string> = {
  planned: 'مخطط',
  active: 'نشط',
  completed: 'مكتمل',
}
const STATUS_COLOR: Record<SprintStatus, string> = {
  planned: 'var(--info-500)',
  active: 'var(--success-500)',
  completed: 'var(--color-text-muted)',
}

interface Props { onClose: () => void }

export default function SprintManager({ onClose }: Props) {
  const sprints = useSprintStore(useShallow((s) => s.sprints))
  const { addSprint, updateSprint, deleteSprint } = useSprintStore()
  const projects = useProjectStore(useShallow((s) => s.projects))
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setOpen(true)) }, [])
  const close = () => { setOpen(false); setTimeout(onClose, 320) }

  const projectName = (pid: string) =>
    pid === 'free' ? 'بلا مشروع' : (projects.find((p) => p.id === pid)?.name ?? pid)

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 480 }}>
        <div className="axis-drawer__head">
          <div className="flex items-center gap-2 flex-1">
            <Zap size={18} style={{ color: 'var(--iris-500)' }} />
            <span className="axis-drawer__title">المراحل</span>
          </div>
          <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0" onClick={close} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>

        <div className="axis-drawer__body space-y-3">
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: 'color-mix(in oklch, var(--iris-500) 12%, transparent)', color: 'var(--iris-500)', border: '1px dashed color-mix(in oklch, var(--iris-500) 40%, transparent)' }}
            >
              <Plus size={15} /> مرحلة جديدة
            </button>
          )}

          {adding && (
            <SprintForm
              projects={projects}
              onSave={(data) => {
                addSprint(data.projectId || 'free', data.name, {
                  startDate: data.startDate,
                  dueDate: data.dueDate,
                  goal: data.goal,
                  status: data.status,
                })
                setAdding(false)
              }}
              onCancel={() => setAdding(false)}
            />
          )}

          {sprints.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>لا مراحل بعد</p>
          ) : (
            <div className="space-y-2">
              {[...sprints].reverse().map((sp) => (
                <div
                  key={sp.id}
                  className="rounded-xl p-3 space-y-1"
                  style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)' }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{sp.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{projectName(sp.projectId)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in oklch, currentColor 12%, transparent)', color: STATUS_COLOR[sp.status] }}>
                        {STATUS_LABELS[sp.status]}
                      </span>
                      <button
                        onClick={() => deleteSprint(sp.id)}
                        className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                        style={{ color: 'var(--danger-500)' }}
                        aria-label="حذف"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {sp.goal && (
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{sp.goal}</p>
                  )}
                  {(sp.startDate || sp.dueDate) && (
                    <div className="flex items-center gap-2 text-xs axis-num" style={{ color: 'var(--color-text-muted)' }}>
                      {sp.startDate && <span>{formatDateAr(sp.startDate)}</span>}
                      {sp.startDate && sp.dueDate && <span>←</span>}
                      {sp.dueDate && <span>{formatDateAr(sp.dueDate)}</span>}
                    </div>
                  )}
                  {/* Status toggle */}
                  <select
                    value={sp.status}
                    onChange={(e) => updateSprint(sp.id, { status: e.target.value as SprintStatus })}
                    className="mt-1 h-7 rounded px-2 text-xs outline-none"
                    style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
                  >
                    {(Object.entries(STATUS_LABELS) as [SprintStatus, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface FormData {
  name: string
  projectId: string
  startDate: string
  dueDate: string
  goal: string
  status: SprintStatus
}

function SprintForm({ projects, onSave, onCancel }: { projects: { id: string; name: string }[]; onSave: (d: FormData) => void; onCancel: () => void }) {
  const [f, setF] = useState<FormData>({ name: '', projectId: '', startDate: '', dueDate: '', goal: '', status: 'planned' })
  const set = (v: Partial<FormData>) => setF((p) => ({ ...p, ...v }))

  const toISO = (d: string) => d ? `${d}T00:00:00Z` : undefined

  return (
    <div className="rounded-xl p-3 space-y-3" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)' }}>
      <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>مرحلة جديدة</p>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الاسم *</label>
        <input
          value={f.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="مثال: مرحلة التجهيز"
          className="h-8 rounded-md px-2 text-sm outline-none w-full"
          style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>المشروع</label>
          <select
            value={f.projectId}
            onChange={(e) => set({ projectId: e.target.value })}
            className="h-8 rounded-md px-2 text-xs outline-none"
            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
          >
            <option value="">بلا مشروع</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الحالة</label>
          <select
            value={f.status}
            onChange={(e) => set({ status: e.target.value as SprintStatus })}
            className="h-8 rounded-md px-2 text-xs outline-none"
            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
          >
            <option value="planned">مخطط</option>
            <option value="active">نشط</option>
            <option value="completed">مكتمل</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>تاريخ البداية</label>
          <input
            type="date"
            value={f.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            dir="ltr"
            className="h-8 rounded-md px-2 text-xs outline-none"
            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>تاريخ الانتهاء</label>
          <input
            type="date"
            value={f.dueDate}
            onChange={(e) => set({ dueDate: e.target.value })}
            dir="ltr"
            className="h-8 rounded-md px-2 text-xs outline-none"
            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الهدف (اختياري)</label>
        <input
          value={f.goal}
          onChange={(e) => set({ goal: e.target.value })}
          placeholder="ما الذي تنجزه هذه المرحلة؟"
          className="h-8 rounded-md px-2 text-sm outline-none w-full"
          style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
        >
          إلغاء
        </button>
        <button
          onClick={() => f.name.trim() && onSave({ ...f, startDate: toISO(f.startDate) as string, dueDate: toISO(f.dueDate) as string })}
          disabled={!f.name.trim()}
          className="px-4 h-8 rounded-md text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--iris-500)', color: 'white' }}
        >
          حفظ
        </button>
      </div>
    </div>
  )
}
