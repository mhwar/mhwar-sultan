import { usePlanStore } from '@/store/store'
import { PLAN_TEMPLATES, type PlanTemplate } from '@/lib/plan-templates'
import { getProjectType } from '@/lib/project-types'
import { domainForKind } from '@/lib/plan-kinds'
import { generateId } from '@/lib/utils'

/**
 * Apply a plan template to a project: create the plan, then its phases with
 * milestones. Mirrors PlanWorkspace.createFromTemplate but callable imperatively
 * (no component state) for use during project creation.
 */
export function applyPlanTemplate(projectId: string, tpl: PlanTemplate) {
  const { addPlan, addPhase } = usePlanStore.getState()
  const planId = addPlan(projectId, tpl.name, tpl.icon, tpl.defaultView, tpl.kind, tpl.domain ?? domainForKind(tpl.kind))
  tpl.phases.forEach((ph, i) =>
    addPhase({
      projectId,
      planId,
      title: ph.title,
      description: ph.description ?? '',
      objective: ph.objective,
      status: ph.status ?? 'upcoming',
      order: i + 1,
      milestones: ph.milestones.map((m) => ({ id: generateId(), title: m, done: false })),
    })
  )
}

/**
 * Seed sensible starter data for a freshly created project based on its type.
 * Guarded and light — only runs the template defined on the project type.
 */
export function runSmartSetup(projectId: string, typeId: string) {
  const type = getProjectType(typeId)
  if (type.starterTemplateId) {
    const tpl = PLAN_TEMPLATES.find((t) => t.id === type.starterTemplateId)
    if (tpl) applyPlanTemplate(projectId, tpl)
  }
}
