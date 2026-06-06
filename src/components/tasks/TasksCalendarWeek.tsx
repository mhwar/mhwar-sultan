'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Task } from '@/types'
import { WEEKDAYS, dateToKey, dayKey, todayKey } from '@/components/projects/tabs/content/contentMeta'
import TaskChip from './TaskChip'
import UnscheduledBacklog from './UnscheduledBacklog'
import { chipPropsFor, type TaskViewProps } from './shared'

interface Props extends TaskViewProps {
  anchorDay: string   // yyyy-mm-dd inside the target week
}

/** The 7 UTC dates of the week (Sunday-start) containing anchorKey. */
function weekDays(anchorKey: string): Date[] {
  const d = new Date(anchorKey + 'T00:00:00Z')
  const start = new Date(d)
  start.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start)
    x.setUTCDate(start.getUTCDate() + i)
    return x
  })
}

export default function TasksCalendarWeek({ anchorDay, ...p }: Props) {
  const { tasks, onOpenItem, onAddOnDay, onReschedule } = p
  const days = weekDays(anchorDay)
  const today = todayKey()
  const [dragOver, setDragOver] = useState<string | null>(null)

  const byDay = new Map<string, Task[]>()
  const unscheduled: Task[] = []
  for (const t of tasks) {
    const k = t.dueDate ? dayKey(t.dueDate) : null
    if (!k) { unscheduled.push(t); continue }
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k)!.push(t)
  }

  const onDrop = (key: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onReschedule(id, key)
    setDragOver(null)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-cols-7 gap-1.5" style={{ minWidth: 680 }}>
          {days.map((date, i) => {
            const key = dateToKey(date)
            const isToday = key === today
            const dayTasks = byDay.get(key) ?? []
            const isOver = dragOver === key
            return (
              <div
                key={key}
                onDragOver={(e) => { e.preventDefault(); if (dragOver !== key) setDragOver(key) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === key ? null : d)) }}
                onDrop={onDrop(key)}
                className="group rounded-lg p-1.5 flex flex-col gap-1.5 transition-colors"
                style={{
                  minHeight: 320,
                  background: isOver ? 'oklch(0.62 0.21 275 / 0.08)' : 'var(--color-surface-overlay)',
                  border: `1px solid ${isOver ? 'var(--iris-500)' : isToday ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
                }}
              >
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{WEEKDAYS[i]}</span>
                    <span
                      className="axis-num text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
                      style={isToday ? { background: 'var(--iris-500)', color: 'white' } : { color: 'var(--color-text-secondary)' }}
                    >
                      {date.getUTCDate()}
                    </span>
                  </div>
                  <button
                    onClick={() => onAddOnDay(key)}
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-white/10"
                    style={{ color: 'var(--color-text-muted)' }}
                    aria-label="إضافة"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {dayTasks.map((t) => (
                    <TaskChip key={t.id} task={t} {...chipPropsFor(t, p)} onClick={() => onOpenItem(t)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <UnscheduledBacklog tasks={unscheduled} viewProps={p} />
    </div>
  )
}
