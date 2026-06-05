'use client'
import { useMemo, useState } from 'react'
import { Plus, Zap, Pencil, Inbox, LayoutList, Calendar, Target } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useSprintStore, useTaskStore } from '@/store/store'
import type { Project } from '@/types'
import EmptyState from '@/components/shared/EmptyState'
import Button from '@/components/ui/Button'
import TaskViews from '@/components/projects/TaskViews'
import SprintDrawer from '@/components/projects/SprintDrawer'
import { SPRINT_STATUS_VAR, SPRINT_STATUS_LABELS } from '@/lib/sprint-utils'
import { formatDateShort } from '@/lib/utils'

type Scope = 'all' | 'backlog' | string

interface ExecutionTabProps {
  project: Project
}

export default function ExecutionTab({ project }: ExecutionTabProps) {
  const tasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.projectId === project.id)))
  const sprints = useSprintStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === project.id).sort((a, b) => a.order - b.order)))
  const addSprint = useSprintStore((s) => s.addSprint)
  // `null` means "not yet chosen" → fall back to the active sprint (or first).
  const [picked, setPicked] = useState<Scope | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const defaultScope: Scope = sprints.find((s) => s.status === 'active')?.id ?? sprints[0]?.id ?? 'all'
  const scope: Scope = picked ?? defaultScope
  const setScope = (s: Scope) => setPicked(s)

  const counts = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {}
    for (const t of tasks) {
      const key = t.sprintId ?? 'backlog'
      if (!map[key]) map[key] = { total: 0, done: 0 }
      map[key].total++
      if (t.status === 'done') map[key].done++
    }
    return map
  }, [tasks])

  const backlogCount = counts['backlog']?.total ?? 0
  const scopedTasks =
    scope === 'all' ? tasks
    : scope === 'backlog' ? tasks.filter((t) => !t.sprintId)
    : tasks.filter((t) => t.sprintId === scope)
  const addSprintId = scope === 'all' || scope === 'backlog' ? undefined : scope
  const selectedSprint = typeof scope === 'string' ? sprints.find((s) => s.id === scope) : undefined

  const createSprint = () => {
    const n = sprints.length + 1
    const id = addSprint(project.id, `سبرنت ${n}`, { status: sprints.some((s) => s.status === 'active') ? 'planned' : 'active' })
    setScope(id)
    setEditingId(id)
  }

  const editingSprint = editingId ? sprints.find((s) => s.id === editingId) ?? null : null

  return (
    <div className="space-y-5">
      {/* Sprint rail */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setScope('all')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
          style={scope === 'all'
            ? { background: 'var(--color-brand-subtle)', color: 'var(--color-brand)', border: '1px solid color-mix(in srgb, var(--iris-500) 30%, transparent)' }
            : { color: 'var(--fg-3)', border: '1px solid transparent' }}
        >
          <LayoutList size={14} />
          <span>الكل</span>
          <span className="axis-num" style={{ fontSize: 11, opacity: 0.7 }}>{tasks.length}</span>
        </button>

        {sprints.map((sp) => {
          const c = counts[sp.id] ?? { total: 0, done: 0 }
          const active = scope === sp.id
          return (
            <button
              key={sp.id}
              onClick={() => setScope(sp.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
              style={active
                ? { background: 'var(--color-brand-subtle)', color: 'var(--color-brand)', border: '1px solid color-mix(in srgb, var(--iris-500) 30%, transparent)' }
                : { color: 'var(--fg-3)', border: '1px solid transparent' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: SPRINT_STATUS_VAR[sp.status] }} />
              <span>{sp.name}</span>
              <span className="axis-num" style={{ fontSize: 11, opacity: 0.7 }}>{c.total}</span>
            </button>
          )
        })}

        <button
          onClick={() => setScope('backlog')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
          style={scope === 'backlog'
            ? { background: 'var(--color-brand-subtle)', color: 'var(--color-brand)', border: '1px solid color-mix(in srgb, var(--iris-500) 30%, transparent)' }
            : { color: 'var(--fg-3)', border: '1px solid transparent' }}
        >
          <Inbox size={14} />
          <span>الباكلوج</span>
          <span className="axis-num" style={{ fontSize: 11, opacity: 0.7 }}>{backlogCount}</span>
        </button>

        <button onClick={createSprint} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm whitespace-nowrap" style={{ color: 'var(--fg-3)', border: '1px dashed var(--border-default)' }}>
          <Plus size={14} /> سبرنت
        </button>
      </div>

      {/* Selected sprint header */}
      {selectedSprint && (
        <div className="axis-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Zap size={15} style={{ color: project.color }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>{selectedSprint.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1.5" style={{ background: 'var(--surface-2)', color: 'var(--fg-2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: SPRINT_STATUS_VAR[selectedSprint.status] }} />
                  {SPRINT_STATUS_LABELS[selectedSprint.status]}
                </span>
              </div>
              {selectedSprint.goal && (
                <p className="text-xs mt-1.5 inline-flex items-center gap-1.5" style={{ color: 'var(--fg-2)' }}>
                  <Target size={12} style={{ flexShrink: 0 }} />{selectedSprint.goal}
                </p>
              )}
              {(selectedSprint.startDate || selectedSprint.dueDate) && (
                <p className="axis-num text-xs mt-1 inline-flex items-center gap-1.5" style={{ color: 'var(--fg-3)' }}>
                  <Calendar size={12} />{formatDateShort(selectedSprint.startDate)} – {formatDateShort(selectedSprint.dueDate)}
                </p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditingId(selectedSprint.id)}>
              <Pencil size={13} /> تفاصيل
            </Button>
          </div>
        </div>
      )}

      {/* Tasks */}
      {sprints.length === 0 && scope === 'all' && tasks.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="ابدأ أول سبرنت"
          description="نظّم العمل في سبرنتات قصيرة، وأضف المهام داخل كل سبرنت"
          action={<Button variant="primary" size="md" onClick={createSprint}>إنشاء سبرنت</Button>}
        />
      ) : (
        <TaskViews
          key={scope}
          project={project}
          tasks={scopedTasks}
          addSprintId={addSprintId}
          emptyLabel={scope === 'backlog' ? 'الباكلوج فارغ' : 'لا مهام في هذا النطاق'}
        />
      )}

      <SprintDrawer sprint={editingSprint} project={project} onClose={() => setEditingId(null)} />
    </div>
  )
}
