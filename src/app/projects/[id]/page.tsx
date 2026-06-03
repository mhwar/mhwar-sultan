import AppLayout from '@/components/layout/AppLayout'
import ProjectDetailClient from '@/components/projects/ProjectDetailClient'
import { SEED_PROJECTS } from '@/lib/seed-data'

export function generateStaticParams() {
  return SEED_PROJECTS.map((p) => ({ id: p.id }))
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  return (
    <AppLayout>
      <ProjectDetailClient id={id} />
    </AppLayout>
  )
}
