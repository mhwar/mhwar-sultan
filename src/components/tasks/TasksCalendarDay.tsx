'use client'
import { useState } from 'react'
import { Plus, CalendarDays } from 'lucide-react'
import type { Task } from '@/types'
import { dayKey, todayKey } from '@/components/projects/tabs/content/contentMeta'
import TaskChip from './TaskChip'
import { chipPropsFor, type TaskViewProps } from './shared'

interface Props extends TaskViewProps {
  anchorDay: string   // yyyy-mm-dd
}

export default function TasksCalendarDay({ anchorDay, ...p }: Props) {
  const { tasks, onOpenItem, onAddOnDay, onReschedule } = p
  const [over, setOver] = useState(false)

  const dayTasks: Task[] = []
  const unscheduled: Task[] = []
  for (const t of tasks) {
    const k = t.dueDate ? dayKey(t.dueDate) : null
    if (!k) { unscheduled.push(t); continue }
    if (k === anchorDay) dayTasks.push(t)
  }

  const isToday = anchorDay === todayKey()

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true) }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false) }}
        onDrop={(e) => {
          e.preventDefault()
          const id = e.dataTransfer.getData('text/plain')
          if (id) onReschedule(id, anchorDay)
          setOver(false)
        }}
        className="group rounded-xl p-3 transition-colors"
        style={{
          minHeight: 360,
          background: over ? 'oklch(0.62 0.21 275 / 0.08)' : 'var(--color-surface-overlay)',
          border: `1px solid ${over ? 'var(--iris-500)' : isToday ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold inline-flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <CalendarDays size={15} style={{ color: 'var(--color-text-muted)' }} />
            مهام اليوم ({dayTasks.length})
          </span>
          <button
            onClick={() => onAddOnDay(anchorDay)}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
            aria-label="إضافة"
          >
            <Plus size={15} />
          </button>
        </div>

        {dayTasks.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--color-text-muted)' }}>لا مهام في هذا اليوم — اسحب مهمة هنا أو أضف واحدة</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {dayTasks.map((t) => (
              <TaskChip key={t.id} task={t} {...chipPropsFor(t, p)} onClick={() => onOpenItem(t)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
