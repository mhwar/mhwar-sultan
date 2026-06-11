'use client'
import { useState } from 'react'
import { Plus, Inbox } from 'lucide-react'
import type { ContentItem } from '@/types'
import {
  WEEKDAYS, monthMatrix, dateToKey, scheduledKey, todayKey, keyInMonth,
  STATUS_LABEL, STAGE_VAR, stageOf,
} from './contentMeta'
import { PlatformIcon } from './PlatformIcon'

interface Props {
  items: ContentItem[]
  year: number
  month: number
  clientColorMap: Record<string, string>
  clientNameMap: Record<string, string>
  onOpenItem: (item: ContentItem) => void
  onAddOnDay: (key: string) => void
  /** Move an item to a day (key) or to the unscheduled bucket (null). */
  onReschedule: (id: string, key: string | null) => void
}

export default function ContentCalendar({
  items, year, month, clientColorMap, clientNameMap, onOpenItem, onAddOnDay, onReschedule,
}: Props) {
  const weeks = monthMatrix(year, month)
  const today = todayKey()
  const [dragOver, setDragOver] = useState<string | null>(null)

  // Bucket items by day-key.
  const byDay = new Map<string, ContentItem[]>()
  const unscheduled: ContentItem[] = []
  for (const it of items) {
    const k = scheduledKey(it)
    if (!k) { unscheduled.push(it); continue }
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k)!.push(it)
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
          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--color-text-muted)' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((date) => {
                  const key = dateToKey(date)
                  const inMonth = keyInMonth(key, year, month)
                  const isToday = key === today
                  const dayItems = byDay.get(key) ?? []
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
                        background: isOver
                          ? 'oklch(0.62 0.21 275 / 0.08)'
                          : inMonth ? 'var(--color-surface-overlay)' : 'transparent',
                        border: `1px solid ${isOver ? 'var(--iris-500)' : isToday ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
                        opacity: inMonth ? 1 : 0.4,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="axis-num text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full"
                          style={isToday
                            ? { background: 'var(--iris-500)', color: 'white' }
                            : { color: 'var(--color-text-secondary)' }}
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
                        {dayItems.slice(0, 3).map((it) => (
                          <DayChip
                            key={it.id}
                            item={it}
                            color={it.clientId ? (clientColorMap[it.clientId] ?? 'var(--fg-3)') : 'var(--fg-3)'}
                            clientName={it.clientId ? clientNameMap[it.clientId] : undefined}
                            onClick={() => onOpenItem(it)}
                          />
                        ))}
                        {dayItems.length > 3 && (
                          <button
                            onClick={() => onAddOnDay(key)}
                            className="text-xs text-start ps-1"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            +{dayItems.length - 3} المزيد
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

      {/* Unscheduled bucket */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (dragOver !== '__unscheduled') setDragOver('__unscheduled') }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === '__unscheduled' ? null : d)) }}
        onDrop={onDrop(null)}
        className="rounded-xl p-3 transition-colors"
        style={{
          background: dragOver === '__unscheduled' ? 'oklch(0.62 0.21 275 / 0.08)' : 'var(--color-surface-overlay)',
          border: `1px dashed ${dragOver === '__unscheduled' ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Inbox size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
            بلا موعد ({unscheduled.length})
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>اسحب البطاقة إلى يوم لجدولتها</span>
        </div>
        {unscheduled.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--color-text-muted)' }}>كل المحتوى مجدول</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((it) => (
              <DayChip
                key={it.id}
                item={it}
                color={it.clientId ? (clientColorMap[it.clientId] ?? 'var(--fg-3)') : 'var(--fg-3)'}
                clientName={it.clientId ? clientNameMap[it.clientId] : undefined}
                onClick={() => onOpenItem(it)}
                inline
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DayChip({
  item, color, clientName, onClick, inline,
}: {
  item: ContentItem
  color: string
  clientName?: string
  onClick: () => void
  inline?: boolean
}) {
  return (
    <button
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move' }}
      onClick={onClick}
      title={`${item.title}${clientName ? ` — ${clientName}` : ''} · ${STATUS_LABEL[item.status]}`}
      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-start transition-colors hover:bg-white/5"
      style={{
        background: 'var(--color-surface-muted)',
        border: '1px solid var(--color-surface-border)',
        borderLeft: `2px solid ${color}`,
        cursor: 'grab',
        maxWidth: inline ? 200 : '100%',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STAGE_VAR[stageOf(item.status)] }} />
      <span className="text-xs truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>{item.title}</span>
      {item.platform && <PlatformIcon platform={item.platform} size={11} style={{ color: 'var(--color-text-muted)', opacity: 0.7 }} />}
    </button>
  )
}
