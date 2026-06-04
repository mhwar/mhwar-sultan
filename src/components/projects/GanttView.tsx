'use client'
import type { Task, TaskStatus } from '@/types'

interface GanttViewProps {
  tasks: Task[]
  onOpen: (id: string) => void
}

const DAY = 24 * 3600 * 1000

const TONE: Record<TaskStatus, string> = {
  done: 'axis-gantt__bar--success',
  'in-progress': 'axis-gantt__bar--warning',
  todo: 'axis-gantt__bar--iris',
}
const FILL: Record<TaskStatus, number> = { done: 100, 'in-progress': 50, todo: 0 }

const MONTHS_AR = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس']

export default function GanttView({ tasks, onOpen }: GanttViewProps) {
  const dated = tasks.filter((t) => t.startDate && t.dueDate)

  if (dated.length === 0) {
    return (
      <div className="axis-card p-8 text-center text-sm" style={{ color: 'var(--fg-3)' }}>
        لا مهام بتواريخ محددة. أضف تاريخ بدء واستحقاق من تفاصيل المهمة لعرضها على المخطط الزمني.
      </div>
    )
  }

  const starts = dated.map((t) => new Date(t.startDate!).getTime())
  const ends = dated.map((t) => new Date(t.dueDate!).getTime())
  let min = Math.min(...starts)
  let max = Math.max(...ends)
  // pad by a few days each side
  min -= 3 * DAY
  max += 3 * DAY
  const total = max - min || DAY

  const pct = (t: number) => ((t - min) / total) * 100

  // Month gridlines/ticks
  const ticks: { left: number; label: string }[] = []
  const cur = new Date(min)
  cur.setDate(1)
  cur.setHours(0, 0, 0, 0)
  while (cur.getTime() <= max) {
    const t = cur.getTime()
    if (t >= min) ticks.push({ left: pct(t), label: `${MONTHS_AR[cur.getMonth()]} ${String(cur.getFullYear()).slice(2)}` })
    cur.setMonth(cur.getMonth() + 1)
  }

  const now = Date.now()
  const todayLeft = now >= min && now <= max ? pct(now) : null

  return (
    <div className="axis-gantt">
      <div className="axis-gantt__scroll">
        <div className="axis-gantt__grid">
          {/* Header */}
          <div className="axis-gantt__corner" />
          <div className="axis-gantt__header">
            {ticks.map((tk, i) => (
              <div key={i} className="axis-gantt__tick" style={{ insetInlineStart: `${tk.left}%` }}>
                <span>{tk.label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {dated.map((t) => {
            const left = pct(new Date(t.startDate!).getTime())
            const right = pct(new Date(t.dueDate!).getTime())
            const width = Math.max(right - left, 2)
            return (
              <div key={t.id} style={{ display: 'contents' }}>
                <div className="axis-gantt__row-label" title={t.title}>{t.title}</div>
                <div className="axis-gantt__track">
                  {ticks.map((tk, i) => (
                    <div key={i} className="axis-gantt__gridline" style={{ insetInlineStart: `${tk.left}%` }} />
                  ))}
                  {todayLeft !== null && <div className="axis-gantt__today-line" style={{ insetInlineStart: `${todayLeft}%` }} />}
                  <button
                    className={`axis-gantt__bar ${TONE[t.status]}`}
                    style={{ insetInlineStart: `${left}%`, width: `${width}%` }}
                    onClick={() => onOpen(t.id)}
                    title={t.title}
                  >
                    <span className="axis-gantt__progress" style={{ width: `${FILL[t.status]}%` }} />
                    <span className="axis-gantt__bar-label">{t.title}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
