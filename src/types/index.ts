export type ProjectStatus = 'active' | 'paused' | 'completed' | 'planning'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type PhaseStatus = 'upcoming' | 'in-progress' | 'completed'
export type SprintStatus = 'planned' | 'active' | 'completed'

export interface Milestone {
  id: string
  title: string
  done: boolean
}

export interface Project {
  id: string
  name: string
  nameEn?: string
  description: string
  status: ProjectStatus
  progress: number
  color: string
  icon: string
  logo?: string
  cover?: string
  category: string
  createdAt: string
  updatedAt: string
  tags: string[]
  links?: { label: string; url: string }[]
}

export interface Task {
  id: string
  projectId: string
  phaseId?: string
  milestoneId?: string
  sprintId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  startDate?: string
  dueDate?: string
  createdAt: string
}

export interface Sprint {
  id: string
  projectId: string
  name: string
  goal?: string
  startDate?: string
  dueDate?: string
  status: SprintStatus
  order: number
  createdAt: string
}

export type PlanKind = 'roadmap' | 'agile' | 'launch' | 'course' | 'content' | 'product' | 'custom'

export type PlanDomain = 'product' | 'growth'

export interface Plan {
  id: string
  projectId: string
  name: string
  icon?: string
  kind?: PlanKind
  domain?: PlanDomain
  view?: 'timeline' | 'board'
  targetDate?: string
  order: number
  createdAt: string
}

export interface Feature {
  id: string
  title: string
  done: boolean
}

export interface PlanPhase {
  id: string
  projectId: string
  planId?: string
  title: string
  description: string
  objective?: string
  startDate?: string
  dueDate?: string
  status: PhaseStatus
  order: number
  milestones: Milestone[]
  notes?: string
  features?: Feature[]
}

export interface Note {
  id: string
  projectId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  pinned?: boolean
}
