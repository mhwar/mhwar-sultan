'use client'
import { useState } from 'react'
import { Inbox } from 'lucide-react'
import type { Task } from '@/types'
import TaskChip from './TaskChip'
import { chipPropsFor, type TaskViewProps } from './shared'

interface Props {
  tasks: Task[]
  viewProps: TaskViewProps
}

/** "بلا موعد" bucket — accepts drops (clears dueDate) and is a drag source. */
export default function UnscheduledBacklog({ tasks, viewProps }: Props) {
  const [over, setOver] = useState(false)
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true) }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false) }}
      onDrop={(e) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain')
        if (id) viewProps.onReschedule(id, null)
        setOver(false)
      }}
      className="rounded-xl p-3 transition-colors"
      style={{
        background: over ? 'oklch(0.62 0.21 275 / 0.08)' : 'var(--color-surface-overlay)',
        border: `1px dashed ${over ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Inbox size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          بلا موعد ({tasks.length})
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>اسحب المهمة إلى يوم لجدولتها</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>كل المهام مجدولة</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tasks.map((t) => (
            <TaskChip key={t.id} task={t} {...chipPropsFor(t, viewProps)} onClick={() => viewProps.onOpenItem(t)} inline />
          ))}
        </div>
      )}
    </div>
  )
}
