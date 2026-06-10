'use client'
import { useState } from 'react'
import { Trash2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react'
import type { ContentItem, ContentStatus } from '@/types'
import {
  STATUS_ORDER, STATUS_LABEL, STATUS_VAR, TYPE_LABEL, SOURCE_LABEL,
  nextStatus, prevStatus, scheduledKey,
} from './contentMeta'
import { formatDateShort } from '@/lib/utils'
import { DimBadge, ChecklistMeta } from './ContentCardMeta'
import { PlatformIcon } from './PlatformIcon'

interface Props {
  items: ContentItem[]
  clientColorMap: Record<string, string>
  clientNameMap: Record<string, string>
  assigneeNameMap?: Record<string, string>
  onOpenItem: (item: ContentItem) => void
  onSetStatus: (id: string, status: ContentStatus) => void
  onDelete: (id: string) => void
  onReorder?: (draggedId: string, targetId: string) => void
}

export default function ContentList({
  items, clientColorMap, clientNameMap, assigneeNameMap, onOpenItem, onSetStatus, onDelete, onReorder,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const draggedStatus = dragId ? items.find((i) => i.id === dragId)?.status : undefined

  return (
    <div className="space-y-4">
      {STATUS_ORDER.map((status) => {
        const group = items.filter((i) => i.status === status)
        if (group.length === 0) return null
        return (
          <div key={status}>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="w-2 h-2 rounded-full" style={{ background: STATUS_VAR[status] }} />
              <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>{STATUS_LABEL[status]}</span>
              <span className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>{group.length}</span>
            </div>
            <div className="space-y-1.5">
              {group.map((it) => (
                <Row
                  key={it.id}
                  item={it}
                  color={it.clientId ? (clientColorMap[it.clientId] ?? 'var(--fg-3)') : 'var(--fg-3)'}
                  clientName={it.clientId ? clientNameMap[it.clientId] : undefined}
                  assigneeName={it.assigneeId ? assigneeNameMap?.[it.assigneeId] : undefined}
                  onOpen={() => onOpenItem(it)}
                  onAdvance={() => { const n = nextStatus(it.status); if (n) onSetStatus(it.id, n) }}
                  onRevert={() => { const p = prevStatus(it.status); if (p) onSetStatus(it.id, p) }}
                  onDelete={() => onDelete(it.id)}
                  isDragging={dragId === it.id}
                  isDropTarget={overId === it.id && draggedStatus === it.status}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', it.id)
                    e.dataTransfer.effectAllowed = 'move'
                    setDragId(it.id)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    if (draggedStatus === it.status && dragId !== it.id) setOverId(it.id)
                  }}
                  onDragLeave={() => { if (overId === it.id) setOverId(null) }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const from = e.dataTransfer.getData('text/plain')
                    if (from && from !== it.id && draggedStatus === it.status) onReorder?.(from, it.id)
                    setDragId(null); setOverId(null)
                  }}
                  onDragEnd={() => { setDragId(null); setOverId(null) }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Row({
  item, color, clientName, assigneeName, onOpen, onAdvance, onRevert, onDelete,
  isDragging, isDropTarget,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}: {
  item: ContentItem
  color: string
  clientName?: string
  assigneeName?: string
  onOpen: () => void
  onAdvance: () => void
  onRevert: () => void
  onDelete: () => void
  isDragging?: boolean
  isDropTarget?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: () => void
}) {
  const sColor = STATUS_VAR[item.status]
  const hasNext = nextStatus(item.status) !== null
  const hasPrev = prevStatus(item.status) !== null
  const sched = scheduledKey(item)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="group flex items-center gap-2 rounded-xl p-3 cursor-pointer transition-all hover:bg-white/5"
      style={{
        background: 'var(--color-surface-overlay)',
        border: '1px solid var(--color-surface-border)',
        borderInlineStart: `2px solid ${color}`,
        opacity: isDragging ? 0.35 : 1,
        boxShadow: isDropTarget ? 'inset 0 2px 0 0 var(--iris-500)' : 'none',
      }}
      onClick={onOpen}
    >
      {/* Drag handle */}
      <span
        className="opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={13} />
      </span>

      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_VAR[item.status] }} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{item.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {item.source === 'client-request' && (
            <span
              className="px-1.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'color-mix(in oklch, var(--warning-500) 15%, transparent)', color: 'var(--warning-500)' }}
            >
              {SOURCE_LABEL['client-request']}
            </span>
          )}
          {clientName && <span>{clientName}</span>}
          <span>{TYPE_LABEL[item.type]}</span>
          {item.platform && <PlatformIcon platform={item.platform} size={12} style={{ color: 'var(--color-text-muted)' }} />}
          {assigneeName && <span>{assigneeName}</span>}
          <DimBadge dimensions={item.dimensions} />
          <ChecklistMeta item={item} />
          {sched && <span className="num-tabular">{formatDateShort(item.publishDate ?? item.dueDate)}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onRevert}
          disabled={!hasPrev}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors disabled:opacity-20 hover:bg-white/10"
          style={{ color: 'var(--color-text-muted)' }}
          title="رجوع"
        >
          <ChevronRight size={14} />
        </button>
        <span
          className="px-2 h-6 rounded-full text-xs font-medium flex items-center"
          style={{ background: `color-mix(in oklch, ${sColor} 15%, transparent)`, color: sColor }}
        >
          {STATUS_LABEL[item.status]}
        </span>
        <button
          onClick={onAdvance}
          disabled={!hasNext}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors disabled:opacity-20 hover:bg-white/10"
          style={{ color: 'var(--color-text-muted)' }}
          title="التالي"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all shrink-0"
        style={{ color: 'var(--danger-500)' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
