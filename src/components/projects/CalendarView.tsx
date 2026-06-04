'use client'
import { useState } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import type { Task, TaskPriority } from '@/types'

interface CalendarViewProps {
  tasks: Task[]
  onOpen: (id: string) => void
}

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
// Week starts on Saturday (common in Arabic locales)
const WEEKDAYS_AR = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']

const CHIP: Record<TaskPriority, string> = {
  high: 'axis-cal__chip--danger',
  medium: 'axis-cal__chip--warning',
  low: 'axis-cal__chip--success',
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export default function CalendarView({ tasks, onOpen }: CalendarViewProps) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  // Bucket tasks by due day
  const byDay = new Map<string, Task[]>()
  tasks.forEach((t) => {
    if (!t.dueDate) return
    const d = new Date(t.dueDate)
    if (isNaN(d.getTime())) return
    const k = dayKey(d)
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k)!.push(t)
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 1) % 7 // Saturday-start
  const gridStart = new Date(year, month, 1 - offset)

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })

  const move = (delta: number) => setCursor(new Date(year, month + delta, 1))

  return (
    <div className="axis-cal-shell">
      <div className="axis-cal__head">
        <div className="axis-cal__head-left">
          <div className="axis-cal__nav">
            <button className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" onClick={() => move(-1)} aria-label="الشهر السابق"><ChevronRight size={16} data-flip-rtl /></button>
            <button className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" onClick={() => move(1)} aria-label="الشهر التالي"><ChevronLeft size={16} data-flip-rtl /></button>
          </div>
          <div className="axis-cal__title">
            <strong>{MONTHS_AR[month]}</strong>
            <span>{year}</span>
          </div>
        </div>
        <button className="axis-btn axis-btn--ghost axis-btn--sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>اليوم</button>
      </div>

      <div className="axis-cal__weekrow">
        {WEEKDAYS_AR.map((w) => <div key={w} className="axis-cal__weekday">{w}</div>)}
      </div>

      <div className="axis-cal__grid">
        {cells.map((d, i) => {
          const isOut = d.getMonth() !== month
          const isToday = dayKey(d) === dayKey(today)
          const dayTasks = byDay.get(dayKey(d)) ?? []
          return (
            <div key={i} className={`axis-cal__cell ${isOut ? 'is-out' : ''} ${isToday ? 'is-today' : ''}`}>
              <div className="axis-cal__cell-head">
                <span className="axis-cal__cell-num">{d.getDate()}</span>
                {dayTasks.length > 3 && <span className="axis-cal__cell-more">+{dayTasks.length - 3}</span>}
              </div>
              <div className="axis-cal__cell-events">
                {dayTasks.slice(0, 3).map((t) => (
                  <button key={t.id} className={`axis-cal__chip ${CHIP[t.priority]}`} onClick={() => onOpen(t.id)} title={t.title}>
                    <span className="axis-cal__chip-title">{t.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
