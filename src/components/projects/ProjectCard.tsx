'use client'
import { useRouter } from 'next/navigation'
import { Clock, CheckSquare } from 'lucide-react'
import type { Project } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'
import ProjectIcon from '@/lib/icons'
import Tag from '@/components/ui/Tag'
import { hexToRgba, timeAgoAr } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  taskCount?: number
}

export default function ProjectCard({ project, taskCount = 0 }: ProjectCardProps) {
  const router = useRouter()

  return (
    <div
      className="axis-card-hover p-4 flex flex-col gap-3"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      {/* Header — logo, name, status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 flex items-center justify-center shrink-0"
            style={{
              background: hexToRgba(project.color, 0.15),
              color: project.color,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <ProjectIcon name={project.icon} size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>
              {project.name}
            </h3>
            {project.nameEn && (
              <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)', direction: 'ltr' }}>
                {project.nameEn}
              </div>
            )}
          </div>
        </div>
        <StatusBadge status={project.status} size="sm" />
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
        {project.description}
      </p>

      {/* Progress — thin track + tabular number */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{ height: '5px', background: 'var(--color-surface-muted)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ width: `${project.progress}%`, background: project.color }}
          />
        </div>
        <span className="axis-num text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-secondary)', minWidth: '34px', textAlign: 'end' }}>
          {project.progress}%
        </span>
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} variant="neutral">{tag}</Tag>
          ))}
          {project.tags.length > 3 && (
            <span className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>
              +{project.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer — meta row */}
      <div
        className="flex items-center justify-between pt-3 mt-auto"
        style={{ borderTop: '1px solid var(--color-surface-border)' }}
      >
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <CheckSquare size={12} />
          <span className="axis-num">{taskCount}</span>
          <span>مهمة</span>
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <Clock size={11} />
          <span>{timeAgoAr(project.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
