export type ProjectStatus = 'active' | 'paused' | 'completed' | 'planning'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type PhaseStatus = 'upcoming' | 'in-progress' | 'completed'

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
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  startDate?: string
  dueDate?: string
  createdAt: string
}

export interface Plan {
  id: string
  projectId: string
  name: string
  order: number
  createdAt: string
}

export interface PlanPhase {
  id: string
  projectId: string
  planId?: string
  title: string
  description: string
  status: PhaseStatus
  order: number
  milestones: Milestone[]
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
