'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Edit2, Trash2, Calendar, Clock, Plus } from 'lucide-react'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'
import ProjectForm from '@/components/projects/ProjectForm'
import ToolsLibrarySheet from '@/components/projects/ToolsLibrarySheet'
import { useProjectStore, useTaskStore, useNoteStore, useSprintStore } from '@/store/store'
import { useShallow } from 'zustand/shallow'
import { getTool } from '@/lib/tool-registry'
import { FALLBACK_TOOL_IDS } from '@/lib/project-types'
import ProjectIcon from '@/lib/icons'
import { hexToRgba, formatDateAr } from '@/lib/utils'

interface Props {
  id: string
}

export default function ProjectDetailClient({ id }: Props) {
  const router = useRouter()
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const { deleteProject } = useProjectStore()
  const tasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.projectId === id)))
  const notes = useNoteStore(useShallow((s) =>
    [...s.notes.filter((n) => n.projectId === id)].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  ))
  const sprints = useSprintStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === id)))
  const [activeTab, setActiveTab] = useState<string>('')
  const [showEdit, setShowEdit] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  // Tools enabled for this project (with legacy fallback), resolved via the registry.
  const toolIds = (project?.tools?.length ? project.tools : FALLBACK_TOOL_IDS).filter((t) => getTool(t))

  // Keep the active tab valid: default to the first tool, and recover if the
  // current tab gets removed from the library.
  useEffect(() => {
    if (toolIds.length === 0) return
    if (!activeTab || !toolIds.includes(activeTab)) setActiveTab(toolIds[0])
  }, [toolIds.join(','), activeTab])

  if (!hydrated) {
    return (
      <div className="p-4 md:p-6 lg:p-8 animate-pulse">
        <div className="axis-card overflow-hidden">
          <div className="h-[120px] md:h-[160px]" style={{ background: 'var(--color-surface-muted)' }} />
          <div className="p-6 space-y-4">
            <div className="w-20 h-20 rounded-xl -mt-14" style={{ background: 'var(--color-surface-muted)' }} />
            <div className="h-6 w-48 rounded-lg" style={{ background: 'var(--color-surface-muted)' }} />
            <div className="h-4 w-72 rounded-full" style={{ background: 'var(--color-surface-muted)' }} />
          </div>
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

  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const activeSprints = sprints.filter((sp) => sp.status === 'active').length

  const stats = [
    { label: 'التقدم',   value: `${project.progress}%` },
    { label: 'المهام',   value: `${doneTasks}/${tasks.length}` },
    { label: 'السبرنتات', value: `${activeSprints}/${sprints.length}` },
    { label: 'الملاحظات', value: `${notes.length}` },
  ]

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fade-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/projects" className="hover:text-white transition-colors">المشاريع</Link>
        <ArrowRight size={12} style={{ opacity: 0.4 }} data-flip-rtl />
        <span style={{ color: 'var(--color-text-secondary)' }}>{project.name}</span>
      </div>

      {/* Hero */}
      <div className="axis-projhead mb-6">
        {/* Cover band */}
        <div className="relative h-[120px] md:h-[160px] overflow-hidden">
          {project.cover ? (
            <img src={project.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${hexToRgba(project.color, 0.55)} 0%, ${hexToRgba(project.color, 0.12)} 100%)` }}
            />
          )}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 100% at 0% 0%, oklch(1 0 0 / 0.12), transparent 60%)' }}
          />
        </div>

        {/* Body */}
        <div className="relative px-4 md:px-6 pb-4 flex flex-col gap-4">
          {/* Top row — logo + corner actions */}
          <div className="flex items-end justify-between -mt-8 md:-mt-11">
            <div
              className="w-16 h-16 md:w-[88px] md:h-[88px] flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: hexToRgba(project.color, 0.2),
                color: project.color,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 0 0 4px var(--color-surface-raised), var(--shadow-md)',
              }}
            >
              {project.logo
                ? <img src={project.logo} alt="" className="w-full h-full object-cover" />
                : <ProjectIcon name={project.icon} size={40} />}
            </div>

            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-semibold transition-colors"
                style={{
                  background: 'var(--color-surface-overlay)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-surface-border)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <Edit2 size={13} />
                تعديل
              </button>
              <button
                onClick={handleDelete}
                className="w-9 h-9 rounded-md flex items-center justify-center transition-colors hover:bg-red-500/15"
                style={{
                  background: 'var(--color-surface-overlay)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-surface-border)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Title block */}
          <div className="flex flex-col gap-1.5">
            {project.category && (
              <span className="axis-label" style={{ color: 'var(--color-brand-light)', letterSpacing: '0.1em' }}>
                {project.category}
              </span>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {project.name}
              </h1>
              {project.nameEn && (
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)', direction: 'ltr' }}>
                  {project.nameEn}
                </span>
              )}
              <StatusBadge status={project.status} size="sm" />
            </div>
            {project.description && (
              <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
                {project.description}
              </p>
            )}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} />
                أُنشئ {formatDateAr(project.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} />
                آخر تحديث {formatDateAr(project.updatedAt)}
              </span>
            </div>
          </div>

          {/* Stats strip */}
          <div className="axis-stats">
            {stats.map((s) => (
              <div key={s.label} className="axis-stat">
                <span className="axis-label">{s.label}</span>
                <span className="axis-num text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 overflow-x-auto no-scrollbar mt-1"
            style={{ borderTop: '1px solid var(--color-surface-border)', marginInline: '-1rem', paddingInline: '1rem' }}
          >
            {toolIds.map((tabId) => {
              const tool = getTool(tabId)
              if (!tool) return null
              const Icon = tool.icon
              const isActive = activeTab === tabId
              return (
                <button
                  key={tabId}
                  onClick={() => setActiveTab(tabId)}
                  className={`axis-tab flex items-center gap-2 px-3 py-3 text-sm font-medium whitespace-nowrap${isActive ? ' is-active' : ''}`}
                  style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                >
                  <Icon size={14} />
                  {tool.label}
                  {tabId === 'execution' && tasks.length > 0 && (
                    <span
                      className="axis-num text-xs px-1.5 rounded-full font-semibold"
                      style={{
                        background: isActive ? 'var(--color-brand)' : 'var(--color-surface-overlay)',
                        color: isActive ? 'white' : 'var(--color-text-muted)',
                      }}
                    >
                      {tasks.length}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Add tool — opens the tools library */}
            <button
              onClick={() => setShowTools(true)}
              className="axis-tab flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap"
              style={{ color: 'var(--color-text-muted)' }}
              title="إضافة أداة"
            >
              <Plus size={14} />
              أداة
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div>
        {getTool(activeTab)?.render(project)}
      </div>

      {showEdit && <ProjectForm onClose={() => setShowEdit(false)} initialData={project} />}
      {showTools && <ToolsLibrarySheet project={project} onClose={() => setShowTools(false)} />}
    </div>
  )
}
