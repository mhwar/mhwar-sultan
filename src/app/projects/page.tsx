'use client'
import { useState } from 'react'
import { Plus, Search, LayoutGrid, List } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectForm from '@/components/projects/ProjectForm'
import EmptyState from '@/components/shared/EmptyState'
import { useProjectStore, useTaskStore } from '@/store/store'
import type { ProjectStatus } from '@/types'

const STATUS_FILTERS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'الكل' },
  { value: 'active',    label: 'نشط' },
  { value: 'planning',  label: 'تخطيط' },
  { value: 'paused',    label: 'موقوف' },
  { value: 'completed', label: 'مكتمل' },
]

export default function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects)
  const tasks = useTaskStore((s) => s.tasks)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesSearch = !search || p.name.includes(search) || p.nameEn?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>
              المشاريع
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {projects.length} مشروع
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
          >
            <Plus size={16} />
            مشروع جديد
          </button>
        </div>

        {/* Filters bar */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="بحث في المشاريع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* Status filter pills */}
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: statusFilter === f.value ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: statusFilter === f.value ? '#818CF8' : 'var(--color-text-muted)',
                  border: statusFilter === f.value ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {([['grid', LayoutGrid], ['list', List]] as const).map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: view === v ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: view === v ? '#818CF8' : 'var(--color-text-muted)',
                }}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>

        {/* Projects grid/list */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="لا توجد مشاريع"
            description={search ? 'جرب بحثاً مختلفاً' : 'ابدأ بإنشاء مشروعك الأول'}
            action={
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
              >
                مشروع جديد
              </button>
            }
          />
        ) : (
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                : 'flex flex-col gap-3'
            }
          >
            {filtered.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={tasks.filter((t) => t.projectId === project.id).length}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </AppLayout>
  )
}
