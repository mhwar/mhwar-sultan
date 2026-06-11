'use client'
import { ExternalLink, Tag, Calendar, Layers } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project } from '@/types'
import { useTaskStore, usePlanStore, useSprintStore, useNoteStore, useDocumentStore, useTeamStore, useKpiStore } from '@/store/store'
import StatusBadge from '@/components/shared/StatusBadge'
import ProgressBar from '@/components/shared/ProgressBar'
import { formatDateAr, hexToRgba } from '@/lib/utils'

interface OverviewTabProps {
  project: Project
}

export default function OverviewTab({ project }: OverviewTabProps) {
  const tasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.projectId === project.id)))
  const phases = usePlanStore(useShallow((s) => s.phases.filter((ph) => ph.projectId === project.id).sort((a, b) => a.order - b.order)))
  const sprints = useSprintStore(useShallow((s) => s.sprints.filter((sp) => sp.projectId === project.id)))
  const notes = useNoteStore(useShallow((s) => s.notes.filter((n) => n.projectId === project.id)))
  const docs = useDocumentStore(useShallow((s) => s.docs.filter((d) => d.projectId === project.id).sort((a, b) => a.order - b.order)))
  const team = useTeamStore(useShallow((s) => s.members.filter((m) => m.projectId === project.id).sort((a, b) => a.order - b.order)))
  const kpis = useKpiStore(useShallow((s) => s.kpis.filter((k) => k.projectId === project.id).sort((a, b) => a.order - b.order)))
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const donePhases = phases.filter((ph) => ph.status === 'completed').length
  const activeSprints = sprints.filter((sp) => sp.status === 'active').length

  const stats = [
    { label: 'التقدم',    value: `${project.progress}%` },
    { label: 'المهام',    value: `${doneTasks}/${tasks.length}` },
    { label: 'السبرنتات', value: `${activeSprints}/${sprints.length}` },
    { label: 'الملاحظات', value: `${notes.length}` },
  ]

  return (
    <div className="space-y-5">
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

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main info — 2/3 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="axis-card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              الوصف
            </h3>
            <p className="text-sm leading-7" style={{ color: 'var(--color-text-secondary)' }}>
              {project.description || 'لا يوجد وصف'}
            </p>
          </div>

          {/* Tags */}
          {(project.tags?.length ?? 0) > 0 && (
            <div className="axis-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={14} style={{ color: 'var(--color-text-muted)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  التقنيات والوسوم
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(project.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{
                      background: hexToRgba(project.color, 0.1),
                      color: project.color,
                      border: `1px solid ${hexToRgba(project.color, 0.25)}`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {project.links && project.links.length > 0 && (
            <div className="axis-card p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                الروابط
              </h3>
              <div className="space-y-2">
                {project.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm py-2 rounded-lg px-3 transition-colors hover:bg-white/5"
                    style={{ color: project.color }}
                  >
                    <ExternalLink size={13} />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side stats — 1/3 */}
        <div className="space-y-4">
          {/* Progress card */}
          <div className="axis-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              التقدم الإجمالي
            </h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-subtle)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={project.color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - project.progress / 100)}`}
                    className="transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: project.color }}>
                    {project.progress}%
                  </span>
                </div>
              </div>
            </div>
            <ProgressBar value={project.progress} color={project.color} size="sm" />
          </div>

          {/* Quick stats */}
          <div className="axis-card p-5 space-y-3">
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              ملخص سريع
            </h3>
            {[
              { label: 'الحالة',       value: <StatusBadge status={project.status} size="sm" /> },
              { label: 'الفئة',        value: project.category || '—', icon: <Layers size={12} /> },
              { label: 'المهام',        value: `${doneTasks} / ${tasks.length} منجزة` },
              { label: 'المراحل',       value: `${donePhases} / ${phases.length} مكتملة` },
              { label: 'تاريخ الإنشاء', value: formatDateAr(project.createdAt), icon: <Calendar size={12} /> },
              { label: 'آخر تحديث',    value: formatDateAr(project.updatedAt), icon: <Calendar size={12} /> },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                {typeof row.value === 'string' ? (
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{row.value}</span>
                ) : (
                  row.value
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
