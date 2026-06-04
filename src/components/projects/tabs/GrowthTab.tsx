'use client'
import type { Project, PlanPhase } from '@/types'
import PlanWorkspace from '@/components/projects/PlanWorkspace'

interface GrowthTabProps {
  project: Project
  phases: PlanPhase[]
}

/** Growth workspace: marketing, sales, content, and launch plans. Milestones
 *  can be sent to a sprint from each phase or the phase drawer. */
export default function GrowthTab({ project, phases }: GrowthTabProps) {
  return (
    <PlanWorkspace
      project={project}
      phases={phases}
      domain="growth"
      emptyTitle="لا توجد خطة نمو بعد"
      emptyDescription="ابدأ بخطة تسويق أو مبيعات أو محتوى أو إطلاق"
    />
  )
}
