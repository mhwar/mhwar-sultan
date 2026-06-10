'use client'
import { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import type { ContentItem, ContentStatus } from '@/types'
import {
  STAGE_ORDER, STAGE_LABEL, STAGE_VAR, STAGE_PRIMARY, STAGE_STATUSES, stageOf,
  STATUS_LABEL, STATUS_VAR, TYPE_LABEL, SOURCE_LABEL, scheduledKey,
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
  onAddInStatus: (status: ContentStatus) => void
  onSetStatus: (id: string, status: ContentStatus) => void
}

/** Three-stage kanban that mirrors the Execution board (board-grid/board-col/board-card).
 *  The seven fine statuses fold into production / review / done. */
export default function ContentBoard({
  items, clientColorMap, clientNameMap, assigneeNameMap, onOpenItem, onAddInStatus, onSetStatus,
}: Props) {
  const [dragOver, setDragOver] = useState<string | null>(null)

  const moveToStage = (id: string, stage: typeof STAGE_ORDER[number]) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    // Keep the fine status when the card already lives in the target stage.
    if (stageOf(item.status) === stage) return
    onSetStatus(id, STAGE_PRIMARY[stage])
  }

  return (
    <div className="board-grid">
      {STAGE_ORDER.map((stage) => {
        const colItems = items.filter((i) => STAGE_STATUSES[stage].includes(i.status))
        const isOver = dragOver === stage
        return (
          <div
            key={stage}
            className="board-col"
            style={isOver ? { borderColor: 'var(--iris-400)', background: 'oklch(0.62 0.21 275 / 0.04)' } : undefined}
            onDragOver={(e) => { e.preventDefault(); if (dragOver !== stage) setDragOver(stage) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === stage ? null : d)) }}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) moveToStage(id, stage); setDragOver(null) }}
          >
            <div className="board-col__head">
              <div className="board-col__title">
                <span className="priority-dot" style={{ background: STAGE_VAR[stage] }} />
                <span className="text-xs font-bold" style={{ color: 'var(--fg-2)' }}>{STAGE_LABEL[stage]}</span>
                <span className="board-col__count">{colItems.length}</span>
              </div>
              <button className="board-col__add" onClick={() => onAddInStatus(STAGE_PRIMARY[stage])} aria-label="إضافة محتوى"><Plus size={14} /></button>
            </div>
            <div className="board-col__body">
              {colItems.map((it) => (
                <BoardCard
                  key={it.id}
                  item={it}
                  color={it.clientId ? (clientColorMap[it.clientId] ?? 'var(--fg-3)') : 'var(--fg-3)'}
                  clientName={it.clientId ? clientNameMap[it.clientId] : undefined}
                  assigneeName={it.assigneeId ? assigneeNameMap?.[it.assigneeId] : undefined}
                  onMove={(s) => moveToStage(it.id, s)}
                  onOpen={() => onOpenItem(it)}
                />
              ))}
              {colItems.length === 0 && <div className="board-col__empty">—</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BoardCard({
  item, color, clientName, assigneeName, onMove, onOpen,
}: {
  item: ContentItem
  color: string
  clientName?: string
  assigneeName?: string
  onMove: (stage: typeof STAGE_ORDER[number]) => void
  onOpen: () => void
}) {
  const [showMove, setShowMove] = useState(false)
  const sched = scheduledKey(item)
  return (
    <div
      className="board-card group"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move' }}
      style={{ cursor: 'grab', borderInlineStart: `2px solid ${color}` }}
    >
      <div className="board-card__head">
        <span className="priority-dot" style={{ background: STATUS_VAR[item.status] }} />
        <span className="text-xs font-medium" style={{ color: 'var(--fg-3)' }}>{STATUS_LABEL[item.status]}</span>
        {item.source === 'client-request' && (
          <span
            className="px-1.5 rounded-full text-[10px] font-semibold"
            style={{ background: 'color-mix(in oklch, var(--warning-500) 15%, transparent)', color: 'var(--warning-500)' }}
          >
            {SOURCE_LABEL['client-request']}
          </span>
        )}
        <div className="board-card__id relative">
          <button onClick={() => setShowMove(!showMove)} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost">
            <ChevronDown size={13} />
          </button>
          {showMove && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMove(false)} />
              <div className="absolute end-0 top-7 z-20 axis-menu" style={{ minWidth: '140px' }}>
                {STAGE_ORDER.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => { onMove(stage); setShowMove(false) }}
                    className="axis-menu__item"
                    style={{ fontWeight: stageOf(item.status) === stage ? 600 : 400 }}
                  >
                    <span className="priority-dot" style={{ background: STAGE_VAR[stage] }} />
                    {STAGE_LABEL[stage]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <p className="board-card__title" style={{ cursor: 'pointer' }} onClick={onOpen}>{item.title}</p>

      <div className="board-card__foot" style={{ flexWrap: 'wrap', gap: 8 }}>
        {clientName && <span>{clientName}</span>}
        <span>{TYPE_LABEL[item.type]}</span>
        {item.platform && <PlatformIcon platform={item.platform} size={12} style={{ color: 'var(--fg-3)' }} />}
        {assigneeName && <span>{assigneeName}</span>}
        <DimBadge dimensions={item.dimensions} />
        <ChecklistMeta item={item} />
        {sched && <span className="num-tabular ms-auto">{formatDateShort(item.publishDate ?? item.dueDate)}</span>}
      </div>
    </div>
  )
}
