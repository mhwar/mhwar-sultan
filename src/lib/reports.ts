import type { Project, Task } from '@/types'

/** Bucket a list of ISO dates into the last N calendar months (oldest→newest). */
export function monthBuckets(dates: string[], months = 6): number[] {
  const now = new Date()
  const ny = now.getFullYear()
  const nm = now.getMonth()
  const buckets = new Array(months).fill(0)
  for (const iso of dates) {
    const d = new Date(iso)
    if (isNaN(d.getTime())) continue
    const diff = (ny - d.getFullYear()) * 12 + (nm - d.getMonth())
    if (diff >= 0 && diff < months) buckets[months - 1 - diff]++
  }
  return buckets
}

/** Cumulative running total of a series. */
export function cumulative(series: number[]): number[] {
  let sum = 0
  return series.map((n) => (sum += n))
}

/** Percentage delta between the last two points of a series. */
export function trendDelta(series: number[]): number {
  if (series.length < 2) return 0
  const last = series[series.length - 1]
  const prev = series[series.length - 2]
  if (prev === 0) return last > 0 ? 100 : 0
  return Math.round(((last - prev) / prev) * 100)
}

export interface StatusDistribution {
  todo: number
  inProgress: number
  done: number
}

export function statusDistribution(tasks: Task[]): StatusDistribution {
  return {
    todo: tasks.filter((t) => t.status === 'todo').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }
}

export interface ActivityItem {
  id: string
  kind: 'task' | 'note'
  title: string
  sub: string
  date: string
}

/** Most recent tasks + notes, merged and sorted by date desc. */
export function recentActivity(
  tasks: Task[],
  projects: Project[],
  notes: { id: string; projectId: string; title: string; updatedAt: string }[],
  limit = 6,
): ActivityItem[] {
  const nameOf = (pid: string | undefined) => (pid ? projects.find((p) => p.id === pid)?.name : undefined) ?? '—'
  const taskItems: ActivityItem[] = tasks.map((t) => ({
    id: `t-${t.id}`,
    kind: 'task',
    title: t.title,
    sub: nameOf(t.projectId),
    date: t.createdAt,
  }))
  const noteItems: ActivityItem[] = notes.map((n) => ({
    id: `n-${n.id}`,
    kind: 'note',
    title: n.title,
    sub: nameOf(n.projectId),
    date: n.updatedAt,
  }))
  return [...taskItems, ...noteItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}
