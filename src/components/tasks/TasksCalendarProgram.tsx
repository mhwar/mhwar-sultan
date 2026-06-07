'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Printer, X, CalendarDays, ChevronsUpDown, ChevronsDownUp } from 'lucide-react'
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
  /** Navigate to the dedicated day view. */
  onOpenDayView?: (key: string) => void
  /** Smoothly add a task to a day from the day panel; returns the new id. */
  onQuickAddOnDay?: (key: string, title: string) => string | undefined
}

const DAY_W = 78          // px — fixed day-cell width in dense mode
const LABEL_W = 76        // px — month label column width
const FREE_COLOR = 'var(--color-text-muted)'

interface HoverState { task: Task; left: number; top: number }

export default function TasksCalendarProgram({ year, months, dense, onOpenDayView, onQuickAddOnDay, ...p }: Props) {
  const { tasks, projectColorMap, projectNameMap, assigneeNameMap, onOpenItem, onReschedule } = p
  const today = todayKey()
  const [hover, setHover] = useState<HoverState | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [autoFocusAdd, setAutoFocusAdd] = useState(false)
  const [expandRows, setExpandRows] = useState(false)

  const openDay = (key: string, focusAdd = false) => { setHover(null); setAutoFocusAdd(focusAdd); setSelectedDay(key) }

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

  const maxChips = expandRows ? Infinity : (dense ? 3 : 5)

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
          border: isFree ? '1px solid var(--color-surface-border)' : 'none',
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
          <button
            onClick={() => inMonth && openDay(key)}
            className="axis-num flex items-center justify-center rounded-full font-semibold transition-colors hover:brightness-110"
            style={{
              width: dense ? 16 : 22, height: dense ? 16 : 22,
              fontSize: dense ? '0.6rem' : '0.72rem',
              background: isToday ? 'var(--iris-500)' : 'transparent',
              color: isToday ? '#fff' : 'var(--color-text-secondary)',
              cursor: inMonth ? 'pointer' : 'default',
            }}
            aria-label={inMonth ? `عرض يوم ${date.getUTCDate()}` : undefined}
          >
            {date.getUTCDate()}
          </button>
          {inMonth && (
            <button
              onClick={() => openDay(key, true)}
              className="opacity-0 group-hover/cell:opacity-100 rounded flex items-center justify-center transition-all hover:bg-white/10"
              style={{ width: dense ? 16 : 20, height: dense ? 16 : 20, color: 'var(--color-text-muted)' }}
              aria-label="إضافة مهمة"
            >
              <Plus size={dense ? 12 : 13} />
            </button>
          )}
        </div>

        {dayTasks.slice(0, maxChips).map((t) => <Chip key={t.id + key} t={t} />)}
        {dayTasks.length > maxChips && (
          <button
            onClick={() => openDay(key)}
            className="text-start ps-0.5 font-medium transition-colors hover:underline"
            style={{ fontSize: dense ? '0.55rem' : '0.65rem', color: 'var(--iris-500)' }}
          >
            +{dayTasks.length - maxChips} المزيد
          </button>
        )}
      </div>
    )
  }

  // ── Print the annual program (window.open + HTML, same as task export) ──
  const printProgram = () => {
    const html = buildAnnualProgramHTML({
      year, months, byDay, projectColorMap, projectNameMap, assigneeNameMap,
    })
    const w = window.open('', '_blank', 'width=1100,height=800,resizable=yes')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  // Shared overlays rendered in both layouts
  const overlays = (
    <>
      <HoverCard hover={hover} projectNameMap={projectNameMap} assigneeNameMap={assigneeNameMap} colorOf={colorOf} />
      {selectedDay && (
        <DayPanel
          dayKey={selectedDay}
          tasks={byDay.get(selectedDay) ?? []}
          autoFocusAdd={autoFocusAdd}
          colorOf={colorOf}
          projectNameMap={projectNameMap}
          assigneeNameMap={assigneeNameMap}
          onOpenItem={onOpenItem}
          onOpenDayView={onOpenDayView}
          onQuickAddOnDay={onQuickAddOnDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </>
  )

  // ════════════════════ DENSE (annual program) ════════════════════
  if (dense) {
    const maxWeeks = Math.max(...months.map((m) => monthMatrix(year, m).length))
    const weekGroupW = 7 * DAY_W + 6 * 2 // 7 cells + 6 inner gaps

    return (
      <>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            البرنامج السنوي — مرّر فوق أي مهمة لعرض تفاصيلها، وانقر على اليوم لإدارته
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpandRows((v) => !v)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: expandRows ? 'color-mix(in oklch, var(--iris-500) 12%, transparent)' : 'var(--color-surface-overlay)',
                color: expandRows ? 'var(--iris-500)' : 'var(--color-text-secondary)',
                border: `1px solid ${expandRows ? 'color-mix(in oklch, var(--iris-500) 40%, transparent)' : 'var(--color-surface-border)'}`,
              }}
            >
              {expandRows ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
              {expandRows ? 'تصغير الصفوف' : 'تمديد الصفوف'}
            </button>
            <button
              onClick={printProgram}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: 'var(--iris-500)', color: '#fff' }}
            >
              <Printer size={14} /> طباعة البرنامج السنوي
            </button>
          </div>
        </div>

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
        {overlays}
      </>
    )
  }

  // ════════════════════ NON-DENSE (single-month program) ════════════════════
  const month = months[0]
  const weeks = monthMatrix(year, month)
  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          البرنامج الشهري — انقر على أي يوم لإدارته وإضافة مهام
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandRows((v) => !v)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: expandRows ? 'color-mix(in oklch, var(--iris-500) 12%, transparent)' : 'var(--color-surface-overlay)',
              color: expandRows ? 'var(--iris-500)' : 'var(--color-text-secondary)',
              border: `1px solid ${expandRows ? 'color-mix(in oklch, var(--iris-500) 40%, transparent)' : 'var(--color-surface-border)'}`,
            }}
          >
            {expandRows ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
            {expandRows ? 'تصغير البطاقات' : 'توسيع البطاقات'}
          </button>
          <button
            onClick={printProgram}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: 'var(--iris-500)', color: '#fff' }}
          >
            <Printer size={14} /> طباعة البرنامج الشهري
          </button>
        </div>
      </div>

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
      {overlays}
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

