'use client'
import { useEffect, useState } from 'react'
import { Plus, Check, Map, ChevronDown, ChevronUp, Trash2, Pencil, X, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, Rows3, Columns3, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { usePlanStore, useTaskStore } from '@/store/store'
import type { Project, PlanPhase, PhaseStatus } from '@/types'
import EmptyState from '@/components/shared/EmptyState'
import Button from '@/components/ui/Button'
import Segmented from '@/components/ui/Segmented'
import { PHASE_STATUS_LABELS, TASK_STATUS_VAR } from '@/lib/utils'

const PHASE_COLUMNS: PhaseStatus[] = ['upcoming', 'in-progress', 'completed']

interface PlanTabProps {
  project: Project
  phases: PlanPhase[]
}

const PHASE_STATUS_COLORS: Record<string, { dot: string; badge: string; badgeText: string }> = {
  completed:     { dot: 'var(--color-status-active)', badge: 'color-mix(in srgb, var(--color-status-active) 12%, transparent)', badgeText: 'var(--color-status-active)' },
  'in-progress': { dot: 'var(--color-status-paused)', badge: 'color-mix(in srgb, var(--color-status-paused) 12%, transparent)', badgeText: 'var(--color-status-paused)' },
  upcoming:      { dot: 'var(--color-text-muted)',    badge: 'var(--color-surface-muted)',                                     badgeText: 'var(--color-text-muted)' },
}

/* ── Phase card (timeline node) ── */
function PhaseCard({ phase, project, onMove, isFirst, isLast, expanded, onToggle }: { phase: PlanPhase; project: Project; onMove: (dir: -1 | 1) => void; isFirst: boolean; isLast: boolean; expanded: boolean; onToggle: () => void }) {
  const [newMilestone, setNewMilestone] = useState('')
  const { toggleMilestone, addMilestone, deletePhase, updatePhase } = usePlanStore()
  const linkedTasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.phaseId === phase.id)))
  const colors = PHASE_STATUS_COLORS[phase.status]
  const doneMilestones = phase.milestones.filter((m) => m.done).length
  const pct = phase.milestones.length ? Math.round((doneMilestones / phase.milestones.length) * 100) : 0

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return
    addMilestone(phase.id, newMilestone.trim())
    setNewMilestone('')
  }

  return (
    <div className="relative ps-8">
      {/* Timeline dot */}
      <div
        className="absolute start-0 top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center"
        style={{
          background: phase.status === 'completed' ? colors.dot : phase.status === 'in-progress' ? 'transparent' : 'var(--surface-2)',
          borderColor: colors.dot,
        }}
      >
        {phase.status === 'completed' && <Check size={8} strokeWidth={3} style={{ color: 'white' }} />}
        {phase.status === 'in-progress' && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: colors.dot }} />}
      </div>

      <div className="axis-card mb-4 overflow-hidden">
        {/* Phase header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer gap-3"
          onClick={onToggle}
          style={{ borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none' }}
        >
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--fg-1)' }}>{phase.title}</h3>
            <p className="axis-num text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>{doneMilestones} / {phase.milestones.length} إنجاز · {pct}%{linkedTasks.length > 0 ? ` · ${linkedTasks.length} مهمة` : ''}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onMove(-1) }} disabled={isFirst} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" style={{ opacity: isFirst ? 0.3 : 1 }} aria-label="نقل لأعلى">
              <ArrowUp size={12} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onMove(1) }} disabled={isLast} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" style={{ opacity: isLast ? 0.3 : 1 }} aria-label="نقل لأسفل">
              <ArrowDown size={12} />
            </button>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium ms-1" style={{ background: colors.badge, color: colors.badgeText }}>
              {PHASE_STATUS_LABELS[phase.status]}
            </span>
            {expanded ? <ChevronUp size={14} style={{ color: 'var(--fg-3)' }} /> : <ChevronDown size={14} style={{ color: 'var(--fg-3)' }} />}
          </div>
        </div>

        {expanded && (
          <div className="p-4 space-y-2">
            {phase.description && <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--fg-2)' }}>{phase.description}</p>}

            {phase.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-3 group">
                <button
                  onClick={() => toggleMilestone(phase.id, milestone.id)}
                  className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                  style={{ background: milestone.done ? project.color : 'transparent', borderColor: milestone.done ? project.color : 'var(--border-default)' }}
                >
                  {milestone.done && <Check size={11} strokeWidth={3} style={{ color: 'white' }} />}
                </button>
                <span className="text-sm flex-1" style={{ color: milestone.done ? 'var(--fg-3)' : 'var(--fg-2)', textDecoration: milestone.done ? 'line-through' : 'none' }}>
                  {milestone.title}
                </span>
              </div>
            ))}

            {/* Add milestone */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="إضافة إنجاز جديد"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddMilestone() }}
                className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--fg-1)' }}
              />
              <button onClick={handleAddMilestone} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: project.color }}>
                <Plus size={13} />
              </button>
            </div>

            {/* Linked tasks */}
            {linkedTasks.length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="axis-label mb-2">المهام المرتبطة</div>
                <div className="space-y-1.5">
                  {linkedTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TASK_STATUS_VAR[t.status] }} />
                      <span className="text-xs flex-1 truncate" style={{ color: t.status === 'done' ? 'var(--fg-3)' : 'var(--fg-2)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase status + delete */}
            <div className="flex gap-2 pt-2">
              {(['upcoming', 'in-progress', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updatePhase(phase.id, { status: s })}
                  className="text-xs px-2 py-1 rounded-lg transition-all"
                  style={{
                    background: phase.status === s ? PHASE_STATUS_COLORS[s].badge : 'var(--surface-2)',
                    color: phase.status === s ? PHASE_STATUS_COLORS[s].badgeText : 'var(--color-text-muted)',
                    border: '1px solid transparent',
                  }}
                >
                  {PHASE_STATUS_LABELS[s]}
                </button>
              ))}
              <button onClick={() => deletePhase(phase.id)} className="ms-auto p-1 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: 'var(--fg-3)' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Compact card for the board view ── */
function PhaseBoardCard({ phase, project }: { phase: PlanPhase; project: Project }) {
  const { updatePhase, deletePhase } = usePlanStore()
  const linked = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.phaseId === phase.id).length))
  const done = phase.milestones.filter((m) => m.done).length
  const pct = phase.milestones.length ? Math.round((done / phase.milestones.length) * 100) : 0

  return (
    <div className="board-card group">
      <div className="board-card__head">
        <span className="board-card__title" style={{ flex: 1 }}>{phase.title}</span>
        <button onClick={() => deletePhase(phase.id)} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost opacity-0 group-hover:opacity-100 transition-opacity" aria-label="حذف">
          <Trash2 size={12} />
        </button>
      </div>
      <div className="progress-cell">
        <div className="progress-cell__bar"><div className="progress-cell__fill" style={{ width: `${pct}%`, background: project.color }} /></div>
        <span className="progress-cell__num">{pct}%</span>
      </div>
      <div className="board-card__foot">
        <span className="axis-num">{done}/{phase.milestones.length} إنجاز</span>
        {linked > 0 && <span className="board-card__meta axis-num">{linked} مهمة</span>}
      </div>
      <div className="flex gap-1 flex-wrap">
        {PHASE_COLUMNS.map((s) => (
          <button
            key={s}
            onClick={() => updatePhase(phase.id, { status: s })}
            className="text-xs px-1.5 py-0.5 rounded"
            style={phase.status === s
              ? { background: 'var(--color-brand-subtle)', color: 'var(--color-brand)' }
              : { color: 'var(--fg-3)', background: 'var(--surface-2)' }}
          >
            {PHASE_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PlanTab({ project, phases }: PlanTabProps) {
  const plans = usePlanStore(useShallow((s) => s.plans.filter((p) => p.projectId === project.id).sort((a, b) => a.order - b.order)))
  const { addPlan, renamePlan, deletePlan, reorderPlans, addPhase, reorderPhases } = usePlanStore()

  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [addingPlan, setAddingPlan] = useState(false)
  const [planName, setPlanName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameVal, setRenameVal] = useState('')

  const [showAddPhase, setShowAddPhase] = useState(false)
  const [newPhaseTitle, setNewPhaseTitle] = useState('')
  const [newPhaseDesc, setNewPhaseDesc] = useState('')

  const [view, setView] = useState<'timeline' | 'board'>('timeline')
  const [statusFilter, setStatusFilter] = useState<PhaseStatus | 'all'>('all')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  // Keep an active plan selected
  useEffect(() => {
    if (plans.length && (!activePlanId || !plans.find((p) => p.id === activePlanId))) {
      setActivePlanId(plans[0].id)
    }
  }, [plans, activePlanId])

  const isFirst = plans[0]?.id === activePlanId
  const planPhases = phases.filter((ph) => ph.planId === activePlanId || (isFirst && !ph.planId))
  const activePlan = plans.find((p) => p.id === activePlanId)

  const totalMs = planPhases.reduce((a, ph) => a + ph.milestones.length, 0)
  const doneMs = planPhases.reduce((a, ph) => a + ph.milestones.filter((m) => m.done).length, 0)
  const planPct = totalMs ? Math.round((doneMs / totalMs) * 100) : 0

  const timelinePhases = statusFilter === 'all' ? planPhases : planPhases.filter((p) => p.status === statusFilter)
  const allCollapsed = planPhases.length > 0 && planPhases.every((p) => collapsed.has(p.id))
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(planPhases.map((p) => p.id)))
  const togglePhase = (id: string) => setCollapsed((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const submitPlan = () => {
    if (!planName.trim()) return
    const id = addPlan(project.id, planName.trim())
    setActivePlanId(id)
    setPlanName('')
    setAddingPlan(false)
  }

  const movePhase = (index: number, dir: -1 | 1) => {
    const arr = [...planPhases]
    const j = index + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[index], arr[j]] = [arr[j], arr[index]]
    reorderPhases(arr.map((p) => p.id))
  }

  const moveActivePlan = (dir: -1 | 1) => {
    const idx = plans.findIndex((p) => p.id === activePlanId)
    const j = idx + dir
    if (idx < 0 || j < 0 || j >= plans.length) return
    const arr = [...plans]
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    reorderPlans(arr.map((p) => p.id))
  }

  const handleAddPhase = () => {
    if (!newPhaseTitle.trim() || !activePlanId) return
    addPhase({
      projectId: project.id,
      planId: activePlanId,
      title: newPhaseTitle.trim(),
      description: newPhaseDesc.trim(),
      status: 'upcoming',
      order: planPhases.length + 1,
      milestones: [],
    })
    setNewPhaseTitle('')
    setNewPhaseDesc('')
    setShowAddPhase(false)
  }

  // No plans yet
  if (plans.length === 0) {
    return (
      <div>
        {addingPlan ? (
          <div className="axis-card p-4 max-w-md">
            <label className="axis-label block mb-1.5">اسم الخطة</label>
            <div className="flex gap-2">
              <input
                autoFocus
                placeholder="مثال: خطة المحتوى"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitPlan() }}
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--fg-1)' }}
              />
              <Button variant="primary" size="sm" onClick={submitPlan}>إنشاء</Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Map}
            title="لا توجد خطط بعد"
            description="أنشئ خططاً متعددة لمشروعك: خطة المراحل، خطة المحتوى، خطة التسويق…"
            action={<Button variant="primary" size="md" onClick={() => setAddingPlan(true)}>إنشاء خطة</Button>}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Plan tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {plans.map((p) => {
            const active = p.id === activePlanId
            const count = phases.filter((ph) => ph.planId === p.id).length
            return (
              <button
                key={p.id}
                onClick={() => { setActivePlanId(p.id); setRenaming(false) }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                style={active
                  ? { background: 'var(--color-brand-subtle)', color: 'var(--color-brand)', border: '1px solid color-mix(in srgb, var(--iris-500) 30%, transparent)' }
                  : { color: 'var(--fg-3)', border: '1px solid transparent' }}
              >
                <Map size={14} />
                <span>{p.name}</span>
                <span className="axis-num" style={{ fontSize: 11, opacity: 0.7 }}>{count}</span>
              </button>
            )
          })}

          {addingPlan ? (
            <input
              autoFocus
              placeholder="اسم الخطة"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitPlan(); if (e.key === 'Escape') { setAddingPlan(false); setPlanName('') } }}
              onBlur={() => { if (planName.trim()) submitPlan(); else setAddingPlan(false) }}
              className="text-sm px-3 py-1.5 rounded-lg outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--fg-1)', width: 140 }}
            />
          ) : (
            <button onClick={() => setAddingPlan(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm whitespace-nowrap" style={{ color: 'var(--fg-3)', border: '1px dashed var(--border-default)' }}>
              <Plus size={14} /> خطة
            </button>
          )}
        </div>

        {/* Active plan actions */}
        {activePlan && (
          <div className="flex items-center gap-1">
            {plans.length > 1 && (
              <>
                <button onClick={() => moveActivePlan(-1)} disabled={plans[0]?.id === activePlanId} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" style={{ opacity: plans[0]?.id === activePlanId ? 0.3 : 1 }} aria-label="نقل الخطة للبداية">
                  <ChevronRight size={14} data-flip-rtl />
                </button>
                <button onClick={() => moveActivePlan(1)} disabled={plans[plans.length - 1]?.id === activePlanId} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" style={{ opacity: plans[plans.length - 1]?.id === activePlanId ? 0.3 : 1 }} aria-label="نقل الخطة للنهاية">
                  <ChevronLeft size={14} data-flip-rtl />
                </button>
              </>
            )}
            <button onClick={() => { setRenaming(true); setRenameVal(activePlan.name) }} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" aria-label="إعادة تسمية">
              <Pencil size={13} />
            </button>
            {plans.length > 1 && (
              <button
                onClick={() => { if (confirm(`حذف خطة "${activePlan.name}" وكل مراحلها؟`)) deletePlan(activePlan.id) }}
                className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost"
                aria-label="حذف الخطة"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rename inline */}
      {renaming && activePlan && (
        <div className="flex gap-2 max-w-md">
          <input
            autoFocus
            value={renameVal}
            onChange={(e) => setRenameVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { renamePlan(activePlan.id, renameVal.trim() || activePlan.name); setRenaming(false) } if (e.key === 'Escape') setRenaming(false) }}
            className="flex-1 text-sm px-3 py-2 rounded-lg outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--fg-1)' }}
          />
          <Button variant="primary" size="sm" onClick={() => { renamePlan(activePlan.id, renameVal.trim() || activePlan.name); setRenaming(false) }}>حفظ</Button>
          <button onClick={() => setRenaming(false)} className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost"><X size={15} /></button>
        </div>
      )}

      {/* Plan progress */}
      <div className="axis-card p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>{activePlan?.name}</span>
          <span className="axis-num text-sm font-bold" style={{ color: project.color }}>{planPct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
          <div className="h-full rounded-full transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]" style={{ width: `${planPct}%`, background: project.color }} />
        </div>
        <p className="axis-num text-xs mt-2" style={{ color: 'var(--fg-3)' }}>{planPhases.length} مرحلة · {doneMs}/{totalMs} إنجاز</p>
      </div>

      {/* Plan toolbar */}
      {planPhases.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Segmented
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'الكل' }, ...PHASE_COLUMNS.map((s) => ({ value: s, label: PHASE_STATUS_LABELS[s] }))]}
          />
          <div className="ms-auto flex items-center gap-2">
            {view === 'timeline' && (
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
                {allCollapsed ? 'توسيع الكل' : 'طي الكل'}
              </Button>
            )}
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'timeline', icon: <Rows3 size={15} />, title: 'الخط الزمني' },
                { value: 'board', icon: <Columns3 size={15} />, title: 'لوحة' },
              ]}
            />
          </div>
        </div>
      )}

      {/* Phases */}
      {planPhases.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--fg-3)' }}>لا مراحل في هذه الخطة بعد</p>
      ) : view === 'timeline' ? (
        <div className="relative">
          <div className="absolute start-1.5 top-6 bottom-6" style={{ width: '2px', background: 'var(--border-subtle)' }} />
          {timelinePhases.map((phase) => {
            const i = planPhases.indexOf(phase)
            return (
              <PhaseCard
                key={phase.id}
                phase={phase}
                project={project}
                onMove={(dir) => movePhase(i, dir)}
                isFirst={i === 0}
                isLast={i === planPhases.length - 1}
                expanded={!collapsed.has(phase.id)}
                onToggle={() => togglePhase(phase.id)}
              />
            )
          })}
          {timelinePhases.length === 0 && <p className="text-sm text-center py-6" style={{ color: 'var(--fg-3)' }}>لا مراحل بهذه الحالة</p>}
        </div>
      ) : (
        <div className="board-grid">
          {PHASE_COLUMNS.map((col) => {
            const colPhases = planPhases.filter((p) => p.status === col)
            return (
              <div key={col} className="board-col">
                <div className="board-col__head">
                  <div className="board-col__title">
                    <span className="text-xs font-bold" style={{ color: 'var(--fg-2)' }}>{PHASE_STATUS_LABELS[col]}</span>
                    <span className="board-col__count">{colPhases.length}</span>
                  </div>
                </div>
                <div className="board-col__body">
                  {colPhases.map((p) => <PhaseBoardCard key={p.id} phase={p} project={project} />)}
                  {colPhases.length === 0 && <div className="board-col__empty">لا مراحل</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add phase */}
      {showAddPhase ? (
        <div className="axis-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg-1)' }}>مرحلة جديدة</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="عنوان المرحلة"
              value={newPhaseTitle}
              onChange={(e) => setNewPhaseTitle(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--fg-1)' }}
            />
            <textarea
              rows={2}
              placeholder="وصف المرحلة (اختياري)"
              value={newPhaseDesc}
              onChange={(e) => setNewPhaseDesc(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border-default)', color: 'var(--fg-1)' }}
            />
            <div className="flex gap-2">
              <Button variant="primary" size="md" onClick={handleAddPhase}>إضافة</Button>
              <Button variant="ghost" size="md" onClick={() => setShowAddPhase(false)}>إلغاء</Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddPhase(true)}
          className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-colors"
          style={{ color: project.color, background: `${project.color}15`, border: `1px dashed ${project.color}40` }}
        >
          <Plus size={15} />
          إضافة مرحلة جديدة
        </button>
      )}
    </div>
  )
}
