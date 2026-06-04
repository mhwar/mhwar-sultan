'use client'
import { useState } from 'react'
import { Plus, Check, Circle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { usePlanStore } from '@/store/store'
import type { Project, PlanPhase } from '@/types'
import EmptyState from '@/components/shared/EmptyState'
import { PHASE_STATUS_LABELS } from '@/lib/utils'

interface PlanTabProps {
  project: Project
  phases: PlanPhase[]
}

const PHASE_STATUS_COLORS: Record<string, { dot: string; badge: string; badgeText: string }> = {
  completed:     { dot: 'var(--color-status-active)', badge: 'color-mix(in srgb, var(--color-status-active) 12%, transparent)', badgeText: 'var(--color-status-active)' },
  'in-progress': { dot: 'var(--color-status-paused)', badge: 'color-mix(in srgb, var(--color-status-paused) 12%, transparent)', badgeText: 'var(--color-status-paused)' },
  upcoming:      { dot: 'var(--color-text-muted)',    badge: 'var(--color-surface-muted)',                                     badgeText: 'var(--color-text-muted)' },
}

function PhaseCard({ phase, project }: { phase: PlanPhase; project: Project }) {
  const [expanded, setExpanded] = useState(true)
  const [newMilestone, setNewMilestone] = useState('')
  const { toggleMilestone, addMilestone, deletePhase, updatePhase } = usePlanStore()
  const colors = PHASE_STATUS_COLORS[phase.status]
  const doneMilestones = phase.milestones.filter((m) => m.done).length

  const handleAddMilestone = () => {
    if (!newMilestone.trim()) return
    addMilestone(phase.id, newMilestone.trim())
    setNewMilestone('')
  }

  return (
    <div className="relative ps-8">
      {/* Timeline dot */}
      <div
        className="absolute start-0 top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center"
        style={{
          background: phase.status === 'completed' ? colors.dot : phase.status === 'in-progress' ? 'transparent' : 'rgba(255,255,255,0.05)',
          borderColor: colors.dot,
        }}
      >
        {phase.status === 'completed' && <Check size={8} strokeWidth={3} style={{ color: '#fff' }} />}
        {phase.status === 'in-progress' && (
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: colors.dot }}
          />
        )}
      </div>

      <div className="axis-card mb-4 overflow-hidden">
        {/* Phase header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
          style={{ borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
        >
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {phase.title}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {doneMilestones} / {phase.milestones.length} إنجاز
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: colors.badge, color: colors.badgeText }}
            >
              {PHASE_STATUS_LABELS[phase.status]}
            </span>
            {expanded ? <ChevronUp size={14} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />}
          </div>
        </div>

        {/* Phase body */}
        {expanded && (
          <div className="p-4 space-y-2">
            {phase.description && (
              <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                {phase.description}
              </p>
            )}

            {/* Milestones */}
            {phase.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center gap-3 group"
              >
                <button
                  onClick={() => toggleMilestone(phase.id, milestone.id)}
                  className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: milestone.done ? project.color : 'transparent',
                    borderColor: milestone.done ? project.color : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {milestone.done && <Check size={11} strokeWidth={3} style={{ color: '#fff' }} />}
                </button>
                <span
                  className="text-sm flex-1"
                  style={{
                    color: milestone.done ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                    textDecoration: milestone.done ? 'line-through' : 'none',
                  }}
                >
                  {milestone.title}
                </span>
              </div>
            ))}

            {/* Add milestone */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                placeholder="إضافة إنجاز جديد..."
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddMilestone() }}
                className="flex-1 text-xs px-3 py-2 rounded-lg outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button
                onClick={handleAddMilestone}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ background: project.color }}
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Phase actions */}
            <div className="flex gap-2 pt-2">
              {(['upcoming', 'in-progress', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updatePhase(phase.id, { status: s })}
                  className="text-xs px-2 py-1 rounded-lg transition-all"
                  style={{
                    background: phase.status === s ? PHASE_STATUS_COLORS[s].badge : 'rgba(255,255,255,0.03)',
                    color: phase.status === s ? PHASE_STATUS_COLORS[s].badgeText : 'var(--color-text-muted)',
                    border: `1px solid ${phase.status === s ? PHASE_STATUS_COLORS[s].dot + '40' : 'transparent'}`,
                  }}
                >
                  {PHASE_STATUS_LABELS[s]}
                </button>
              ))}
              <button
                onClick={() => deletePhase(phase.id)}
                className="ms-auto p-1 rounded-lg transition-colors hover:bg-red-500/10"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PlanTab({ project, phases }: PlanTabProps) {
  const { addPhase } = usePlanStore()
  const [showAddPhase, setShowAddPhase] = useState(false)
  const [newPhaseTitle, setNewPhaseTitle] = useState('')
  const [newPhaseDesc, setNewPhaseDesc] = useState('')

  const handleAddPhase = () => {
    if (!newPhaseTitle.trim()) return
    addPhase({
      projectId: project.id,
      title: newPhaseTitle.trim(),
      description: newPhaseDesc.trim(),
      status: 'upcoming',
      order: phases.length + 1,
      milestones: [],
    })
    setNewPhaseTitle('')
    setNewPhaseDesc('')
    setShowAddPhase(false)
  }

  return (
    <div>
      {phases.length === 0 ? (
        <EmptyState
          icon={Circle}
          title="لا توجد مراحل بعد"
          description="أضف مراحل لخطة مشروعك"
          action={
            <button
              onClick={() => setShowAddPhase(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: project.color }}
            >
              إضافة مرحلة
            </button>
          }
        />
      ) : (
        <div
          className="relative"
          style={{ paddingInlineStart: '1px' }}
        >
          {/* Vertical timeline line */}
          <div
            className="absolute start-1.5 top-6 bottom-6"
            style={{ width: '2px', background: 'rgba(255,255,255,0.07)' }}
          />
          {phases.map((phase) => (
            <PhaseCard key={phase.id} phase={phase} project={project} />
          ))}
        </div>
      )}

      {/* Add phase */}
      {showAddPhase ? (
        <div className="axis-card p-4 mt-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            مرحلة جديدة
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="عنوان المرحلة"
              value={newPhaseTitle}
              onChange={(e) => setNewPhaseTitle(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text-primary)',
              }}
            />
            <textarea
              rows={2}
              placeholder="وصف المرحلة (اختياري)"
              value={newPhaseDesc}
              onChange={(e) => setNewPhaseDesc(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text-primary)',
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddPhase}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: project.color }}
              >
                إضافة
              </button>
              <button
                onClick={() => setShowAddPhase(false)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.04)' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddPhase(true)}
          className="flex items-center gap-2 mt-4 text-sm px-4 py-2.5 rounded-xl transition-colors"
          style={{
            color: project.color,
            background: `${project.color}15`,
            border: `1px dashed ${project.color}40`,
          }}
        >
          <Plus size={15} />
          إضافة مرحلة جديدة
        </button>
      )}
    </div>
  )
}
