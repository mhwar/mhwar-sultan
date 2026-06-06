'use client'
import { ArrowLeft, Plus, AlertCircle, Clock, Wallet } from 'lucide-react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ProjectCard from '@/components/projects/ProjectCard'
import { useProjectStore, useTaskStore, useFinanceStore, useContentStore } from '@/store/store'
import { formatDateAr } from '@/lib/utils'

export default function DashboardPage() {
  const projects = useProjectStore((s) => s.projects)
  const tasks = useTaskStore((s) => s.tasks)
  const financeEntries = useFinanceStore((s) => s.entries)
  const contentItems = useContentStore((s) => s.items)

  const todayStr = new Date().toISOString().slice(0, 10)

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  const todayTasks = tasks.filter((t) => t.dueDate?.slice(0, 10) === todayStr && t.status !== 'done').slice(0, 6)
  const overdueTasks = tasks.filter((t) => t.dueDate && t.dueDate.slice(0, 10) < todayStr && t.status !== 'done').slice(0, 4)
  const overdueFinance = financeEntries.filter((e) => e.status === 'overdue').slice(0, 4)
  const todayContent = contentItems.filter((i) => {
    const k = (i.publishDate ?? i.dueDate)?.slice(0, 10)
    return k === todayStr && i.status !== 'delivered' && i.status !== 'published'
  }).slice(0, 4)

  const urgentCount = todayTasks.length + overdueTasks.length + overdueFinance.length + todayContent.length

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              لوحة التحكم
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {formatDateAr(new Date().toISOString())}
            </p>
          </div>
          <Link href="/projects" className="axis-btn axis-btn--primary axis-btn--md">
            <Plus size={16} />
            مشروع جديد
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsGrid />
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Projects — 2/3 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                أحدث المشاريع
              </h2>
              <Link
                href="/projects"
                className="flex items-center gap-1 text-sm transition-colors hover:opacity-80"
                style={{ color: 'var(--color-brand)' }}
              >
                عرض الكل
                <ArrowLeft size={14} />
              </Link>
            </div>
            <div className="grid gap-4">
              {recentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  taskCount={tasks.filter((t) => t.projectId === project.id).length}
                />
              ))}
            </div>
          </div>

          {/* Side column — 1/3 */}
          <div className="space-y-4">
            {/* Today panel */}
            <div className="axis-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold flex-1" style={{ color: 'var(--color-text-primary)' }}>اليوم</h3>
                {urgentCount > 0 && (
                  <span className="axis-num text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: 'color-mix(in oklch, var(--warning-500) 15%, transparent)', color: 'var(--warning-500)' }}>
                    {urgentCount}
                  </span>
                )}
              </div>

              {urgentCount === 0 && (
                <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>لا توجد مستحقات اليوم</p>
              )}

              {todayTasks.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock size={11} style={{ color: 'var(--iris-500)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>مهام اليوم</span>
                  </div>
                  <div className="space-y-0.5">
                    {todayTasks.map((t) => {
                      const proj = projects.find((p) => p.id === t.projectId)
                      return (
                        <Link key={t.id} href={`/projects/${t.projectId}`} className="flex items-center gap-2 py-1.5 hover:opacity-80 transition-opacity">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: proj?.color ?? 'var(--iris-500)' }} />
                          <p className="text-xs truncate flex-1" style={{ color: 'var(--color-text-secondary)' }}>{t.title}</p>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {todayContent.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertCircle size={11} style={{ color: 'var(--warning-500)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>محتوى موعده اليوم</span>
                  </div>
                  <div className="space-y-0.5">
                    {todayContent.map((c) => {
                      const proj = projects.find((p) => p.id === c.projectId)
                      return (
                        <Link key={c.id} href={`/projects/${c.projectId}`} className="flex items-center gap-2 py-1.5 hover:opacity-80 transition-opacity">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: proj?.color ?? 'var(--warning-500)' }} />
                          <p className="text-xs truncate flex-1" style={{ color: 'var(--color-text-secondary)' }}>{c.title || '(بلا عنوان)'}</p>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {overdueTasks.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertCircle size={11} style={{ color: 'var(--danger-500)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>مهام متأخرة</span>
                  </div>
                  <div className="space-y-0.5">
                    {overdueTasks.map((t) => {
                      const proj = projects.find((p) => p.id === t.projectId)
                      return (
                        <Link key={t.id} href={`/projects/${t.projectId}`} className="flex items-center gap-2 py-1.5 hover:opacity-80 transition-opacity">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--danger-500)' }} />
                          <p className="text-xs truncate flex-1" style={{ color: 'var(--color-text-secondary)' }}>{t.title}</p>
                          <span className="text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>{proj?.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {overdueFinance.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Wallet size={11} style={{ color: 'var(--danger-500)' }} />
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>مستحقات متأخرة</span>
                  </div>
                  <div className="space-y-0.5">
                    {overdueFinance.map((e) => {
                      const proj = projects.find((p) => p.id === e.projectId)
                      return (
                        <Link key={e.id} href={`/projects/${e.projectId}`} className="flex items-center gap-2 py-1.5 hover:opacity-80 transition-opacity">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--danger-500)' }} />
                          <p className="text-xs truncate flex-1" style={{ color: 'var(--color-text-secondary)' }}>{e.title}</p>
                          <span className="axis-num text-xs shrink-0" style={{ color: 'var(--danger-500)' }}>{e.amount.toLocaleString('en-US')}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Progress summary */}
            <div className="axis-card p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                تقدم المشاريع
              </h3>
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: project.color }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          {project.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: project.color }}>
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${project.progress}%`, background: project.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
