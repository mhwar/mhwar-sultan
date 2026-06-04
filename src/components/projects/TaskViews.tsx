'use client'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown, Check, LayoutGrid, List, Table2, GanttChartSquare, CalendarDays } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { useTaskStore, usePlanStore } from '@/store/store'
import { PlanIcon } from '@/lib/icons'
import type { Project, Task, TaskStatus, TaskPriority } from '@/types'
import TaskDrawer from '@/components/projects/TaskDrawer'
import GanttView from '@/components/projects/GanttView'
import CalendarView from '@/components/projects/CalendarView'
import Pill from '@/components/ui/Pill'
import Button from '@/components/ui/Button'
import Segmented from '@/components/ui/Segmented'
import {
  TASK_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_PILL, PRIORITY_VAR, TASK_STATUS_VAR,
  formatDateAr,
} from '@/lib/utils'

type View = 'board' | 'list' | 'table' | 'gantt' | 'calendar'

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo',        label: 'للتنفيذ' },
  { status: 'in-progress', label: 'جارية' },
  { status: 'done',        label: 'منجزة' },
]

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high',   label: 'عالية' },
  { value: 'medium', label: 'متوسطة' },
  { value: 'low',    label: 'منخفضة' },
]

/* ── Inline add-task form ── */
function AddTaskForm({ projectId, status, sprintId, onClose }: { projectId: string; status: TaskStatus; sprintId?: string; onClose: () => void }) {
  const { addTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')

  const handleAdd = () => {
    if (!title.trim()) return
    addTask({ projectId, sprintId, title: title.trim(), status, priority })
    onClose()
  }

  return (
    <div className="p-2.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
      <input
        autoFocus
        placeholder="عنوان المهمة"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose() }}
        className="w-full bg-transparent text-sm outline-none mb-2"
        style={{ color: 'var(--fg-1)' }}
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="text-xs px-2 py-1 outline-none"
          style={{ background: 'var(--surface-1)', color: 'var(--fg-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}
        >
          {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Button variant="primary" size="xs" onClick={handleAdd}>إضافة</Button>
        <Button variant="ghost" size="xs" onClick={onClose}>إلغاء</Button>
      </div>
    </div>
  )
}

/* ── Board card ── */
function BoardCard({ task, onMove, onDelete, onOpen, planIcon }: { task: Task; onMove: (s: TaskStatus) => void; onDelete: () => void; onOpen: () => void; planIcon?: string }) {
  const [showMove, setShowMove] = useState(false)
  return (
    <div
      className="board-card group"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move' }}
      style={{ cursor: 'grab' }}
    >
      <div className="board-card__head">
        <span className="priority-dot" style={{ background: PRIORITY_VAR[task.priority] }} />
        <Pill variant={PRIORITY_PILL[task.priority]}>{PRIORITY_LABELS[task.priority]}</Pill>
        {planIcon && (
          <span className="inline-flex items-center shrink-0" style={{ color: 'var(--fg-3)' }} title="الخطة المرتبطة">
            <PlanIcon name={planIcon} size={13} />
          </span>
        )}
        <div className="board-card__id relative">
          <button onClick={() => setShowMove(!showMove)} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost">
            <ChevronDown size={13} />
          </button>
          {showMove && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMove(false)} />
              <div className="absolute end-0 top-7 z-20 axis-menu" style={{ minWidth: '120px' }}>
                {COLUMNS.map((col) => (
                  <button
                    key={col.status}
                    onClick={() => { onMove(col.status); setShowMove(false) }}
                    className="axis-menu__item"
                    style={{ fontWeight: task.status === col.status ? 600 : 400 }}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <p
        className={`board-card__title ${task.status === 'done' ? 'line-through' : ''}`}
        style={{ cursor: 'pointer', ...(task.status === 'done' ? { color: 'var(--fg-3)' } : {}) }}
        onClick={onOpen}
      >
        {task.title}
      </p>
      {task.description && <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-3)' }}>{task.description}</p>}
      <div className="board-card__foot">
        <span className="board-card__meta">
          <button onClick={onDelete} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost opacity-0 group-hover:opacity-100 transition-opacity" aria-label="حذف">
            <Trash2 size={12} />
          </button>
        </span>
      </div>
    </div>
  )
}

interface TaskViewsProps {
  project: Project
  /** Tasks already scoped (e.g. to a sprint, the backlog, or all). */
  tasks: Task[]
  /** Sprint that newly-created tasks are assigned to (undefined → backlog). */
  addSprintId?: string
  /** Placeholder shown when there are no tasks in scope. */
  emptyLabel?: string
}

/** The five task views (board/list/table/gantt/calendar) + drawer, over a
 *  pre-filtered task set. Reused by the Execution tab across sprint scopes. */
export default function TaskViews({ project, tasks, addSprintId, emptyLabel = 'لا مهام' }: TaskViewsProps) {
  const { moveTask, deleteTask, updateTask } = useTaskStore()
  const plans = usePlanStore(useShallow((s) => s.plans.filter((p) => p.projectId === project.id)))
  const projectPhases = usePlanStore(useShallow((s) => s.phases.filter((p) => p.projectId === project.id)))
  const [view, setView] = useState<View>('board')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null)

  const planIconForTask = (t: Task): string | undefined => {
    if (!t.phaseId) return undefined
    const ph = projectPhases.find((p) => p.id === t.phaseId)
    return ph ? plans.find((pl) => pl.id === ph.planId)?.icon : undefined
  }

  const visible = priorityFilter === 'all' ? tasks : tasks.filter((t) => t.priority === priorityFilter)
  const selected = selectedId ? tasks.find((t) => t.id === selectedId) ?? null : null

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Segmented
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={[{ value: 'all', label: 'الكل' }, ...PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]}
        />
        <div className="ms-auto">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'board', icon: <LayoutGrid size={15} />, title: 'لوحة' },
              { value: 'list', icon: <List size={15} />, title: 'قائمة' },
              { value: 'table', icon: <Table2 size={15} />, title: 'جدول' },
              { value: 'gantt', icon: <GanttChartSquare size={15} />, title: 'زمني' },
              { value: 'calendar', icon: <CalendarDays size={15} />, title: 'تقويم' },
            ]}
          />
        </div>
      </div>

      {/* Board */}
      {view === 'board' && (
        <div className="board-grid">
          {COLUMNS.map((col) => {
            const colTasks = visible.filter((t) => t.status === col.status)
            return (
              <div
                key={col.status}
                className="board-col"
                style={dragOver === col.status ? { borderColor: 'var(--iris-400)', background: 'oklch(0.62 0.21 275 / 0.04)' } : undefined}
                onDragOver={(e) => { e.preventDefault(); if (dragOver !== col.status) setDragOver(col.status) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === col.status ? null : d)) }}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) moveTask(id, col.status); setDragOver(null) }}
              >
                <div className="board-col__head">
                  <div className="board-col__title">
                    <span className="priority-dot" style={{ background: TASK_STATUS_VAR[col.status] }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--fg-2)' }}>{col.label}</span>
                    <span className="board-col__count">{colTasks.length}</span>
                  </div>
                  <button className="board-col__add" onClick={() => setAddingTo(col.status)} aria-label="إضافة مهمة"><Plus size={14} /></button>
                </div>
                <div className="board-col__body">
                  {colTasks.map((task) => (
                    <BoardCard key={task.id} task={task} onMove={(s) => moveTask(task.id, s)} onDelete={() => deleteTask(task.id)} onOpen={() => setSelectedId(task.id)} planIcon={planIconForTask(task)} />
                  ))}
                  {addingTo === col.status && <AddTaskForm projectId={project.id} status={col.status} sprintId={addSprintId} onClose={() => setAddingTo(null)} />}
                  {colTasks.length === 0 && addingTo !== col.status && <div className="board-col__empty">{emptyLabel}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <div className="axis-tasklist">
          {visible.length === 0 && <div className="text-sm text-center py-6" style={{ color: 'var(--fg-3)' }}>{emptyLabel}</div>}
          {COLUMNS.map((col) => {
            const colTasks = visible.filter((t) => t.status === col.status)
            if (colTasks.length === 0) return null
            return (
              <div key={col.status} className="axis-tasklist__group">
                <div className="axis-tasklist__group-head">
                  <span className="priority-dot" style={{ background: TASK_STATUS_VAR[col.status] }} />
                  <span className="axis-tasklist__group-name">{col.label}</span>
                  <span className="axis-tasklist__group-count">{colTasks.length}</span>
                </div>
                <ul className="axis-tasklist__items">
                  {colTasks.map((task) => (
                    <li key={task.id} className={`axis-tasklist__item ${task.status === 'done' ? 'is-done' : ''}`}>
                      <span
                        className={`axis-tasklist__check ${task.status === 'done' ? 'is-on' : ''}`}
                        onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                      >
                        {task.status === 'done' && <Check size={12} strokeWidth={3} />}
                      </span>
                      <div className="axis-tasklist__body" onClick={() => setSelectedId(task.id)}>
                        <div className="axis-tasklist__title-row">
                          <span className="axis-tasklist__title">{task.title}</span>
                          <Pill variant={PRIORITY_PILL[task.priority]}>{PRIORITY_LABELS[task.priority]}</Pill>
                          {planIconForTask(task) && (
                            <span className="inline-flex items-center" style={{ color: 'var(--fg-3)' }} title="الخطة المرتبطة">
                              <PlanIcon name={planIconForTask(task)} size={13} />
                            </span>
                          )}
                        </div>
                        {task.description && <span className="axis-tasklist__meta"><span className="axis-tasklist__meta-item">{task.description}</span></span>}
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" aria-label="حذف"><Trash2 size={13} /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      {view === 'table' && (
        <div className="axis-table__wrap">
          <table className="axis-table axis-table--comfortable">
            <thead>
              <tr>
                <th>المهمة</th>
                <th>الأولوية</th>
                <th>الحالة</th>
                <th className="is-end">تاريخ الإضافة</th>
                <th className="is-end"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((task) => (
                <tr key={task.id} className="is-clickable">
                  <td onClick={() => setSelectedId(task.id)}>
                    <span className="inline-flex items-center gap-2">
                      {planIconForTask(task) && <span style={{ color: 'var(--fg-3)' }} title="الخطة المرتبطة"><PlanIcon name={planIconForTask(task)} size={13} /></span>}
                      <span className="font-medium" style={{ color: task.status === 'done' ? 'var(--fg-3)' : 'var(--fg-1)', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                        {task.title}
                      </span>
                    </span>
                  </td>
                  <td><Pill variant={PRIORITY_PILL[task.priority]}>{PRIORITY_LABELS[task.priority]}</Pill></td>
                  <td>
                    <select
                      value={task.status}
                      onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                      className="text-xs px-2 py-1 outline-none"
                      style={{ background: 'var(--surface-1)', color: 'var(--fg-2)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}
                    >
                      {COLUMNS.map((c) => <option key={c.status} value={c.status}>{TASK_STATUS_LABELS[c.status]}</option>)}
                    </select>
                  </td>
                  <td className="is-end is-mono" style={{ color: 'var(--fg-3)' }}>{formatDateAr(task.createdAt)}</td>
                  <td className="is-end">
                    <button onClick={() => deleteTask(task.id)} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" aria-label="حذف"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={5} className="text-center" style={{ color: 'var(--fg-3)', padding: '24px' }}>{emptyLabel}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Gantt */}
      {view === 'gantt' && <GanttView tasks={visible} onOpen={setSelectedId} />}

      {/* Calendar */}
      {view === 'calendar' && <CalendarView tasks={visible} onOpen={setSelectedId} />}

      {/* Add (list/table) */}
      {(view === 'list' || view === 'table') && (
        addingTo ? (
          <AddTaskForm projectId={project.id} status="todo" sprintId={addSprintId} onClose={() => setAddingTo(null)} />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setAddingTo('todo')}><Plus size={14} />إضافة مهمة</Button>
        )
      )}

      <TaskDrawer task={selected} project={project} onClose={() => setSelectedId(null)} />
    </div>
  )
}
