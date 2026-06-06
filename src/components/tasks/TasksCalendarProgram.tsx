'use client'
import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Task } from '@/types'
import {
  WEEKDAYS, monthMatrix, dateToKey, dayKey, todayKey, keyInMonth, monthLabel,
} from '@/components/projects/tabs/content/contentMeta'
import { TASK_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_VAR, formatDateAr } from '@/lib/utils'
import type { TaskViewProps } from './shared'

interface Props extends TaskViewProps {
  year: number
  /** Month indexes to render. Year program → 0..11. Month program → [month]. */
  months: number[]
  /** true = annual grid (weeks laid horizontally); false = single month (weeks stacked). */
  dense: boolean
}

const DAY_W = 78          // px — fixed day-cell width in dense mode
const LABEL_W = 76        // px — month label column width
const FREE_COLOR = 'var(--color-text-muted)'

interface HoverState { task: Task; left: number; top: number }

export default function TasksCalendarProgram({ year, months, dense, ...p }: Props) {
  const { tasks, projectColorMap, projectNameMap, assigneeNameMap, onOpenItem, onAddOnDay, onReschedule } = p
  const today = todayKey()
  const [hover, setHover] = useState<HoverState | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  // ── Map every task to each day it covers (spans repeat across days) ──
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>()
    for (const t of tasks) {
      const sk = t.startDate ? dayKey(t.startDate) : null
      const ek = t.dueDate ? dayKey(t.dueDate) : null
      if (sk && ek && sk !== ek) {
        const cur = new Date(sk + 'T00:00:00Z')
        const end = new Date(ek + 'T00:00:00Z')
        while (cur <= end) {
          const k = dateToKey(cur)
          if (!m.has(k)) m.set(k, [])
          m.get(k)!.push(t)
          cur.setUTCDate(cur.getUTCDate() + 1)
        }
      } else if (ek) {
        if (!m.has(ek)) m.set(ek, [])
        m.get(ek)!.push(t)
      }
    }
    return m
  }, [tasks])

  const colorOf = (t: Task) => (t.projectId ? (projectColorMap[t.projectId] ?? FREE_COLOR) : FREE_COLOR)

  const showHover = (t: Task) => (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const cardW = 240
    let left = r.left + r.width / 2 - cardW / 2
    left = Math.max(8, Math.min(left, window.innerWidth - cardW - 8))
    const top = r.bottom + 6
    setHover({ task: t, left, top })
  }

  const maxChips = dense ? 3 : 5

  // ── A single colored task chip (project color, title + assignee) ──
  const Chip = ({ t }: { t: Task }) => {
    const color = colorOf(t)
    const isFree = !t.projectId
    const assignee = t.assigneeId ? assigneeNameMap[t.assigneeId] : undefined
    const done = t.status === 'done'
    return (
      <button
        draggable={!dense}
        onDragStart={(e) => { if (!dense) { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move' } }}
        onClick={() => onOpenItem(t)}
        onMouseEnter={showHover(t)}
        onMouseLeave={() => setHover(null)}
        className="w-full text-start rounded transition-transform hover:scale-[1.02] hover:z-10 relative"
        style={{
          background: isFree ? 'var(--color-surface-muted)' : color,
          borderInlineStart: isFree ? `2px solid ${FREE_COLOR}` : 'none',
          padding: dense ? '2px 4px' : '4px 6px',
          opacity: done ? 0.55 : 1,
          cursor: dense ? 'pointer' : 'grab',
          lineHeight: 1.15,
        }}
      >
        <span
          className="block truncate font-semibold"
          style={{
            fontSize: dense ? '0.62rem' : '0.72rem',
            color: isFree ? 'var(--color-text-primary)' : '#fff',
            textDecoration: done ? 'line-through' : 'none',
          }}
        >
          {t.title}
        </span>
        {assignee && (
          <span
            className="block truncate"
            style={{
              fontSize: dense ? '0.56rem' : '0.64rem',
              color: isFree ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.82)',
              marginTop: 1,
            }}
          >
            {assignee}
          </span>
        )}
      </button>
    )
  }

  // ── A single day cell ──
  const DayCell = ({ date, month }: { date: Date; month: number }) => {
    const key = dateToKey(date)
    const inMonth = keyInMonth(key, year, month)
    const isToday = key === today
    const dayTasks = inMonth ? (byDay.get(key) ?? []) : []
    const isOver = dragOver === key

    return (
      <div
        onDragOver={!dense ? (e) => { e.preventDefault(); if (dragOver !== key) setDragOver(key) } : undefined}
        onDragLeave={!dense ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver((d) => (d === key ? null : d)) } : undefined}
        onDrop={!dense ? (e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id && inMonth) onReschedule(id, key); setDragOver(null) } : undefined}
        className="group/cell relative flex flex-col rounded-md transition-colors"
        style={{
          minHeight: dense ? 60 : 116,
          padding: dense ? 3 : 6,
          gap: dense ? 2 : 3,
          background: isOver ? 'oklch(0.62 0.21 275 / 0.08)' : inMonth ? 'var(--color-surface-overlay)' : 'transparent',
          border: `1px solid ${isOver ? 'var(--iris-500)' : isToday ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
          opacity: inMonth ? 1 : 0.35,
        }}
      >
        <div className="flex items-center justify-between">
          <span
            className="axis-num flex items-center justify-center rounded-full font-semibold"
            style={{
              width: dense ? 16 : 22, height: dense ? 16 : 22,
              fontSize: dense ? '0.6rem' : '0.72rem',
              background: isToday ? 'var(--iris-500)' : 'transparent',
              color: isToday ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {date.getUTCDate()}
          </span>
          {!dense && inMonth && (
            <button
              onClick={() => onAddOnDay(key)}
              className="opacity-0 group-hover/cell:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-white/10"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="إضافة"
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        {dayTasks.slice(0, maxChips).map((t) => <Chip key={t.id + key} t={t} />)}
        {dayTasks.length > maxChips && (
          <button
            onClick={() => (dense ? onOpenItem(dayTasks[maxChips]) : onAddOnDay(key))}
            className="text-start ps-0.5"
            style={{ fontSize: dense ? '0.55rem' : '0.65rem', color: 'var(--color-text-muted)' }}
          >
            +{dayTasks.length - maxChips} المزيد
          </button>
        )}
      </div>
    )
  }

  // ════════════════════ DENSE (annual program) ════════════════════
  if (dense) {
    const maxWeeks = Math.max(...months.map((m) => monthMatrix(year, m).length))
    const weekGroupW = 7 * DAY_W + 6 * 2 // 7 cells + 6 inner gaps

    return (
      <>
        <div className="overflow-x-auto -mx-1 px-1 pb-2">
          <div className="inline-flex flex-col gap-2" style={{ minWidth: '100%' }}>

            {/* Top header: spacer + week-group weekday headers */}
            <div className="flex" style={{ gap: 10 }}>
              <div style={{ width: LABEL_W, flexShrink: 0 }} />
              {Array.from({ length: maxWeeks }, (_, wi) => (
                <div key={wi} style={{ width: weekGroupW, flexShrink: 0 }}>
                  <div className="text-center text-xs font-bold mb-1" style={{ color: 'var(--color-text-muted)', fontSize: '0.62rem' }}>
                    الأسبوع {wi + 1}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, ${DAY_W}px)`, gap: 2 }}>
                    {WEEKDAYS.map((d, i) => (
                      <div key={i} className="text-center font-semibold" style={{ color: 'var(--color-text-muted)', fontSize: '0.58rem' }}>{d}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* One row per month */}
            {months.map((month) => {
              const weeks = monthMatrix(year, month)
              const daysWithTasks = weeks.flat().filter((d) => {
                const k = dateToKey(d)
                return keyInMonth(k, year, month) && (byDay.get(k)?.length ?? 0) > 0
              }).length
              return (
                <div key={month} className="flex items-stretch" style={{ gap: 10 }}>
                  {/* Month label */}
                  <div
                    className="flex flex-col items-center justify-center rounded-lg shrink-0 text-center"
                    style={{ width: LABEL_W, background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', padding: 6 }}
                  >
                    <span className="text-sm font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                      {monthLabel(year, month).split(' ')[0]}
                    </span>
                    {daysWithTasks > 0 && (
                      <span className="axis-num text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {daysWithTasks} يوم
                      </span>
                    )}
                  </div>

                  {/* Weeks laid horizontally */}
                  {weeks.map((week, wi) => (
                    <div key={wi} style={{ width: weekGroupW, flexShrink: 0, display: 'grid', gridTemplateColumns: `repeat(7, ${DAY_W}px)`, gap: 2 }}>
                      {week.map((date) => <DayCell key={dateToKey(date)} date={date} month={month} />)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
        <HoverCard hover={hover} projectNameMap={projectNameMap} assigneeNameMap={assigneeNameMap} colorOf={colorOf} />
      </>
    )
  }

  // ════════════════════ NON-DENSE (single-month program) ════════════════════
  const month = months[0]
  const weeks = monthMatrix(year, month)
  return (
    <>
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--color-text-muted)' }}>{w}</div>
        ))}
      </div>
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((date) => <DayCell key={dateToKey(date)} date={date} month={month} />)}
          </div>
        ))}
      </div>
      <HoverCard hover={hover} projectNameMap={projectNameMap} assigneeNameMap={assigneeNameMap} colorOf={colorOf} />
    </>
  )
}

// ── Floating hover detail card (fixed-positioned, escapes scroll clipping) ──
function HoverCard({
  hover, projectNameMap, assigneeNameMap, colorOf,
}: {
  hover: HoverState | null
  projectNameMap: Record<string, string>
  assigneeNameMap: Record<string, string>
  colorOf: (t: Task) => string
}) {
  if (!hover) return null
  const { task: t } = hover
  const project = t.projectId ? projectNameMap[t.projectId] : 'بلا مشروع'
  const assignee = t.assigneeId ? assigneeNameMap[t.assigneeId] : undefined
  const color = colorOf(t)

  return (
    <div
      className="fixed z-[80] rounded-xl p-3 pointer-events-none animate-fade-up"
      style={{
        left: hover.left, top: hover.top, width: 240,
        background: 'var(--color-surface-overlay)',
        border: '1px solid var(--color-surface-border)',
        boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.3))',
      }}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: color }} />
        <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{t.title}</p>
      </div>
      <div className="space-y-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        <Row label="المشروع" value={project} />
        {assignee && <Row label="المسؤول" value={assignee} />}
        <Row label="الحالة" value={TASK_STATUS_LABELS[t.status]} />
        <Row label="الأولوية" value={PRIORITY_LABELS[t.priority]} dot={PRIORITY_VAR[t.priority]} />
        {t.startDate && t.dueDate && dayKey(t.startDate) !== dayKey(t.dueDate) ? (
          <Row label="المدة" value={`${formatDateAr(t.startDate)} ← ${formatDateAr(t.dueDate)}`} />
        ) : t.dueDate ? (
          <Row label="الاستحقاق" value={formatDateAr(t.dueDate)} />
        ) : null}
      </div>
      <p className="text-xs mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-surface-border)', color: 'var(--color-text-muted)' }}>
        انقر لفتح المهمة
      </p>
    </div>
  )
}

function Row({ label, value, dot }: { label: string; value: string; dot?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span className="flex items-center gap-1.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
        {dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}
        <span className="truncate">{value}</span>
      </span>
    </div>
  )
}
