'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import ProjectDetailClient from '@/components/projects/ProjectDetailClient'

// Query-param project viewer (/project?id=...). Unlike the pre-rendered
// /projects/[id] route, this single static page resolves ANY project id —
// including ones created at runtime that have no pre-generated HTML under
// `output: 'export'`.
function ProjectViewerInner() {
  const id = useSearchParams().get('id') ?? ''
  return <ProjectDetailClient id={id} />
}

export default function ProjectViewerPage() {
  return (
    <AppLayout>
      <Suspense fallback={null}>
        <ProjectViewerInner />
      </Suspense>
    </AppLayout>
  )
}
