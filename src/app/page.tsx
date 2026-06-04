'use client'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ProjectCard from '@/components/projects/ProjectCard'
import { useProjectStore, useTaskStore } from '@/store/store'
import { formatDateAr } from '@/lib/utils'

export default function DashboardPage() {
  const projects = useProjectStore((s) => s.projects)
  const tasks = useTaskStore((s) => s.tasks)

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3)

  const doneTasks = [...tasks]
    .filter((t) => t.status === 'done')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

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
            {/* Completed tasks */}
            <div className="axis-card p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                المهام المنجزة
              </h3>
              {doneTasks.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-muted)' }}>
                  لا توجد مهام منجزة بعد
                </p>
              ) : (
                <div className="space-y-0.5">
                  {doneTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId)
                    return (
                      <div key={task.id} className="flex items-center gap-2.5 py-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: project?.color ?? 'var(--color-brand)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}>
                            {task.title}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            {project?.name}
                          </p>
                        </div>
                      </div>
                    )
                  })}
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
