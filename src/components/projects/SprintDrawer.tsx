'use client'
import { useEffect, useState } from 'react'
import { X, Trash2, Calendar, Clock, Target, Check, Flag, Hash, Zap } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useSprintStore, useTaskStore } from '@/store/store'
import type { Project, Sprint, SprintStatus } from '@/types'
import Segmented from '@/components/ui/Segmented'
import Field from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import Pill from '@/components/ui/Pill'
import { SPRINT_STATUS_LABELS, SPRINT_STATUSES } from '@/lib/sprint-utils'
import { TASK_STATUS_VAR, TASK_STATUS_LABELS, formatDateAr, hexToRgba } from '@/lib/utils'

const STATUS_OPTIONS = SPRINT_STATUSES.map((s) => ({ value: s, label: SPRINT_STATUS_LABELS[s] }))
const STATUS_PILL: Record<SprintStatus, 'neutral' | 'warning' | 'success'> = {
  planned: 'neutral',
  active: 'warning',
  completed: 'success',
}

const DAY = 24 * 3600 * 1000
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (v: string) => (v ? `${v}T00:00:00Z` : undefined)

interface SprintDrawerProps {
  sprint: Sprint | null
  project?: Project
  onClose: () => void
}

export default function SprintDrawer({ sprint, project, onClose }: SprintDrawerProps) {
  const { updateSprint, deleteSprint } = useSprintStore()
  const tasks = useTaskStore(useShallow((s) => (sprint ? s.tasks.filter((t) => t.sprintId === sprint.id) : [])))
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (sprint) requestAnimationFrame(() => setOpen(true))
  }, [sprint])

  const close = () => {
    setOpen(false)
    setTimeout(onClose, 320)
  }

  if (!sprint) return null

  const set = (data: Partial<Sprint>) => updateSprint(sprint.id, data)
  const accent = project?.color ?? 'var(--iris-500)'
  const accentHex = typeof accent === 'string' && accent.startsWith('#') ? accent : '#6366F1'

  const doneCount = tasks.filter((t) => t.status === 'done').length
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0
  const duration = sprint.startDate && sprint.dueDate
    ? Math.max(1, Math.round((new Date(sprint.dueDate).getTime() - new Date(sprint.startDate).getTime()) / DAY) + 1)
    : null

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 480 }}>

        {/* Accent header */}
        <div className="relative" style={{ background: `linear-gradient(135deg, ${hexToRgba(accentHex, 0.16)}, transparent 60%)` }}>
          <div style={{ height: 3, background: accent }} />
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap size={12} style={{ color: accent }} />
                  <span className="axis-label" style={{ letterSpacing: '0.06em' }}>سبرنت</span>
                </div>
                <textarea
                  value={sprint.name}
                  onChange={(e) => set({ name: e.target.value })}
                  rows={1}
                  className="w-full bg-transparent outline-none resize-none font-bold leading-snug"
                  style={{ color: 'var(--fg-1)', fontSize: '18px' }}
                />
              </div>
              <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0" onClick={close} aria-label="إغلاق">
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Pill variant={STATUS_PILL[sprint.status]}>{SPRINT_STATUS_LABELS[sprint.status]}</Pill>
              {tasks.length > 0 && <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>{pct}%</span>}
              <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>{doneCount}/{tasks.length} مهمة</span>
            </div>
            {tasks.length > 0 && (
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <div className="h-full rounded-full transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ width: `${pct}%`, background: accent }} />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="axis-drawer__body space-y-6" style={{ paddingTop: 20 }}>
          {/* Status */}
          <section>
            <div className="drawer-section__title">الحالة</div>
            <Segmented value={sprint.status} onChange={(v) => set({ status: v as SprintStatus })} options={STATUS_OPTIONS} />
          </section>

          {/* Goal */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><Target size={11} />هدف السبرنت</span>
            </div>
            <input
              value={sprint.goal ?? ''}
              onChange={(e) => set({ goal: e.target.value })}
              placeholder="ما الذي نريد تسليمه في هذا السبرنت؟"
              className="w-full text-sm px-3 py-2 outline-none"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
            />
          </section>

          {/* Dates */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><Calendar size={11} />التواريخ</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="البداية" type="date" dir="ltr" value={toDateInput(sprint.startDate)} onChange={(v) => set({ startDate: fromDateInput(v) })} />
              <Field label="النهاية" type="date" dir="ltr" value={toDateInput(sprint.dueDate)} onChange={(v) => set({ dueDate: fromDateInput(v) })} />
            </div>
            {duration && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--fg-3)' }}>
                <Clock size={12} />
                <span className="axis-num">المدة: {duration} يوم</span>
              </div>
            )}
          </section>

          {/* Tasks */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><Flag size={11} />المهام</span>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--fg-3)' }}>لا مهام في هذا السبرنت بعد</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TASK_STATUS_VAR[t.status] }} />
                    <span
                      className="text-sm flex-1 truncate"
                      style={{ color: t.status === 'done' ? 'var(--fg-3)' : 'var(--fg-2)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}
                    >
                      {t.title}
                    </span>
                    <span className="axis-num text-xs shrink-0" style={{ color: 'var(--fg-3)' }}>{TASK_STATUS_LABELS[t.status]}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Meta */}
          <section>
            <div className="detail-row">
              <span className="detail-row__label"><span className="inline-flex items-center gap-1.5"><Hash size={12} />المعرّف</span></span>
              <span className="detail-row__value axis-num" style={{ direction: 'ltr', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{sprint.id}</span>
            </div>
            {sprint.startDate && (
              <div className="detail-row">
                <span className="detail-row__label">البداية</span>
                <span className="detail-row__value axis-num">{formatDateAr(sprint.startDate)}</span>
              </div>
            )}
            {sprint.dueDate && (
              <div className="detail-row">
                <span className="detail-row__label">النهاية</span>
                <span className="detail-row__value axis-num">{formatDateAr(sprint.dueDate)}</span>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 20px', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <Button
            variant={sprint.status === 'completed' ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => set({ status: sprint.status === 'completed' ? 'active' : 'completed' })}
          >
            <Check size={13} />
            {sprint.status === 'completed' ? 'إعادة فتح' : 'إنهاء السبرنت'}
          </Button>
          <Button variant="danger" size="sm" onClick={() => { deleteSprint(sprint.id); close() }}>
            <Trash2 size={13} />
            حذف
          </Button>
        </div>
      </div>
    </div>
  )
}
