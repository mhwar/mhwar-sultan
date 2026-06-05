'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { ContentItem, ContentStatus } from '@/types'
import {
  STATUS_ORDER, STATUS_LABEL, STATUS_VAR, TYPE_LABEL, PLATFORM_LABEL, scheduledKey,
} from './contentMeta'
import { formatDateShort } from '@/lib/utils'
import { DimBadge, ChecklistMeta } from './ContentCardMeta'

interface Props {
  items: ContentItem[]
  clientColorMap: Record<string, string>
  clientNameMap: Record<string, string>
  onOpenItem: (item: ContentItem) => void
  onAddInStatus: (status: ContentStatus) => void
  onSetStatus: (id: string, status: ContentStatus) => void
}

export default function ContentBoard({
  items, clientColorMap, clientNameMap, onOpenItem, onAddInStatus, onSetStatus,
}: Props) {
  const [dragOver, setDragOver] = useState<ContentStatus | null>(null)

  return (
    <div className="overflow-x-auto -mx-1 px-1 pb-2">
      <div className="flex gap-3" style={{ minWidth: 'min-content' }}>
        {STATUS_ORDER.map((status) => {
          const colItems = items.filter((i) => i.status === status)
          const isOver = dragOver === status
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); if (dragOver !== status) setDragOver(status) }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === status ? null : d)) }}
              onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) onSetStatus(id, status); setDragOver(null) }}
              className="shrink-0 rounded-xl p-2 flex flex-col"
              style={{
                width: 240,
                background: isOver ? 'oklch(0.62 0.21 275 / 0.06)' : 'var(--color-surface-overlay)',
                border: `1px solid ${isOver ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
              }}
            >
              <div className="flex items-center gap-2 px-1.5 py-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_VAR[status] }} />
                <span className="text-xs font-bold flex-1" style={{ color: 'var(--color-text-secondary)' }}>{STATUS_LABEL[status]}</span>
                <span className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>{colItems.length}</span>
                <button
                  onClick={() => onAddInStatus(status)}
                  className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label="إضافة"
                >
                  <Plus size={13} />
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-1 min-h-[60px]">
                {colItems.map((it) => (
                  <BoardCard
                    key={it.id}
                    item={it}
                    color={it.clientId ? (clientColorMap[it.clientId] ?? 'var(--fg-3)') : 'var(--fg-3)'}
                    clientName={it.clientId ? clientNameMap[it.clientId] : undefined}
                    onClick={() => onOpenItem(it)}
                  />
                ))}
                {colItems.length === 0 && (
                  <div className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BoardCard({
  item, color, clientName, onClick,
}: {
  item: ContentItem
  color: string
  clientName?: string
  onClick: () => void
}) {
  const sched = scheduledKey(item)
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move' }}
      onClick={onClick}
      className="rounded-lg p-2.5 transition-colors hover:bg-white/5"
      style={{
        background: 'var(--color-surface-overlay)',
        border: '1px solid var(--color-surface-border)',
        borderInlineStart: `2px solid ${color}`,
        cursor: 'grab',
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_VAR[item.status] }} />
        <p className="text-sm font-medium leading-snug" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {clientName && <span>{clientName}</span>}
        <span>{TYPE_LABEL[item.type]}</span>
        {item.platform && <span>{PLATFORM_LABEL[item.platform]}</span>}
        <DimBadge dimensions={item.dimensions} />
        <ChecklistMeta item={item} />
        {sched && <span className="num-tabular ms-auto">{formatDateShort(item.publishDate ?? item.dueDate)}</span>}
      </div>
    </div>
  )
}
