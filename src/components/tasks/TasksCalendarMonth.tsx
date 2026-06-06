'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Task } from '@/types'
import { WEEKDAYS, monthMatrix, dateToKey, dayKey, todayKey, keyInMonth } from '@/components/projects/tabs/content/contentMeta'
import TaskChip from './TaskChip'
import UnscheduledBacklog from './UnscheduledBacklog'
import { chipPropsFor, type TaskViewProps } from './shared'

interface Props extends TaskViewProps {
  year: number
  month: number
}

export default function TasksCalendarMonth({ year, month, ...p }: Props) {
  const { tasks, onOpenItem, onAddOnDay, onReschedule } = p
  const weeks = monthMatrix(year, month)
  const today = todayKey()
  const [dragOver, setDragOver] = useState<string | null>(null)

  const byDay = new Map<string, Task[]>()
  const unscheduled: Task[] = []

  for (const t of tasks) {
    const sk = t.startDate ? dayKey(t.startDate) : null
    const ek = t.dueDate ? dayKey(t.dueDate) : null
    if (sk && ek && sk !== ek) {
      // Span task: add to every day in range
      const cur = new Date(sk + 'T00:00:00Z')
      const end = new Date(ek + 'T00:00:00Z')
      while (cur <= end) {
        const k = dateToKey(cur)
        if (!byDay.has(k)) byDay.set(k, [])
        byDay.get(k)!.push(t)
        cur.setUTCDate(cur.getUTCDate() + 1)
      }
    } else {
      if (!ek) { unscheduled.push(t); continue }
      if (!byDay.has(ek)) byDay.set(ek, [])
      byDay.get(ek)!.push(t)
    }
  }

  const onDrop = (key: string | null) => (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (id) onReschedule(id, key)
    setDragOver(null)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-1 px-1">
        <div style={{ minWidth: 680 }}>
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--color-text-muted)' }}>{w}</div>
            ))}
          </div>

          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((date) => {
                  const key = dateToKey(date)
                  const inMonth = keyInMonth(key, year, month)
                  const isToday = key === today
                  const dayTasks = byDay.get(key) ?? []
                  const isOver = dragOver === key
                  return (
                    <div
                      key={key}
                      onDragOver={(e) => { e.preventDefault(); if (dragOver !== key) setDragOver(key) }}
                      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === key ? null : d)) }}
                      onDrop={onDrop(key)}
                      className="group relative rounded-lg p-1.5 flex flex-col gap-1 transition-colors"
                      style={{
                        minHeight: 96,
                        background: isOver ? 'oklch(0.62 0.21 275 / 0.08)' : inMonth ? 'var(--color-surface-overlay)' : 'transparent',
                        border: `1px solid ${isOver ? 'var(--iris-500)' : isToday ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
                        opacity: inMonth ? 1 : 0.4,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="axis-num text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full"
                          style={isToday ? { background: 'var(--iris-500)', color: 'white' } : { color: 'var(--color-text-secondary)' }}
                        >
                          {date.getUTCDate()}
                        </span>
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
                        {dayTasks.slice(0, 3).map((t) => (
                          <TaskChip key={t.id} task={t} {...chipPropsFor(t, p)} onClick={() => onOpenItem(t)} />
                        ))}
                        {dayTasks.length > 3 && (
                          <button onClick={() => onAddOnDay(key)} className="text-xs text-start ps-1" style={{ color: 'var(--color-text-muted)' }}>
                            +{dayTasks.length - 3} المزيد
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <UnscheduledBacklog tasks={unscheduled} viewProps={p} />
    </div>
  )
}