// ── Day side panel: lists all of a day's tasks + smooth quick-add ──
function DayPanel({
  dayKey: key, tasks, autoFocusAdd, colorOf, projectNameMap, assigneeNameMap,
  onOpenItem, onOpenDayView, onQuickAddOnDay, onClose,
}: {
  dayKey: string
  tasks: Task[]
  autoFocusAdd: boolean
  colorOf: (t: Task) => string
  projectNameMap: Record<string, string>
  assigneeNameMap: Record<string, string>
  onOpenItem: (t: Task) => void
  onOpenDayView?: (key: string) => void
  onQuickAddOnDay?: (key: string, title: string) => string | undefined
  onClose: () => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { requestAnimationFrame(() => setOpen(true)) }, [])
  useEffect(() => { if (autoFocusAdd) requestAnimationFrame(() => inputRef.current?.focus()) }, [autoFocusAdd])

  const close = () => { setOpen(false); setTimeout(onClose, 320) }

  const dateLabel = formatDateAr(key + 'T00:00:00Z')
  const done = tasks.filter((t) => t.status === 'done').length

  const add = () => {
    const t = title.trim()
    if (!t || !onQuickAddOnDay) return
    onQuickAddOnDay(key, t)
    setTitle('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className={`axis-drawer-overlay ${open ? 'is-open' : ''}`}>
      <div className="axis-drawer-overlay__scrim" onClick={close} />
      <div className="axis-drawer" style={{ width: 440 }}>
        {/* Header */}
        <div className="axis-drawer__head">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in oklch, var(--iris-500) 15%, transparent)' }}>
              <CalendarDays size={17} style={{ color: 'var(--iris-500)' }} />
            </div>
            <div className="min-w-0">
              <p className="axis-drawer__title">{dateLabel}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                <span className="axis-num">{tasks.length}</span> مهمة
                {tasks.length > 0 && <> · <span className="axis-num">{done}</span> منجزة</>}
              </p>
            </div>
          </div>
          <button className="axis-iconbtn axis-iconbtn--md axis-iconbtn--ghost shrink-0" onClick={close} aria-label="إغلاق">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="axis-drawer__body space-y-3">
          {/* Quick add */}
          {onQuickAddOnDay && (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') add() }}
                placeholder="أضف مهمة لهذا اليوم…"
                className="flex-1 h-9 rounded-lg px-3 text-sm outline-none"
                style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              />
              <button
                onClick={add}
                disabled={!title.trim()}
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40"
                style={{ background: 'var(--iris-500)', color: '#fff' }}
                aria-label="إضافة"
              >
                <Plus size={16} />
              </button>
            </div>
          )}

          {/* Task list */}
          {tasks.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--color-text-muted)' }}>لا مهام في هذا اليوم</p>
          ) : (
            <div className="space-y-1.5">
              {tasks.map((t) => {
                const color = colorOf(t)
                const isFree = !t.projectId
                const assignee = t.assigneeId ? assigneeNameMap[t.assigneeId] : undefined
                const project = t.projectId ? projectNameMap[t.projectId] : 'بلا مشروع'
                const isDone = t.status === 'done'
                return (
                  <button
                    key={t.id}
                    onClick={() => onOpenItem(t)}
                    className="w-full text-start rounded-xl p-3 flex items-start gap-2.5 transition-colors hover:bg-white/5"
                    style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)' }}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: isFree ? 'var(--color-text-muted)' : color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text-primary)', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>
                        {t.title}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>{project}</span>
                        {assignee && <span>· {assignee}</span>}
                        <span>· {TASK_STATUS_LABELS[t.status]}</span>
                        <span className="flex items-center gap-1">·
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_VAR[t.priority] }} />
                          {PRIORITY_LABELS[t.priority]}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {onOpenDayView && (
          <div className="px-5 py-3" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
            <button
              onClick={() => { onOpenDayView(key); close() }}
              className="flex items-center justify-center gap-2 w-full h-9 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            >
              <CalendarDays size={15} /> فتح عرض اليوم كاملًا
            </button>
          </div>
        )}
      </div>
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

// ════════════════════ Annual program print (HTML → window.print) ════════════════════
const PRINT_FREE = '#cbd5e1'
function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildAnnualProgramHTML({
  year, months, byDay, projectColorMap, projectNameMap, assigneeNameMap,
}: {
  year: number
  months: number[]
  byDay: Map<string, Task[]>
  projectColorMap: Record<string, string>
  projectNameMap: Record<string, string>
  assigneeNameMap: Record<string, string>
}): string {
  // Single month → traditional vertical calendar grid (weeks stacked as rows),
  // which prints cleanly on one page. Annual keeps the horizontal week layout.
  if (months.length === 1) {
    return buildMonthlyProgramHTML({
      year, month: months[0], byDay, projectColorMap, projectNameMap, assigneeNameMap,
    })
  }

  const programTitle = `البرنامج السنوي ${year}`
  const programSub = 'عرض شامل لمهام السنة موزّعة على الأشهر والأسابيع — اللون يعبّر عن المشروع'

  const PDAY = 42       // print day-cell width (px)
  const maxWeeks = Math.max(...months.map((m) => monthMatrix(year, m).length))
  const wgW = 7 * PDAY + 6 // 7 cells + inner gaps (1px)

  const chipHtml = (t: Task): string => {
    const isFree = !t.projectId
    const color = isFree ? PRINT_FREE : (projectColorMap[t.projectId as string] ?? PRINT_FREE)
    const assignee = t.assigneeId ? assigneeNameMap[t.assigneeId] : ''
    const done = t.status === 'done'
    const cls = `chip${isFree ? ' free' : ''}${done ? ' done' : ''}`
    return `<div class="${cls}" style="background:${color}">`
      + `<span class="t">${escHtml(t.title)}</span>`
      + (assignee ? `<span class="a">${escHtml(assignee)}</span>` : '')
      + `</div>`
  }

  const cellHtml = (date: Date, month: number): string => {
    const key = dateToKey(date)
    const inMonth = keyInMonth(key, year, month)
    if (!inMonth) return `<div class="cell out"></div>`
    const dayTasks = byDay.get(key) ?? []
    const shown = dayTasks.slice(0, 4)
    const extra = dayTasks.length - shown.length
    return `<div class="cell">`
      + `<div class="dn">${date.getUTCDate()}</div>`
      + shown.map(chipHtml).join('')
      + (extra > 0 ? `<div class="more">+${extra}</div>` : '')
      + `</div>`
  }

  const headerRow = `<div class="hrow">`
    + `<div class="mlbl-sp"></div>`
    + Array.from({ length: maxWeeks }, (_, wi) =>
        `<div class="wg" style="width:${wgW}px">`
        + `<div class="wgt">الأسبوع ${wi + 1}</div>`
        + `<div class="wdays">${WEEKDAYS.map((d) => `<span class="wd">${d}</span>`).join('')}</div>`
        + `</div>`
      ).join('')
    + `</div>`

  const monthRows = months.map((month) => {
    const weeks = monthMatrix(year, month)
    const name = monthLabel(year, month).split(' ')[0]
    const weeksHtml = weeks.map((week) =>
      `<div class="wgb" style="width:${wgW}px">${week.map((d) => cellHtml(d, month)).join('')}</div>`
    ).join('')
    return `<div class="mrow"><div class="mlbl">${escHtml(name)}</div>${weeksHtml}</div>`
  }).join('')

  // Legend — only projects that own at least one task in range
  const usedProjectIds = new Set<string>()
  byDay.forEach((list) => list.forEach((t) => { if (t.projectId) usedProjectIds.add(t.projectId) }))
  const legend = [...usedProjectIds]
    .map((id) => `<span class="lg"><span class="sw" style="background:${projectColorMap[id] ?? PRINT_FREE}"></span>${escHtml(projectNameMap[id] ?? id)}</span>`)
    .join('')

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>${escHtml(programTitle)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Cairo',sans-serif;background:#fff;color:#0f172a;padding:16px 20px;direction:rtl}
@page{size:A4 landscape;margin:8mm}
h1{font-size:18px;font-weight:700}
.sub{color:#64748b;font-size:11px;margin-bottom:12px}
.print-btn{padding:9px 22px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:'Cairo',sans-serif;margin-bottom:14px}
@media print{.print-btn{display:none}}
.prog{display:flex;flex-direction:column;gap:4px;width:max-content}
.hrow,.mrow{display:flex;gap:6px;align-items:stretch}
.mlbl,.mlbl-sp{flex:0 0 46px;width:46px}
.mlbl{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:9px;padding:2px}
.wg{flex:0 0 auto}
.wgt{text-align:center;font-size:7.5px;font-weight:700;color:#64748b;margin-bottom:2px}
.wdays{display:grid;grid-template-columns:repeat(7,${PDAY}px);gap:1px}
.wd{text-align:center;font-size:7px;font-weight:600;color:#94a3b8}
.wgb{flex:0 0 auto;display:grid;grid-template-columns:repeat(7,${PDAY}px);gap:1px}
.cell{min-height:38px;border:1px solid #e5e7eb;border-radius:3px;padding:1px;display:flex;flex-direction:column;gap:1px;overflow:hidden}
.cell.out{background:#fafafa;border-color:#f1f5f9}
.dn{font-size:7px;color:#94a3b8;text-align:left;line-height:1;font-weight:600}
.chip{border-radius:2px;padding:1px 2px;color:#fff;overflow:hidden}
.chip .t{display:block;font-size:6px;font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip .a{display:block;font-size:5.5px;line-height:1.1;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip.free{background:#e2e8f0!important;color:#334155}
.chip.done{opacity:.5}
.chip.done .t{text-decoration:line-through}
.more{font-size:6px;color:#94a3b8;text-align:center}
.legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb}
.lg{display:flex;align-items:center;gap:5px;font-size:10px;color:#334155}
.sw{width:11px;height:11px;border-radius:3px;display:inline-block}
.footer{margin-top:12px;font-size:10px;color:#94a3b8}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
<h1>${escHtml(programTitle)}</h1>
<div class="sub">${escHtml(programSub)}</div>
<div class="prog">
${headerRow}
${monthRows}
</div>
${legend ? `<div class="legend">${legend}</div>` : ''}
<div class="footer">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
</body>
</html>`
}

// ════════════════════ Monthly program print (vertical calendar grid) ════════════════════
function buildMonthlyProgramHTML({
  year, month, byDay, projectColorMap, projectNameMap, assigneeNameMap,
}: {
  year: number
  month: number
  byDay: Map<string, Task[]>
  projectColorMap: Record<string, string>
  projectNameMap: Record<string, string>
  assigneeNameMap: Record<string, string>
}): string {
  const monthName = monthLabel(year, month).split(' ')[0]
  const weeks = monthMatrix(year, month)

  const chipHtml = (t: Task): string => {
    const isFree = !t.projectId
    const color = isFree ? PRINT_FREE : (projectColorMap[t.projectId as string] ?? PRINT_FREE)
    const assignee = t.assigneeId ? assigneeNameMap[t.assigneeId] : ''
    const done = t.status === 'done'
    const cls = `chip${isFree ? ' free' : ''}${done ? ' done' : ''}`
    return `<div class="${cls}" style="background:${color}">`
      + `<span class="t">${escHtml(t.title)}</span>`
      + (assignee ? `<span class="a">${escHtml(assignee)}</span>` : '')
      + `</div>`
  }

  const cellHtml = (date: Date): string => {
    const key = dateToKey(date)
    const inMonth = keyInMonth(key, year, month)
    if (!inMonth) return `<td class="cell out"></td>`
    const dayTasks = byDay.get(key) ?? []
    const shown = dayTasks.slice(0, 6)
    const extra = dayTasks.length - shown.length
    return `<td class="cell">`
      + `<div class="dn">${date.getUTCDate()}</div>`
      + shown.map(chipHtml).join('')
      + (extra > 0 ? `<div class="more">+${extra} مهمة</div>` : '')
      + `</td>`
  }

  const headerRow = `<tr>${WEEKDAYS.map((d) => `<th class="wd">${d}</th>`).join('')}</tr>`
  const weekRows = weeks.map((week) =>
    `<tr>${week.map((d) => cellHtml(d)).join('')}</tr>`
  ).join('')

  // Legend — only projects that own at least one task this month
  const usedProjectIds = new Set<string>()
  weeks.flat().forEach((d) => {
    const k = dateToKey(d)
    if (!keyInMonth(k, year, month)) return
    ;(byDay.get(k) ?? []).forEach((t) => { if (t.projectId) usedProjectIds.add(t.projectId) })
  })
  const legend = [...usedProjectIds]
    .map((id) => `<span class="lg"><span class="sw" style="background:${projectColorMap[id] ?? PRINT_FREE}"></span>${escHtml(projectNameMap[id] ?? id)}</span>`)
    .join('')

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>البرنامج الشهري — ${escHtml(monthName)} ${year}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Cairo',sans-serif;background:#fff;color:#0f172a;padding:16px 20px;direction:rtl}
@page{size:A4 landscape;margin:10mm}
h1{font-size:20px;font-weight:700}
.sub{color:#64748b;font-size:12px;margin-bottom:14px}
.print-btn{padding:9px 22px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-family:'Cairo',sans-serif;margin-bottom:14px}
@media print{.print-btn{display:none}}
table.cal{width:100%;border-collapse:collapse;table-layout:fixed}
.wd{padding:6px 4px;font-size:11px;font-weight:700;color:#64748b;background:#f1f5f9;border:1px solid #e2e8f0;text-align:center}
.cell{vertical-align:top;border:1px solid #e5e7eb;padding:3px;height:96px;width:14.28%;overflow:hidden}
.cell.out{background:#fafafa;border-color:#f1f5f9}
.dn{font-size:11px;color:#475569;font-weight:700;text-align:left;margin-bottom:2px}
.chip{border-radius:3px;padding:2px 4px;color:#fff;overflow:hidden;margin-bottom:2px}
.chip .t{display:block;font-size:8.5px;font-weight:700;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip .a{display:block;font-size:7.5px;line-height:1.15;opacity:.88;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.chip.free{background:#e2e8f0!important;color:#334155}
.chip.done{opacity:.5}
.chip.done .t{text-decoration:line-through}
.more{font-size:8px;color:#94a3b8;font-weight:600}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb}
.lg{display:flex;align-items:center;gap:5px;font-size:11px;color:#334155}
.sw{width:12px;height:12px;border-radius:3px;display:inline-block}
.footer{margin-top:12px;font-size:10px;color:#94a3b8}
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">طباعة / حفظ كـ PDF</button>
<h1>البرنامج الشهري — ${escHtml(monthName)} ${year}</h1>
<div class="sub">عرض مهام الشهر موزّعة على أيام الأسبوع — اللون يعبّر عن المشروع</div>
<table class="cal">
<thead>${headerRow}</thead>
<tbody>${weekRows}</tbody>
</table>
${legend ? `<div class="legend">${legend}</div>` : ''}
<div class="footer">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
</body>
</html>`
}
