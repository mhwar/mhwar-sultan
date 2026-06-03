'use client'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import type { Project } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'
import ProgressBar from '@/components/shared/ProgressBar'
import { hexToRgba, timeAgoAr } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  taskCount?: number
}

export default function ProjectCard({ project, taskCount = 0 }: ProjectCardProps) {
  const router = useRouter()

  return (
    <div
      className="glass-card-hover relative overflow-hidden"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      {/* Accent top border */}
      <div
        className="absolute top-0 inset-x-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ background: hexToRgba(project.color, 0.15) }}
            >
              {project.icon}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {project.name}
              </h3>
              {project.nameEn && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {project.nameEn}
                </div>
              )}
            </div>
          </div>
          <StatusBadge status={project.status} size="sm" />
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
          {project.description}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>التقدم</span>
            <span className="text-xs font-bold" style={{ color: project.color }}>{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} color={project.color} size="sm" />
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: hexToRgba(project.color, 0.08),
                  color: project.color,
                  border: `1px solid ${hexToRgba(project.color, 0.2)}`,
                }}
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.04)' }}>
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {taskCount} مهمة
          </span>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Clock size={11} />
            <span>{timeAgoAr(project.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
