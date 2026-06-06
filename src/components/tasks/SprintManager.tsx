'use client'
import { useEffect, useMemo, useState } from 'react'
import { X, Plus, Zap, Trash2, ChevronDown, ChevronUp, Calendar, CheckCircle2, Circle, Target } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useSprintStore, useProjectStore, useTaskStore } from '@/store/store'
import type { SprintStatus } from '@/types'
import { formatDateAr } from '@/lib/utils'

const STATUS_LABELS: Record<SprintStatus, string> = {
  planned: 'مخطط',
  active: 'نشطة',
  completed: 'مكتملة',
}
const STATUS_BG: Record<SprintStatus, string> = {
  planned: 'var(--info-500)',
  active: 'var(--success-500)',
  completed: 'var(--color-text-muted)',
}
const StatusIcon = ({ s }: { s: SprintStatus }) =>
  s === 'completed' ? <CheckCircle2 size={14} /> : s === 'active' ? <Zap size={14} /> : <Circle size={14} />

interface Props { onClose: () => void }

export default function SprintManager({ onClose }: Props) {
  const sprints = useSprintStore(useShallow((s) => s.sprints))
  const { addSprint, updateSprint, deleteSprint } = useSprintStore()
  const projects = useProjectStore(useShallow((s) => s.projects))
  const tasks = useTaskStore(useShallow((s) => s.tasks))
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { requestAnimationFrame(() => setOpen(true)) }, [])
  const close = () => { setOpen(false); setTimeout(onClose, 320) }

  const projName = (pid: string) =>
    pid === 'free' ? 'بلا مشروع' : (projects.find((p) => p.id === pid)?.name ?? pid)
  const projColor = (pid: string) =>
    projects.find((p) => p.id === pid)?.color ?? 'var(--iris-500)'

  const taskStats = useMemo(() => {
    const m = new Map<string, { total: number; done: number; inprog: number }>()
    for (const t of tasks) {
      if (!t.sprintId) continue
      const s = m.get(t.sprintId) ?? { total: 0, done: 0, inprog: 0 }
      s.total++
      if (t.status === 'done') s.done++
      else if (t.status === 'in-progress') s.inprog++
      m.set(t.sprintId, s)
    }
    return m
  }, [tasks])

  const sorted = useMemo(() =>
    [...sprints].sort((a, b) => {
      const order: Record<SprintStatus, number> = { active: 0, planned: 1, completed: 2 }
      return order[a.status] - order[b.status] || a.order - b.order
    }),
    [sprints]
  )

  const totals = useMemo(() => {
    let total = 0, done = 0
    taskStats.forEach((s) => { total += s.total; done += s.done })
    return { total, done }
  }, [taskStats])

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 560 }}>

        {/* ── Header ── */}
        <div className="axis-drawer__head">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in oklch, var(--iris-500) 15%, transparent)' }}
            >
              <Zap size={17} style={{ color: 'var(--iris-500)' }} />
            </div>
            <div className="min-w-0">
              <p className="axis-drawer__title">إدارة المراحل</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                <span className="axis-num">{sprints.length}</span> مرحلة ·{' '}
                <span className="axis-num">{totals.done}</span>/<span className="axis-num">{totals.total}</span> مهمة منجزة
              </p>
            </div>
          </div>
          <button
            className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0"
            onClick={close}
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="axis-drawer__body space-y-3">

          {/* Add button */}
          {!adding && (
            <button
              onClick={() => { setAdding(true); setExpandedId(null) }}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{
                background: 'color-mix(in oklch, var(--iris-500) 10%, transparent)',
                color: 'var(--iris-500)',
                border: '1px dashed color-mix(in oklch, var(--iris-500) 40%, transparent)',
              }}
            >
              <Plus size={15} /> مرحلة جديدة
            </button>
          )}

          {/* Add form */}
          {adding && (
            <AddPhaseForm
              projects={projects}
              onSave={(d) => {
                addSprint(d.projectId || 'free', d.name, {
                  startDate: d.startDate,
                  dueDate: d.dueDate,
                  goal: d.goal,
                  status: d.status,
                })
                setAdding(false)
              }}
              onCancel={() => setAdding(false)}
            />
          )}

          {/* Empty state */}
          {sorted.length === 0 && !adding && (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'var(--color-surface-overlay)' }}
              >
                <Zap size={28} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>لا مراحل بعد</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                أنشئ مرحلة لتجميع مهام المشروع وتتبع تقدمه
              </p>
            </div>
          )}

          {/* Phase cards */}
          <div className="space-y-2">
            {sorted.map((sp) => {
              const stats = taskStats.get(sp.id) ?? { total: 0, done: 0, inprog: 0 }
              const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
              const color = projColor(sp.projectId)
              const isExpanded = expandedId === sp.id

              return (
                <div
                  key={sp.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--color-surface-border)', background: 'var(--color-surface-muted)' }}
                >
                  {/* Project color top bar */}
                  <div style={{ height: 3, background: sp.projectId === 'free' ? 'var(--color-surface-border)' : color }} />

                  <div className="p-3 space-y-2">
                    {/* Top row: status icon + name + badges + actions */}
                    <div className="flex items-start gap-2">
                      <span style={{ color: STATUS_BG[sp.status], marginTop: 2, flexShrink: 0 }}>
                        <StatusIcon s={sp.status} />
                      </span>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                          {sp.name}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {projName(sp.projectId)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Status badge */}
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: STATUS_BG[sp.status] + '22',
                            color: STATUS_BG[sp.status],
                          }}
                        >
                          {STATUS_LABELS[sp.status]}
                        </span>
                        {/* Expand/collapse */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : sp.id)}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                          style={{ color: 'var(--color-text-muted)' }}
                          aria-label={isExpanded ? 'طي' : 'تعديل'}
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => { if (confirm(`حذف مرحلة "${sp.name}"؟`)) deleteSprint(sp.id) }}
                          className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                          style={{ color: 'var(--danger-500)' }}
                          aria-label="حذف"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Goal */}
                    {sp.goal && !isExpanded && (
                      <p className="text-xs ps-5 pe-8 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {sp.goal}
                      </p>
                    )}

                    {/* Date range + task stats row */}
                    <div className="flex items-center justify-between gap-2 ps-5">
                      {(sp.startDate || sp.dueDate) ? (
                        <div className="flex items-center gap-1 text-xs axis-num" style={{ color: 'var(--color-text-muted)' }}>
                          <Calendar size={11} />
                          {sp.startDate && <span>{formatDateAr(sp.startDate)}</span>}
                          {sp.startDate && sp.dueDate && <span className="mx-0.5">←</span>}
                          {sp.dueDate && <span>{formatDateAr(sp.dueDate)}</span>}
                        </div>
                      ) : <span />}

                      {stats.total > 0 && (
                        <span className="text-xs axis-num shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                          {stats.done}/{stats.total} مهمة
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {stats.total > 0 && (
                      <div className="ps-5 space-y-1">
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-overlay)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {stats.done > 0 && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={10} style={{ color: 'var(--success-500)' }} />
                              <span className="axis-num">{stats.done}</span> منجز
                            </span>
                          )}
                          {stats.inprog > 0 && (
                            <span className="flex items-center gap-1">
                              <Zap size={10} style={{ color: 'var(--warning-500)' }} />
                              <span className="axis-num">{stats.inprog}</span> جارٍ
                            </span>
                          )}
                          <span className="axis-num ms-auto">{pct}%</span>
                        </div>
                      </div>
                    )}

                    {/* ── Inline edit form ── */}
                    {isExpanded && (
                      <div
                        className="mt-2 pt-3 border-t space-y-3"
                        style={{ borderColor: 'var(--color-surface-border)' }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>تعديل المرحلة</p>

                        {/* Name */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الاسم</label>
                          <input
                            key={sp.id + '-name'}
                            defaultValue={sp.name}
                            onBlur={(e) => {
                              const v = e.target.value.trim()
                              if (v && v !== sp.name) updateSprint(sp.id, { name: v })
                            }}
                            className="h-8 rounded-md px-2 text-sm outline-none"
                            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
                          />
                        </div>

                        {/* Status + Project */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الحالة</label>
                            <select
                              value={sp.status}
                              onChange={(e) => updateSprint(sp.id, { status: e.target.value as SprintStatus })}
                              className="h-8 rounded-md px-2 text-xs outline-none"
                              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
                            >
                              {(Object.entries(STATUS_LABELS) as [SprintStatus, string][]).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>المشروع</label>
                            <select
                              value={sp.projectId === 'free' ? '' : sp.projectId}
                              onChange={(e) => updateSprint(sp.id, { projectId: e.target.value || 'free' })}
                              className="h-8 rounded-md px-2 text-xs outline-none"
                              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
                            >
                              <option value="">بلا مشروع</option>
                              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>تاريخ البداية</label>
                            <input
                              key={sp.id + '-start'}
                              type="date"
                              defaultValue={sp.startDate ? sp.startDate.slice(0, 10) : ''}
                              onBlur={(e) => updateSprint(sp.id, { startDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
                              dir="ltr"
                              className="h-8 rounded-md px-2 text-xs outline-none"
                              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>تاريخ الانتهاء</label>
                            <input
                              key={sp.id + '-due'}
                              type="date"
                              defaultValue={sp.dueDate ? sp.dueDate.slice(0, 10) : ''}
                              onBlur={(e) => updateSprint(sp.id, { dueDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
                              dir="ltr"
                              className="h-8 rounded-md px-2 text-xs outline-none"
                              style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
                            />
                          </div>
                        </div>

                        {/* Goal */}
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                            <Target size={11} /> الهدف
                          </label>
                          <input
                            key={sp.id + '-goal'}
                            defaultValue={sp.goal ?? ''}
                            onBlur={(e) => updateSprint(sp.id, { goal: e.target.value.trim() || undefined })}
                            placeholder="ما الذي تنجزه هذه المرحلة؟"
                            className="h-8 rounded-md px-2 text-sm outline-none"
                            style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
                          />
                        </div>

                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-xs font-medium px-3 h-7 rounded-md transition-colors hover:bg-white/5"
                          style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
                        >
                          تم
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Add Phase Form ── */
interface FormData {
  name: string
  projectId: string
  startDate: string
  dueDate: string
  goal: string
  status: SprintStatus
}

function AddPhaseForm({
  projects,
  onSave,
  onCancel,
}: {
  projects: { id: string; name: string }[]
  onSave: (d: FormData) => void
  onCancel: () => void
}) {
  const [f, setF] = useState<FormData>({ name: '', projectId: '', startDate: '', dueDate: '', goal: '', status: 'planned' })
  const set = (v: Partial<FormData>) => setF((p) => ({ ...p, ...v }))
  const toISO = (d: string) => (d ? `${d}T00:00:00Z` : '')

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--iris-500)', boxShadow: '0 0 0 3px color-mix(in oklch, var(--iris-500) 12%, transparent)' }}
    >
      <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>مرحلة جديدة</p>

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الاسم *</label>
        <input
          autoFocus
          value={f.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="مثال: مرحلة التجهيز للملتقى"
          className="h-9 rounded-lg px-3 text-sm outline-none w-full"
          style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* Project + Status */}
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
            <option value="active">نشطة</option>
            <option value="completed">مكتملة</option>
          </select>
        </div>
      </div>

      {/* Dates */}
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

      {/* Goal */}
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

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
        >
          إلغاء
        </button>
        <button
          onClick={() => f.name.trim() && onSave({ ...f, startDate: toISO(f.startDate), dueDate: toISO(f.dueDate) })}
          disabled={!f.name.trim()}
          className="px-4 h-8 rounded-md text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ background: 'var(--iris-500)', color: 'white' }}
        >
          إضافة المرحلة
        </button>
      </div>
    </div>
  )
}
