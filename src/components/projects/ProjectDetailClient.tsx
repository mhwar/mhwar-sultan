'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Edit2, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import StatusBadge from '@/components/shared/StatusBadge'
import ProjectForm from '@/components/projects/ProjectForm'
import ToolsLibrarySheet from '@/components/projects/ToolsLibrarySheet'
import { useProjectStore, useTaskStore, useNavStore } from '@/store/store'
import { useShallow } from 'zustand/shallow'
import { getTool } from '@/lib/tool-registry'
import { FALLBACK_TOOL_IDS } from '@/lib/project-types'
import ProjectIcon from '@/lib/icons'
import { hexToRgba } from '@/lib/utils'
import { usePermissionStore } from '@/store/permissionStore'

interface Props {
  id: string
}

export default function ProjectDetailClient({ id }: Props) {
  const router = useRouter()
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id))
  const { deleteProject } = useProjectStore()
  const tasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.projectId === id)))
  const [activeTab, setActiveTab] = useState<string>('')
  const [showEdit, setShowEdit] = useState(false)
  const [showTools, setShowTools] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const { targetTab, clearTab } = useNavStore()
  const { getEffectiveTools, canAccessProject } = usePermissionStore()

  useEffect(() => {
    usePermissionStore.persist.rehydrate()
    setHydrated(true)
  }, [])

  // Tools enabled for this project (with legacy fallback), resolved via the registry,
  // then filtered by active user's permissions.
  const rawToolIds = (project?.tools?.length ? project.tools : FALLBACK_TOOL_IDS).filter((t) => getTool(t))
  const toolIds = hydrated ? getEffectiveTools(id, rawToolIds) : rawToolIds

  // Keep the active tab valid: default to the first tool, and recover if the
  // current tab gets removed from the library.
  useEffect(() => {
    if (toolIds.length === 0) return
    if (!activeTab || !toolIds.includes(activeTab)) setActiveTab(toolIds[0])
  }, [toolIds.join(','), activeTab])

  // Cross-tab navigation: respond to signals from child components (e.g. MeetingsTab → ExecutionTab).
  useEffect(() => {
    if (targetTab && toolIds.includes(targetTab)) {
      setActiveTab(targetTab)
      clearTab()
    }
  }, [targetTab])

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

  if (hydrated && !canAccessProject(id)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4 p-6">
        <p className="text-lg font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          ليس لديك صلاحية الوصول لهذا المشروع
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
    <div className="p-4 md:p-6 lg:p-8 animate-fade-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/projects" className="hover:text-white transition-colors">المشاريع</Link>
        <ArrowRight size={12} style={{ opacity: 0.4 }} data-flip-rtl />
        <span style={{ color: 'var(--color-text-secondary)' }}>{project.name}</span>
      </div>

      {/* Non-sticky cover band — scrolls away */}
      <div
        className="relative overflow-hidden"
        style={{
          height: '80px',
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          border: '1px solid var(--color-surface-border)',
          borderBottom: 'none',
        }}
      >
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

      {/* Sticky header — stays pinned when scrolling */}
      <div
        className="sticky top-0 z-30 mb-6"
        style={{
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-surface-border)',
          borderTop: 'none',
          borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="relative px-4 md:px-6 pb-0 flex flex-col gap-3">
          {/* Logo + title + actions */}
          <div className="flex items-center gap-3 pt-2">
            {/* Logo — pokes into the cover band above */}
            <div
              className="w-14 h-14 md:w-[72px] md:h-[72px] flex items-center justify-center shrink-0 overflow-hidden -mt-9 md:-mt-11"
              style={{
                background: hexToRgba(project.color, 0.18),
                color: project.color,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 0 0 3px var(--color-surface-raised), var(--shadow-md)',
              }}
            >
              {project.logo
                ? <img src={project.logo} alt="" className="w-full h-full object-cover" />
                : <ProjectIcon name={project.icon} size={32} />}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              {project.category && (
                <span className="axis-label text-[10px]" style={{ color: 'var(--color-brand-light)', letterSpacing: '0.1em' }}>
                  {project.category}
                </span>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base md:text-lg font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {project.name}
                </h1>
                {project.nameEn && (
                  <span className="text-xs font-medium hidden md:inline" style={{ color: 'var(--color-text-muted)', direction: 'ltr' }}>
                    {project.nameEn}
                  </span>
                )}
                <StatusBadge status={project.status} size="sm" />
              </div>
            </div>

            {/* Edit / delete */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
                style={{
                  background: 'var(--color-surface-overlay)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-surface-border)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <Edit2 size={12} />
                تعديل
              </button>
              <button
                onClick={handleDelete}
                className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-red-500/15"
                style={{
                  background: 'var(--color-surface-overlay)',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-surface-border)',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 overflow-x-auto no-scrollbar"
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
