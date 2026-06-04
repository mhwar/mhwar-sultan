'use client'
import { useEffect, useState } from 'react'
import {
  X, Trash2, Calendar, Clock, Target, Check, Link2,
  Plus, Hash, Flag, ListChecks, StickyNote, Layers,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { usePlanStore, useTaskStore } from '@/store/store'
import type { Project, PlanPhase, PhaseStatus } from '@/types'
import Segmented from '@/components/ui/Segmented'
import Field from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import Pill from '@/components/ui/Pill'
import SendToSprintMenu from '@/components/projects/SendToSprintMenu'
import { PlanIcon } from '@/lib/icons'
import { planKindMeta } from '@/lib/plan-kinds'
import { PHASE_STATUS_LABELS, TASK_STATUS_VAR, TASK_STATUS_LABELS, generateId, formatDateAr, formatDateShort } from '@/lib/utils'

const STATUS_OPTIONS: { value: PhaseStatus; label: string }[] = [
  { value: 'upcoming', label: PHASE_STATUS_LABELS.upcoming },
  { value: 'in-progress', label: PHASE_STATUS_LABELS['in-progress'] },
  { value: 'completed', label: PHASE_STATUS_LABELS.completed },
]

const STATUS_PILL: Record<PhaseStatus, 'neutral' | 'warning' | 'success'> = {
  upcoming: 'neutral',
  'in-progress': 'warning',
  completed: 'success',
}

const DAY = 24 * 3600 * 1000
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (v: string) => (v ? `${v}T00:00:00Z` : undefined)

interface PhaseDrawerProps {
  phase: PlanPhase | null
  project?: Project
  onClose: () => void
}

export default function PhaseDrawer({ phase, project, onClose }: PhaseDrawerProps) {
  const {
    updatePhase, deletePhase,
    toggleMilestone, addMilestone,
    addFeature, toggleFeature, deleteFeature,
  } = usePlanStore()
  const linkedTasks = useTaskStore(useShallow((s) =>
    phase ? s.tasks.filter((t) => t.phaseId === phase.id) : []
  ))
  const activePlan = usePlanStore((s) =>
    phase ? s.plans.find((p) => p.id === phase.planId) : undefined
  )

  const [open, setOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState('')
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    if (phase) requestAnimationFrame(() => setOpen(true))
  }, [phase])

  const close = () => {
    setOpen(false)
    setTimeout(onClose, 320)
  }

  if (!phase) return null

  const set = (data: Partial<PlanPhase>) => updatePhase(phase.id, data)
  const accent = project?.color ?? 'var(--iris-500)'
  const kindMeta = planKindMeta(activePlan?.kind)

  const standaloneTasks = linkedTasks.filter((t) => !t.milestoneId)
  const totalUnits = phase.milestones.length + standaloneTasks.length
  const doneUnits =
    phase.milestones.filter((m) => m.done).length +
    standaloneTasks.filter((t) => t.status === 'done').length
  const pct = totalUnits ? Math.round((doneUnits / totalUnits) * 100) : 0

  const duration =
    phase.startDate && phase.dueDate
      ? Math.max(1, Math.round((new Date(phase.dueDate).getTime() - new Date(phase.startDate).getTime()) / DAY) + 1)
      : null

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return
    addMilestone(phase.id, newMilestone.trim())
    setNewMilestone('')
  }

  const handleAddFeature = () => {
    if (!newFeature.trim()) return
    addFeature(phase.id, newFeature.trim())
    setNewFeature('')
  }

  const accentHex = typeof accent === 'string' && accent.startsWith('#') ? accent : '#6366F1'
  const gradBg = `linear-gradient(135deg, ${accentHex}28, transparent 60%)`

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 480 }}>

        {/* Accent header */}
        <div className="relative" style={{ background: gradBg }}>
          <div style={{ height: 3, background: accent }} />
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Plan context breadcrumb */}
                {activePlan && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <PlanIcon name={activePlan.icon} size={12} style={{ color: accent }} />
                    <span className="axis-label" style={{ letterSpacing: '0.06em' }}>{activePlan.name}</span>
                    <span className="axis-label" style={{ color: 'var(--fg-3)' }}> / {kindMeta.unit}</span>
                  </div>
                )}
                <textarea
                  value={phase.title}
                  onChange={(e) => set({ title: e.target.value })}
                  rows={1}
                  className="w-full bg-transparent outline-none resize-none font-bold leading-snug"
                  style={{ color: 'var(--fg-1)', fontSize: '18px' }}
                />
              </div>
              <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0" onClick={close} aria-label="إغلاق">
                <X size={16} />
              </button>
            </div>

            {/* Status pill + progress */}
            <div className="flex items-center gap-2 mt-2">
              <Pill variant={STATUS_PILL[phase.status]}>{PHASE_STATUS_LABELS[phase.status]}</Pill>
              {totalUnits > 0 && (
                <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>{pct}%</span>
              )}
              {linkedTasks.length > 0 && (
                <span className="inline-flex items-center gap-1 axis-num text-xs" style={{ color: 'var(--fg-3)' }}>
                  <Link2 size={11} /> {linkedTasks.length} مهمة
                </span>
              )}
            </div>

            {/* Progress bar */}
            {totalUnits > 0 && (
              <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                <div
                  className="h-full rounded-full transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  style={{ width: `${pct}%`, background: accent }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="axis-drawer__body space-y-6" style={{ paddingTop: 20 }}>

          {/* Status */}
          <section>
            <div className="drawer-section__title">الحالة</div>
            <Segmented
              value={phase.status}
              onChange={(v) => set({ status: v as PhaseStatus })}
              options={STATUS_OPTIONS}
            />
          </section>

          {/* Objective */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><Target size={11} />الهدف</span>
            </div>
            <input
              value={phase.objective ?? ''}
              onChange={(e) => set({ objective: e.target.value })}
              placeholder="ما الهدف من هذه المرحلة؟"
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
              <Field label="البداية" type="date" dir="ltr" value={toDateInput(phase.startDate)} onChange={(v) => set({ startDate: fromDateInput(v) })} />
              <Field label="النهاية" type="date" dir="ltr" value={toDateInput(phase.dueDate)} onChange={(v) => set({ dueDate: fromDateInput(v) })} />
            </div>
            {duration && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--fg-3)' }}>
                <Clock size={12} />
                <span className="axis-num">المدة: {duration} يوم</span>
              </div>
            )}
          </section>

          {/* Description */}
          <section>
            <div className="drawer-section__title">الوصف</div>
            <textarea
              rows={3}
              placeholder="وصف المرحلة وتفاصيلها"
              value={phase.description ?? ''}
              onChange={(e) => set({ description: e.target.value })}
              className="w-full text-sm p-3 outline-none resize-y leading-relaxed"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
            />
          </section>

          {/* Notes */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><StickyNote size={11} />ملاحظات</span>
            </div>
            <textarea
              rows={3}
              placeholder="ملاحظات حرة، قرارات مؤجلة، أسئلة مفتوحة…"
              value={phase.notes ?? ''}
              onChange={(e) => set({ notes: e.target.value })}
              className="w-full text-sm p-3 outline-none resize-y leading-relaxed"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
            />
          </section>

          {/* Features / Deliverables */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><Layers size={11} />المخرجات والميزات</span>
            </div>
            <div className="space-y-1.5 mb-2">
              {(phase.features ?? []).map((f) => (
                <div key={f.id} className="flex items-center gap-2.5 group">
                  <button
                    onClick={() => toggleFeature(phase.id, f.id)}
                    className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: f.done ? accent : 'transparent',
                      borderColor: f.done ? accent : 'var(--border-default)',
                    }}
                  >
                    {f.done && <Check size={11} strokeWidth={3} style={{ color: 'white' }} />}
                  </button>
                  <span
                    className="text-sm flex-1"
                    style={{
                      color: f.done ? 'var(--fg-3)' : 'var(--fg-2)',
                      textDecoration: f.done ? 'line-through' : 'none',
                    }}
                  >
                    {f.title}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <SendToSprintMenu projectId={phase.projectId} title={f.title} done={f.done} />
                    <button
                      onClick={() => deleteFeature(phase.id, f.id)}
                      className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost"
                      aria-label="حذف"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="إضافة ميزة أو مخرج"
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddFeature() }}
                className="flex-1 text-xs px-3 py-2 outline-none"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
              />
              <button
                onClick={handleAddFeature}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ background: accent }}
              >
                <Plus size={13} />
              </button>
            </div>
          </section>

          {/* Milestones */}
          <section>
            <div className="drawer-section__title">
              <span className="inline-flex items-center gap-1.5"><ListChecks size={11} />الإنجازات</span>
            </div>
            <div className="space-y-2 mb-2">
              {phase.milestones.map((m) => {
                const mTaskCount = linkedTasks.filter((t) => t.milestoneId === m.id).length
                return (
                  <div key={m.id} className="flex items-center gap-2.5 group">
                    <button
                      onClick={() => toggleMilestone(phase.id, m.id)}
                      className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                      style={{
                        background: m.done ? accent : 'transparent',
                        borderColor: m.done ? accent : 'var(--border-default)',
                      }}
                    >
                      {m.done && <Check size={11} strokeWidth={3} style={{ color: 'white' }} />}
                    </button>
                    <span
                      className="text-sm flex-1"
                      style={{
                        color: m.done ? 'var(--fg-3)' : 'var(--fg-2)',
                        textDecoration: m.done ? 'line-through' : 'none',
                      }}
                    >
                      {m.title}
                    </span>
                    {mTaskCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 axis-num text-xs px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: 'var(--surface-2)', color: 'var(--fg-3)' }}
                        title="مهام مرتبطة"
                      >
                        <Link2 size={11} />{mTaskCount}
                      </span>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <SendToSprintMenu projectId={phase.projectId} title={m.title} phaseId={phase.id} milestoneId={m.id} done={m.done} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="إضافة إنجاز جديد"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddMilestone() }}
                className="flex-1 text-xs px-3 py-2 outline-none"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--fg-1)' }}
              />
              <button
                onClick={handleAddMilestone}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ background: accent }}
              >
                <Plus size={13} />
              </button>
            </div>
          </section>

          {/* Linked tasks */}
          {linkedTasks.length > 0 && (
            <section>
              <div className="drawer-section__title">
                <span className="inline-flex items-center gap-1.5"><Flag size={11} />المهام المرتبطة</span>
              </div>
              <div className="space-y-2">
                {linkedTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: 'var(--surface-1)' }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TASK_STATUS_VAR[t.status] }} />
                    <span
                      className="text-sm flex-1 truncate"
                      style={{
                        color: t.status === 'done' ? 'var(--fg-3)' : 'var(--fg-2)',
                        textDecoration: t.status === 'done' ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </span>
                    <span className="axis-num text-xs shrink-0" style={{ color: 'var(--fg-3)' }}>
                      {TASK_STATUS_LABELS[t.status]}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Meta */}
          <section>
            <div className="detail-row">
              <span className="detail-row__label"><span className="inline-flex items-center gap-1.5"><Hash size={12} />المعرّف</span></span>
              <span className="detail-row__value axis-num" style={{ direction: 'ltr', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{phase.id}</span>
            </div>
            {phase.startDate && (
              <div className="detail-row">
                <span className="detail-row__label">البداية</span>
                <span className="detail-row__value axis-num">{formatDateAr(phase.startDate)}</span>
              </div>
            )}
            {phase.dueDate && (
              <div className="detail-row">
                <span className="detail-row__label">النهاية</span>
                <span className="detail-row__value axis-num">{formatDateAr(phase.dueDate)}</span>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 20px', display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <Button
            variant={phase.status === 'completed' ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => set({ status: phase.status === 'completed' ? 'in-progress' : 'completed' })}
          >
            <Check size={13} />
            {phase.status === 'completed' ? 'إعادة فتح' : 'وضع كمكتملة'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => { deletePhase(phase.id); close() }}
          >
            <Trash2 size={13} />
            حذف
          </Button>
        </div>
      </div>
    </div>
  )
}
