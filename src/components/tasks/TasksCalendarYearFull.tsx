'use client'
import type { Task } from '@/types'
import { monthMatrix, dateToKey, dayKey, todayKey, keyInMonth, monthLabel, WEEKDAYS } from '@/components/projects/tabs/content/contentMeta'

const SHORT_DAYS = WEEKDAYS.map((w) => w[0])

interface Props {
  year: number
  tasks: Task[]
  projectColorMap: Record<string, string>
  onPickDay: (key: string) => void
  onPickMonth: (month: number) => void
}

export default function TasksCalendarYearFull({ year, tasks, projectColorMap, onPickDay, onPickMonth }: Props) {
  const today = todayKey()

  const byDay = new Map<string, Task[]>()
  for (const t of tasks) {
    const k = t.dueDate ? dayKey(t.dueDate) : null
    if (!k) continue
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k)!.push(t)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 12 }, (_, month) => {
        const weeks = monthMatrix(year, month)
        return (
          <div key={month} className="axis-card p-3">
            <button
              onClick={() => onPickMonth(month)}
              className="text-sm font-bold mb-3 w-full text-start transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {monthLabel(year, month)}
            </button>

            {/* Weekday header */}
            <div className="grid grid-cols-7 mb-1">
              {SHORT_DAYS.map((d, i) => (
                <div key={i} className="text-center text-xs font-semibold py-0.5" style={{ color: 'var(--color-text-muted)', fontSize: '0.65rem' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Week rows */}
            <div className="space-y-px">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((date) => {
                    const key = dateToKey(date)
                    const inMonth = keyInMonth(key, year, month)
                    const isToday = key === today
                    const dayTasks = byDay.get(key) ?? []

                    return (
                      <button
                        key={key}
                        onClick={() => inMonth && onPickDay(key)}
                        className="flex flex-col items-center gap-px py-0.5 rounded transition-colors hover:bg-white/5"
                        style={{ opacity: inMonth ? 1 : 0.25, cursor: inMonth ? 'pointer' : 'default' }}
                      >
                        {/* Day number */}
                        <span
                          className="axis-num flex items-center justify-center rounded-full font-semibold"
                          style={{
                            width: 20,
                            height: 20,
                            fontSize: '0.65rem',
                            background: isToday ? 'var(--iris-500)' : 'transparent',
                            color: isToday ? 'white' : 'var(--color-text-secondary)',
                            fontWeight: dayTasks.length > 0 ? 700 : 400,
                          }}
                        >
                          {date.getUTCDate()}
                        </span>

                        {/* Task bars — up to 3 */}
                        {inMonth && dayTasks.length > 0 && (
                          <div className="flex flex-col gap-px w-full px-0.5">
                            {dayTasks.slice(0, 3).map((t) => (
                              <div
                                key={t.id}
                                className="w-full rounded-sm"
                                style={{
                                  height: 3,
                                  background: t.projectId
                                    ? (projectColorMap[t.projectId] ?? 'var(--iris-500)')
                                    : 'var(--iris-500)',
                                  opacity: t.status === 'done' ? 0.4 : 1,
                                }}
                              />
                            ))}
                            {dayTasks.length > 3 && (
                              <span className="text-center" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', lineHeight: 1.2 }}>
                                +{dayTasks.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
