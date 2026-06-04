'use client'
import { Layers, Check } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import { usePlanStore } from '@/store/store'
import type { Project, PlanPhase } from '@/types'
import { domainForKind } from '@/lib/plan-kinds'
import PlanWorkspace from '@/components/projects/PlanWorkspace'
import SendToSprintMenu from '@/components/projects/SendToSprintMenu'

interface ProductTabProps {
  project: Project
  phases: PlanPhase[]
}

/** Product workspace: the product roadmap plus an aggregated features backlog
 *  pulled from every product-plan phase. Any feature can be sent to a sprint. */
export default function ProductTab({ project, phases }: ProductTabProps) {
  const { toggleFeature } = usePlanStore()
  const productPlanIds = usePlanStore(useShallow((s) =>
    s.plans
      .filter((p) => p.projectId === project.id && (p.domain ?? domainForKind(p.kind)) === 'product')
      .map((p) => p.id)
  ))

  // Flatten features across this project's product-plan phases
  const featureRows = phases
    .filter((ph) => ph.planId && productPlanIds.includes(ph.planId))
    .flatMap((ph) => (ph.features ?? []).map((f) => ({ phase: ph, feature: f })))

  return (
    <div className="space-y-6">
      <PlanWorkspace
        project={project}
        phases={phases}
        domain="product"
        emptyTitle="لا توجد خطة منتج بعد"
        emptyDescription="ابدأ بخارطة طريق أو خطة منتج لتنظيم المراحل والمميزات"
      />

      {featureRows.length > 0 && (
        <div className="axis-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={15} style={{ color: project.color }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>مميزات المنتج</h3>
            <span className="axis-num text-xs" style={{ color: 'var(--fg-3)' }}>{featureRows.length}</span>
          </div>
          <div className="space-y-1.5">
            {featureRows.map(({ phase, feature }) => (
              <div key={feature.id} className="flex items-center gap-2.5 group">
                <button
                  onClick={() => toggleFeature(phase.id, feature.id)}
                  className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all"
                  style={{ background: feature.done ? project.color : 'transparent', borderColor: feature.done ? project.color : 'var(--border-default)' }}
                >
                  {feature.done && <Check size={11} strokeWidth={3} style={{ color: 'white' }} />}
                </button>
                <span className="text-sm flex-1 truncate" style={{ color: feature.done ? 'var(--fg-3)' : 'var(--fg-2)', textDecoration: feature.done ? 'line-through' : 'none' }}>
                  {feature.title}
                </span>
                <span className="text-xs truncate shrink-0" style={{ color: 'var(--fg-4)', maxWidth: 140 }}>{phase.title}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <SendToSprintMenu projectId={project.id} title={feature.title} done={feature.done} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
