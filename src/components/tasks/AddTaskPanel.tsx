'use client'
import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Timer, CalendarRange, Zap } from 'lucide-react'
import type { Project, Sprint, Task, TaskPriority, TaskStatus } from '@/types'
import { TASK_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/utils'

const STATUS_OPTS: TaskStatus[] = ['todo', 'in-progress', 'done']
const PRIORITY_OPTS: TaskPriority[] = ['high', 'medium', 'low']

const toISO = (date: string, time?: string): string => {
  if (!date) return ''
  return time ? `${date}T${time}:00Z` : `${date}T00:00:00Z`
}

interface Props {
  projects: Project[]
  sprints: Sprint[]
  defaultDate?: string
  defaultProjectId?: string
  onAdd: (data: Omit<Task, 'id' | 'createdAt'>) => void
  onNewSprint: () => void
}

export default function AddTaskPanel({ projects, sprints, defaultDate, defaultProjectId, onAdd, onNewSprint }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId ?? '')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState(defaultDate ?? '')
  const [rangeMode, setRangeMode] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [time, setTime] = useState('')
  const [sprintId, setSprintId] = useState('')

  const projectSprints = sprints.filter((s) =>
    !projectId || s.projectId === projectId || s.projectId === 'free'
  )

  const reset = () => {
    setTitle('')
    setProjectId(defaultProjectId ?? '')
    setStatus('todo')
    setPriority('medium')
    setDueDate(defaultDate ?? '')
    setRangeMode(false)
    setStartDate('')
    setTime('')
    setSprintId('')
    setExpanded(false)
  }

  const handleAdd = () => {
    const t = title.trim()
    if (!t) return
    const due = dueDate ? toISO(dueDate, time || undefined) : undefined
    const start = rangeMode && startDate ? toISO(startDate) : undefined
    onAdd({
      title: t,
      projectId: projectId || undefined,
      status,
      priority,
      dueDate: due,
      startDate: start,
      sprintId: sprintId || undefined,
    })
    reset()
  }

  return (
    <div
      className="rounded-xl transition-all"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
    >
      {/* Always-visible row */}
      <div className="flex items-center gap-2 p-2">
        <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Plus size={15} />
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !expanded) handleAdd() }}
          onFocus={() => setExpanded(true)}
          placeholder="اكتب مهمة جديدة…"
          className="flex-1 min-w-0 bg-transparent text-sm outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors hover:bg-white/10"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label={expanded ? 'طي' : 'توسيع'}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Project */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>المشروع</label>
              <select
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setSprintId('') }}
                className="h-8 rounded-md px-2 text-xs outline-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
              >
                <option value="">بلا مشروع</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الحالة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="h-8 rounded-md px-2 text-xs outline-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
              >
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            {/* Priority */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="h-8 rounded-md px-2 text-xs outline-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
              >
                {PRIORITY_OPTS.map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  dir="ltr"
                  className="h-8 rounded-md px-2 text-xs outline-none"
                  style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <Timer size={12} />
                  الوقت (اختياري)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  dir="ltr"
                  className="h-8 rounded-md px-2 text-xs outline-none"
                  style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
                />
              </div>

              <label className="flex items-center gap-1.5 text-xs cursor-pointer mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rangeMode}
                  onChange={(e) => setRangeMode(e.target.checked)}
                  className="rounded"
                />
                <CalendarRange size={12} />
                ممتد لعدة أيام
              </label>
            </div>

            {rangeMode && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>تاريخ البداية</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  dir="ltr"
                  className="h-8 rounded-md px-2 text-xs outline-none"
                  style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
                />
              </div>
            )}
          </div>

          {/* Sprint */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                <Zap size={12} />
                السبرنت (اختياري)
              </label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="h-8 rounded-md px-2 text-xs outline-none"
                style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
              >
                <option value="">الباكلوج (بدون سبرنت)</option>
                {projectSprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button
              onClick={onNewSprint}
              className="h-8 px-2 rounded-md text-xs flex items-center gap-1 transition-colors hover:bg-white/5"
              style={{ color: 'var(--iris-500)', border: '1px solid color-mix(in oklch, var(--iris-500) 40%, transparent)', whiteSpace: 'nowrap' }}
            >
              <Plus size={12} />
              سبرنت جديد
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={reset}
              className="px-3 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
            >
              إلغاء
            </button>
            <button
              onClick={handleAdd}
              disabled={!title.trim()}
              className="px-4 h-8 rounded-md text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--iris-500)', color: 'white' }}
            >
              إضافة
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
