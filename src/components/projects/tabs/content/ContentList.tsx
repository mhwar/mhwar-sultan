'use client'
import { useState } from 'react'
import { MoreVertical, Trash2, Check } from 'lucide-react'
import type { ContentItem, ContentStatus } from '@/types'
import {
  STAGE_ORDER, STAGE_LABEL, STAGE_VAR, STAGE_STATUSES, STAGE_PRIMARY, stageOf,
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
  onSetStatus: (id: string, status: ContentStatus) => void
  onDelete: (id: string) => void
  onReorder?: (draggedId: string, targetId: string) => void
}

export default function ContentList({
  items, clientColorMap, clientNameMap, assigneeNameMap, onOpenItem, onSetStatus, onDelete,
}: Props) {
  return (
    <div className="axis-tasklist">
      {items.length === 0 && (
        <div className="text-sm text-center py-6" style={{ color: 'var(--fg-3)' }}>لا محتوى</div>
      )}
      {STAGE_ORDER.map((stage) => {
        const group = items.filter((i) => STAGE_STATUSES[stage].includes(i.status))
        if (group.length === 0) return null
        return (
          <div key={stage} className="axis-tasklist__group">
            <div className="axis-tasklist__group-head">
              <span className="priority-dot" style={{ background: STAGE_VAR[stage] }} />
              <span className="axis-tasklist__group-name">{STAGE_LABEL[stage]}</span>
              <span className="axis-tasklist__group-count">{group.length}</span>
            </div>
            <ul className="axis-tasklist__items">
              {group.map((item) => {
                const isDone = stage === 'done'
                const clientName = item.clientId ? clientNameMap[item.clientId] : undefined
                const assigneeName = item.assigneeId ? assigneeNameMap?.[item.assigneeId] : undefined
                const color = item.clientId ? (clientColorMap[item.clientId] ?? 'var(--fg-3)') : 'var(--fg-3)'
                const sched = scheduledKey(item)
                return (
                  <li key={item.id} className={`axis-tasklist__item ${isDone ? 'is-done' : ''}`} style={{ borderLeft: `2px solid ${color}` }}>
                    <span
                      className={`axis-tasklist__check ${isDone ? 'is-on' : ''}`}
                      onClick={() => onSetStatus(item.id, isDone ? STAGE_PRIMARY.production : 'published')}
                      title={isDone ? 'إرجاع للإعداد' : 'وضع كمنشور'}
                    >
                      {isDone && <Check size={12} strokeWidth={3} />}
                    </span>
                    <div className="axis-tasklist__body" onClick={() => onOpenItem(item)}>
                      <div className="axis-tasklist__title-row">
                        <span className="axis-tasklist__title">{item.title || '(بلا عنوان)'}</span>
                        <span
                          className="px-1.5 rounded-full text-[10px] font-semibold"
                          style={{ background: `color-mix(in oklch, ${STATUS_VAR[item.status]} 15%, transparent)`, color: STATUS_VAR[item.status] }}
                        >
                          {STATUS_LABEL[item.status]}
                        </span>
                        {item.source === 'client-request' && (
                          <span
                            className="px-1.5 rounded-full text-[10px] font-semibold"
                            style={{ background: 'color-mix(in oklch, var(--warning-500) 15%, transparent)', color: 'var(--warning-500)' }}
                          >
                            {SOURCE_LABEL['client-request']}
                          </span>
                        )}
                      </div>
                      <span className="axis-tasklist__meta">
                        {clientName && <span className="axis-tasklist__meta-item">{clientName}</span>}
                        <span className="axis-tasklist__meta-item">{TYPE_LABEL[item.type]}</span>
                        {item.platform && <span className="axis-tasklist__meta-item"><PlatformIcon platform={item.platform} size={12} /></span>}
                        {assigneeName && <span className="axis-tasklist__meta-item">{assigneeName}</span>}
                        <DimBadge dimensions={item.dimensions} />
                        <ChecklistMeta item={item} />
                        {sched && <span className="axis-tasklist__meta-item num-tabular">{formatDateShort(item.publishDate ?? item.dueDate)}</span>}
                      </span>
                    </div>
                    <ItemMenu onDelete={() => onDelete(item.id)} />
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function ItemMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost"
        aria-label="خيارات"
      >
        <MoreVertical size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-7 z-20 axis-menu" style={{ minWidth: 120 }}>
            <button
              onClick={() => { onDelete(); setOpen(false) }}
              className="axis-menu__item"
              style={{ color: 'var(--danger-500)' }}
            >
              <Trash2 size={13} /> حذف
            </button>
          </div>
        </>
      )}
    </div>
  )
}
