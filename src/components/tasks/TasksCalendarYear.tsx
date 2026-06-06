'use client'
import type { Task } from '@/types'
import { monthMatrix, dateToKey, dayKey, todayKey, keyInMonth, monthLabel } from '@/components/projects/tabs/content/contentMeta'

interface Props {
  year: number
  tasks: Task[]
  onPickMonth: (month: number) => void
  onPickDay: (key: string) => void
}

const MINI_WEEKDAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']

export default function TasksCalendarYear({ year, tasks, onPickMonth, onPickDay }: Props) {
  const today = todayKey()
  const counts = new Map<string, number>()
  for (const t of tasks) {
    const k = t.dueDate ? dayKey(t.dueDate) : null
    if (!k) continue
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }

  const tint = (n: number) => {
    if (n <= 0) return undefined
    const a = Math.min(0.5, 0.14 + n * 0.12)
    return `oklch(0.62 0.21 275 / ${a})`
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: 12 }, (_, month) => {
        const weeks = monthMatrix(year, month)
        return (
          <div key={month} className="rounded-xl p-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
            <button
              onClick={() => onPickMonth(month)}
              className="text-xs font-bold mb-2 transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {monthLabel(year, month)}
            </button>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {MINI_WEEKDAYS.map((w, i) => (
                <div key={i} className="text-center" style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {weeks.flat().map((date) => {
                const key = dateToKey(date)
                const inMonth = keyInMonth(key, year, month)
                if (!inMonth) return <div key={key} />
                const n = counts.get(key) ?? 0
                const isToday = key === today
                return (
                  <button
                    key={key}
                    onClick={() => onPickDay(key)}
                    title={n > 0 ? `${n} مهمة` : undefined}
                    className="axis-num flex items-center justify-center rounded transition-colors hover:bg-white/10"
                    style={{
                      fontSize: '0.6rem',
                      aspectRatio: '1',
                      color: isToday ? 'white' : 'var(--color-text-secondary)',
                      background: isToday ? 'var(--iris-500)' : tint(n),
                      fontWeight: n > 0 ? 700 : 400,
                    }}
                  >
                    {date.getUTCDate()}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
