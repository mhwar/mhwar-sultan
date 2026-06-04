'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import type { Project } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'
import ProjectIcon from '@/lib/icons'
import { hexToRgba, timeAgoAr } from '@/lib/utils'

type SortKey = 'name' | 'progress' | 'tasks' | 'updatedAt'
type SortDir = 'asc' | 'desc'

interface ProjectsTableProps {
  projects: Project[]
  taskCounts: Record<string, number>
}

export default function ProjectsTable({ projects, taskCounts }: ProjectsTableProps) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...projects].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'name': cmp = a.name.localeCompare(b.name, 'ar'); break
      case 'progress': cmp = a.progress - b.progress; break
      case 'tasks': cmp = (taskCounts[a.id] ?? 0) - (taskCounts[b.id] ?? 0); break
      case 'updatedAt': cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (k !== sortKey) return <ChevronsUpDown size={12} className="axis-table__sort" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="axis-table__sort is-active" />
      : <ArrowDown size={12} className="axis-table__sort is-active" />
  }

  const header = (key: SortKey, label: string, end = false) => (
    <th className={end ? 'is-end' : undefined}>
      <span className="axis-table__th" onClick={() => toggleSort(key)} style={{ cursor: 'pointer' }}>
        {label}
        <SortIcon k={key} />
      </span>
    </th>
  )

  return (
    <div className="axis-table__wrap">
      <table className="axis-table axis-table--comfortable">
        <thead>
          <tr>
            {header('name', 'المشروع')}
            <th>الفئة</th>
            <th>الحالة</th>
            {header('progress', 'التقدم')}
            {header('tasks', 'المهام', true)}
            {header('updatedAt', 'آخر تحديث', true)}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="is-clickable" onClick={() => router.push(`/projects/${p.id}`)}>
              <td>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 flex items-center justify-center shrink-0"
                    style={{ background: hexToRgba(p.color, 0.15), color: p.color, borderRadius: 'var(--radius-sm)' }}
                  >
                    <ProjectIcon name={p.icon} size={15} />
                  </div>
                  <span className="font-medium" style={{ color: 'var(--fg-1)' }}>{p.name}</span>
                </div>
              </td>
              <td style={{ color: 'var(--fg-3)' }}>{p.category || '—'}</td>
              <td><StatusBadge status={p.status} /></td>
              <td>
                <div className="progress-cell">
                  <div className="progress-cell__bar">
                    <div className="progress-cell__fill" style={{ width: `${p.progress}%`, background: p.color }} />
                  </div>
                  <span className="progress-cell__num">{p.progress}%</span>
                </div>
              </td>
              <td className="is-end is-mono">{taskCounts[p.id] ?? 0}</td>
              <td className="is-end" style={{ color: 'var(--fg-3)' }}>{timeAgoAr(p.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
