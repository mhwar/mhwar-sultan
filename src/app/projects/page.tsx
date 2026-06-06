'use client'
import { useState } from 'react'
import { Plus, Search, LayoutGrid, List, Table2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/shared/PageHeader'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectsTable from '@/components/projects/ProjectsTable'
import ProjectForm from '@/components/projects/ProjectForm'
import EmptyState from '@/components/shared/EmptyState'
import Button from '@/components/ui/Button'
import Segmented from '@/components/ui/Segmented'
import { useProjectStore, useTaskStore } from '@/store/store'
import type { ProjectStatus } from '@/types'

const STATUS_FILTERS: { value: ProjectStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'الكل' },
  { value: 'active',    label: 'نشط' },
  { value: 'planning',  label: 'تخطيط' },
  { value: 'paused',    label: 'موقوف' },
  { value: 'completed', label: 'مكتمل' },
]

type View = 'grid' | 'list' | 'table'

export default function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects)
  const tasks = useTaskStore((s) => s.tasks)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('grid')

  const filtered = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesSearch = !search || p.name.includes(search) || p.nameEn?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const taskCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    if (t.projectId) acc[t.projectId] = (acc[t.projectId] ?? 0) + 1
    return acc
  }, {})

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 animate-fade-up">
        <PageHeader
          title="المشاريع"
          sub={`${projects.length} مشروع`}
          actions={
            <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
              <Plus size={16} />
              مشروع جديد
            </Button>
          }
        />

        {/* Filter bar */}
        <div
          className="flex items-center gap-3 mb-6 flex-wrap"
          style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '10px 12px',
          }}
        >
          <div
            className="flex items-center gap-2 px-3 flex-1 min-w-48"
            style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', height: '32px' }}
          >
            <Search size={15} style={{ color: 'var(--fg-3)' }} />
            <input
              type="text"
              placeholder="بحث في المشاريع"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
              style={{ color: 'var(--fg-1)' }}
            />
          </div>

          <Segmented
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTERS.map((f) => ({ value: f.value, label: f.label }))}
          />

          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'grid', icon: <LayoutGrid size={15} />, title: 'شبكة' },
              { value: 'list', icon: <List size={15} />, title: 'قائمة' },
              { value: 'table', icon: <Table2 size={15} />, title: 'جدول' },
            ]}
          />
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="لا توجد مشاريع"
            description={search ? 'جرب بحثاً مختلفاً' : 'ابدأ بإنشاء مشروعك الأول'}
            action={
              <Button variant="primary" size="md" onClick={() => setShowForm(true)}>مشروع جديد</Button>
            }
          />
        ) : view === 'table' ? (
          <ProjectsTable projects={filtered} taskCounts={taskCounts} />
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'flex flex-col gap-3'}>
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} taskCount={taskCounts[project.id] ?? 0} />
            ))}
          </div>
        )}
      </div>

      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </AppLayout>
  )
}
