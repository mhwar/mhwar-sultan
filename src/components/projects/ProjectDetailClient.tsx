'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Edit2, Trash2, LayoutDashboard, Map, CheckSquare, FileText, MoreVertical } from 'lucide-react'
import Link from 'next/link'
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
  { id: 'plan',     label: 'الخطة',     icon: Map             },
  { id: 'tasks',    label: 'المهام',    icon: CheckSquare     },
  { id: 'notes',    label: 'الملاحظات', icon: FileText        },
]

interface Props {
  id: string
}

export default function ProjectDetailClient({ id }: Props) {
  const router = useRouter()
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const { deleteProject } = useProjectStore()
  const tasks = useTaskStore((s) => s.tasks.filter((t) => t.projectId === id))
  const phases = usePlanStore((s) =>
    [...s.phases.filter((ph) => ph.projectId === id)].sort((a, b) => a.order - b.order)
  )
  const notes = useNoteStore((s) =>
    [...s.notes.filter((n) => n.projectId === id)].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  )
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [showEdit, setShowEdit] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  if (!hydrated) {
    return (
      <div className="animate-pulse">
        <div className="px-4 md:px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-3 w-24 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-36 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <div className="h-3 w-52 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4 p-6">
        <p className="text-lg font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          المشروع غير موجود
        </p>
        <Link href="/projects" className="text-sm" style={{ color: 'var(--color-brand)' }}>
          العودة للمشاريع
        </Link>
      </div>
    )
  }

  const handleDelete = () => {
    if (confirm(`هل تريد حذف مشروع "${project.name}"؟`)) {
      deleteProject(id)
      router.push('/projects')
    }
  }

  return (
    <div
      className="animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)]"
      style={{ '--project-color': project.color } as React.CSSProperties}
    >
      {/* Hero */}
      <div
        className="relative px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-0"
        style={{
          background: `linear-gradient(180deg, ${hexToRgba(project.color, 0.06)} 0%, transparent 100%)`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-3 md:mb-5" style={{ color: 'var(--color-text-muted)' }}>
          <Link href="/projects" className="hover:text-white transition-colors">
            المشاريع
          </Link>
          <ArrowRight size={12} style={{ opacity: 0.4 }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{project.name}</span>
        </div>

        {/* Project header */}
        <div className="flex items-start justify-between gap-3 mb-3 md:mb-5">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {/* Icon */}
            <div
              className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl shrink-0"
              style={{
                background: hexToRgba(project.color, 0.15),
                border: `1px solid ${hexToRgba(project.color, 0.25)}`,
              }}
            >
              {project.icon}
            </div>

            {/* Name + status */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h1 className="text-lg md:text-2xl font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {project.name}
                </h1>
                {project.nameEn && (
                  <span className="hidden md:inline text-sm font-medium" style={{ color: 'var(--color-text-muted)', direction: 'ltr' }}>
                    {project.nameEn}
                  </span>
                )}
                <StatusBadge status={project.status} />
              </div>
              <p className="text-xs md:text-sm leading-relaxed line-clamp-1 md:line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                {project.description}
              </p>
            </div>
          </div>

          {/* Actions — desktop */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-white/10"
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
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-red-500/15"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-muted)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Trash2 size={13} />
            </button>
          </div>

          {/* Actions — mobile (kebab menu) */}
          <div className="md:hidden relative shrink-0">
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <MoreVertical size={16} />
            </button>
            {showActions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />
                <div
                  className="absolute end-0 top-10 z-50 rounded-xl overflow-hidden shadow-2xl"
                  style={{ background: '#141422', border: '1px solid rgba(255,255,255,0.1)', minWidth: '140px' }}
                >
                  <button
                    onClick={() => { setShowEdit(true); setShowActions(false) }}
                    className="w-full flex items-center gap-2.5 text-start text-sm px-4 py-3 transition-colors hover:bg-white/5"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Edit2 size={14} />
                    تعديل المشروع
                  </button>
                  <button
                    onClick={() => { handleDelete(); setShowActions(false) }}
                    className="w-full flex items-center gap-2.5 text-start text-sm px-4 py-3 transition-colors hover:bg-red-500/10"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={14} />
                    حذف المشروع
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3 md:mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              التقدم الإجمالي
            </span>
            <span className="text-xs md:text-sm font-bold" style={{ color: project.color }}>
              {project.progress}%
            </span>
          </div>
          <ProgressBar value={project.progress} color={project.color} size="md" />
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex gap-1 -mb-px overflow-x-auto no-scrollbar">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap"
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
                  style={{ background: hexToRgba(project.color, 0.15), color: project.color, fontSize: '0.65rem' }}
                >
                  {tasks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Mobile: compact tab row (icon + label, scrollable) */}
        <div className="md:hidden flex gap-1 -mb-px overflow-x-auto no-scrollbar">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all whitespace-nowrap shrink-0"
              style={{
                color: activeTab === tabId ? project.color : 'var(--color-text-muted)',
                borderBottom: activeTab === tabId ? `2px solid ${project.color}` : '2px solid transparent',
              }}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 md:p-6 lg:p-8">
        {activeTab === 'overview' && <OverviewTab project={project} tasks={tasks} phases={phases} />}
        {activeTab === 'plan'     && <PlanTab     project={project} phases={phases} />}
        {activeTab === 'tasks'    && <TasksTab    project={project} tasks={tasks} />}
        {activeTab === 'notes'    && <NotesTab    project={project} notes={notes} />}
      </div>

      {showEdit && <ProjectForm onClose={() => setShowEdit(false)} initialData={project} />}
    </div>
  )
}
