'use client'
import { FolderKanban, Zap, CheckCircle2, TrendingUp } from 'lucide-react'
import { useProjectStore, useTaskStore, computeStats } from '@/store/store'

interface StatCardProps {
  icon: React.ReactNode
  value: number | string
  label: string
  sub?: string
  accent: string
}

function StatCard({ icon, value, label, sub, accent }: StatCardProps) {
  return (
    <div className="axis-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="axis-num text-3xl font-bold mb-1" style={{ color: 'var(--fg-1)' }}>
        {value}
      </div>
      <div className="text-sm font-medium mb-0.5" style={{ color: 'var(--fg-2)' }}>
        {label}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: 'var(--fg-3)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export default function StatsGrid() {
  const projects = useProjectStore((s) => s.projects)
  const tasks = useTaskStore((s) => s.tasks)
  const stats = computeStats(projects, tasks)

  const cards = [
    {
      icon: <FolderKanban size={20} />,
      value: stats.totalProjects,
      label: 'إجمالي المشاريع',
      sub: `${stats.activeProjects} نشط`,
      accent: 'var(--color-brand)',
    },
    {
      icon: <Zap size={20} />,
      value: stats.activeProjects,
      label: 'مشاريع نشطة',
      sub: 'جارية الآن',
      accent: 'var(--color-status-active)',
    },
    {
      icon: <CheckCircle2 size={20} />,
      value: stats.completedTasks,
      label: 'مهام منجزة',
      sub: `من أصل ${stats.totalTasks}`,
      accent: 'var(--color-status-completed)',
    },
    {
      icon: <TrendingUp size={20} />,
      value: `${stats.avgProgress}%`,
      label: 'متوسط التقدم',
      sub: 'عبر جميع المشاريع',
      accent: 'var(--color-status-paused)',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  )
}
