'use client'
import { useState } from 'react'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import { useTaskStore } from '@/store/store'
import type { Project, Task, TaskStatus, TaskPriority } from '@/types'
import EmptyState from '@/components/shared/EmptyState'
import { TASK_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/utils'

interface TasksTabProps {
  project: Project
  tasks: Task[]
}

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

function TaskCard({
  task,
  projectColor,
  onMove,
  onDelete,
}: {
  task: Task
  projectColor: string
  onMove: (status: TaskStatus) => void
  onDelete: () => void
}) {
  const [showMove, setShowMove] = useState(false)
  const priorityColor = PRIORITY_COLORS[task.priority]

  return (
    <div
      className="glass-card p-3.5 relative group"
      style={{ marginBottom: '0.5rem' }}
    >
      {/* Priority indicator */}
      <div
        className="absolute top-0 end-0 w-1 h-full rounded-e-xl"
        style={{ background: priorityColor, opacity: 0.6 }}
      />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug"
            style={{
              color: task.status === 'done' ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
              textDecoration: task.status === 'done' ? 'line-through' : 'none',
            }}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs px-1.5 py-0.5 rounded-md font-medium"
              style={{
                background: `${priorityColor}15`,
                color: priorityColor,
              }}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setShowMove(!showMove)}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)' }}
            >
              <ChevronDown size={12} />
            </button>
            {showMove && (
              <div
                className="absolute end-0 top-8 z-10 rounded-xl overflow-hidden shadow-2xl"
                style={{
                  background: '#141422',
                  border: '1px solid rgba(255,255,255,0.1)',
                  minWidth: '120px',
                }}
              >
                {COLUMNS.map((col) => (
                  <button
                    key={col.status}
                    onClick={() => { onMove(col.status); setShowMove(false) }}
                    className="w-full text-start text-xs px-3 py-2 transition-colors hover:bg-white/5"
                    style={{
                      color: task.status === col.status ? projectColor : 'var(--color-text-secondary)',
                      fontWeight: task.status === col.status ? 600 : 400,
                    }}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/15"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

function AddTaskForm({
  projectId,
  projectColor,
  status,
  onClose,
}: {
  projectId: string
  projectColor: string
  status: TaskStatus
  onClose: () => void
}) {
  const { addTask } = useTaskStore()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [desc, setDesc] = useState('')

  const handleAdd = () => {
    if (!title.trim()) return
    addTask({ projectId, title: title.trim(), description: desc.trim() || undefined, status, priority })
    onClose()
  }

  return (
    <div
      className="rounded-xl p-3 mt-2"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <input
        type="text"
        autoFocus
        placeholder="عنوان المهمة..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose() }}
        className="w-full bg-transparent text-sm outline-none mb-2"
        style={{ color: 'var(--color-text-primary)' }}
      />
      <input
        type="text"
        placeholder="وصف (اختياري)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        className="w-full bg-transparent text-xs outline-none mb-2"
        style={{ color: 'var(--color-text-secondary)' }}
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="text-xs px-2 py-1 rounded-lg outline-none"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--color-text-secondary)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} style={{ background: '#0F0F1A' }}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
          style={{ background: projectColor }}
        >
          إضافة
        </button>
        <button
          onClick={onClose}
          className="px-2 py-1 rounded-lg text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          إلغاء
        </button>
      </div>
    </div>
  )
}

export default function TasksTab({ project, tasks }: TasksTabProps) {
  const { moveTask, deleteTask } = useTaskStore()
  const [addingTo, setAddingTo] = useState<TaskStatus | null>(null)

  if (tasks.length === 0 && !addingTo) {
    return (
      <EmptyState
        icon={Plus}
        title="لا توجد مهام بعد"
        description="أضف مهامك لهذا المشروع"
        action={
          <button
            onClick={() => setAddingTo('todo')}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: project.color }}
          >
            إضافة مهمة
          </button>
        }
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map(({ status, label }) => {
        const colTasks = tasks.filter((t) => t.status === status)
        return (
          <div key={status}>
            {/* Column header */}
            <div
              className="flex items-center justify-between mb-3 px-1"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      status === 'done' ? '#10B981' :
                      status === 'in-progress' ? '#F59E0B' :
                      'rgba(255,255,255,0.3)',
                  }}
                />
                <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                  {label}
                </span>
              </div>
              <span
                className="text-xs w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Task cards */}
            <div
              className="min-h-32 rounded-xl p-2"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projectColor={project.color}
                  onMove={(s) => moveTask(task.id, s)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}

              {addingTo === status ? (
                <AddTaskForm
                  projectId={project.id}
                  projectColor={project.color}
                  status={status}
                  onClose={() => setAddingTo(null)}
                />
              ) : (
                <button
                  onClick={() => setAddingTo(status)}
                  className="w-full flex items-center gap-1.5 px-2 py-2 rounded-lg text-xs transition-colors mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Plus size={12} />
                  إضافة مهمة
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
