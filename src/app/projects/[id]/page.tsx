'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Edit2, Trash2, LayoutDashboard, Map, CheckSquare, FileText } from 'lucide-react'
import Link from 'next/link'
import AppLayout from '@/components/layout/AppLayout'
import StatusBadge from '@/components/shared/StatusBadge'
import ProgressBar from '@/components/shared/ProgressBar'
import ProjectForm from '@/components/projects/ProjectForm'
import OverviewTab from '@/components/projects/tabs/OverviewTab'
import PlanTab from '@/components/projects/tabs/PlanTab'
import TasksTab from '@/components/projects/tabs/TasksTab'
import NotesTab from '@/components/projects/tabs/NotesTab'
import { useProjectStore, useTaskStore, usePlanStore, useNoteStore } from '@/store/store'
import { hexToRgba } from '@/lib/utils'

type Tab = 'overview' | 'plan' | 'tasks' | 'notes'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
  { id: 'plan',     label: 'الخطة',     icon: Map         },
  { id: 'tasks',    label: 'المهام',    icon: CheckSquare },
  { id: 'notes',    label: 'الملاحظات', icon: FileText    },
]

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const project = useProjectStore((s) => s.getProject(id))
  const { deleteProject } = useProjectStore()
  const tasks = useTaskStore((s) => s.getProjectTasks(id))
  const phases = usePlanStore((s) => s.getProjectPhases(id))
  const notes = useNoteStore((s) => s.getProjectNotes(id))
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showEdit, setShowEdit] = useState(false)

  if (!project) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full py-24">
          <p className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            المشروع غير موجود
          </p>
          <Link href="/projects" className="text-sm" style={{ color: 'var(--color-brand)' }}>
            العودة للمشاريع
          </Link>
        </div>
      </AppLayout>
    )
  }

  const handleDelete = () => {
    if (confirm(`هل تريد حذف مشروع "${project.name}"؟`)) {
      deleteProject(id)
      router.push('/projects')
    }
  }

  return (
    <AppLayout>
      <div
        className="animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)]"
        style={{ '--project-color': project.color } as React.CSSProperties}
      >
        {/* Hero section */}
        <div
          className="relative px-6 lg:px-8 pt-6 pb-0"
          style={{
            background: `linear-gradient(180deg, ${hexToRgba(project.color, 0.06)} 0%, transparent 100%)`,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>
            <Link href="/projects" className="hover:text-white transition-colors">
              المشاريع
            </Link>
            <ArrowRight size={12} style={{ opacity: 0.4 }} />
            <span style={{ color: 'var(--color-text-secondary)' }}>{project.name}</span>
          </div>

          {/* Project header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{
                  background: hexToRgba(project.color, 0.15),
                  border: `1px solid ${hexToRgba(project.color, 0.25)}`,
                }}
              >
                {project.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    {project.name}
                  </h1>
                  {project.nameEn && (
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)', direction: 'ltr' }}>
                      {project.nameEn}
                    </span>
                  )}
                  <StatusBadge status={project.status} />
                </div>
                <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'var(--color-text-secondary)' }}>
                  {project.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Edit2 size={13} />
                تعديل
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-red-500/15"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                التقدم الإجمالي
              </span>
              <span className="text-sm font-bold" style={{ color: project.color }}>
                {project.progress}%
              </span>
            </div>
            <ProgressBar value={project.progress} color={project.color} size="md" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative"
                style={{
                  color: activeTab === tabId ? project.color : 'var(--color-text-muted)',
                  borderBottom: activeTab === tabId ? `2px solid ${project.color}` : '2px solid transparent',
                }}
              >
                <Icon size={14} />
                {label}
                {tabId === 'tasks' && tasks.length > 0 && (
                  <span
                    className="text-xs w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: hexToRgba(project.color, 0.15),
                      color: project.color,
                      fontSize: '0.65rem',
                    }}
                  >
                    {tasks.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6 lg:p-8">
          {activeTab === 'overview' && (
            <OverviewTab project={project} tasks={tasks} phases={phases} />
          )}
          {activeTab === 'plan' && (
            <PlanTab project={project} phases={phases} />
          )}
          {activeTab === 'tasks' && (
            <TasksTab project={project} tasks={tasks} />
          )}
          {activeTab === 'notes' && (
            <NotesTab project={project} notes={notes} />
          )}
        </div>
      </div>

      {showEdit && (
        <ProjectForm
          onClose={() => setShowEdit(false)}
          initialData={project}
        />
      )}
    </AppLayout>
  )
}
