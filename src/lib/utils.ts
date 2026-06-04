import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ProjectStatus, TaskPriority, PhaseStatus, TaskStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToRgba(hex: string | undefined | null, alpha: number): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
    return `rgba(99, 102, 241, ${alpha})`
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(99, 102, 241, ${alpha})`
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function formatDateAr(iso: string | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '—'
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d)
  } catch {
    return '—'
  }
}

export function timeAgoAr(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })
  if (seconds < 60) return rtf.format(-seconds, 'second')
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute')
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour')
  return rtf.format(-Math.floor(seconds / 86400), 'day')
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'نشط',
  paused: 'موقوف',
  completed: 'مكتمل',
  planning: 'تخطيط',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'للتنفيذ',
  'in-progress': 'جارية',
  'done': 'منجزة',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
}

/** Priority → Axis pill variant (semantic, token-based). */
export const PRIORITY_PILL: Record<TaskPriority, 'success' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
}

/** Priority → token CSS variable for dots/accents. */
export const PRIORITY_VAR: Record<TaskPriority, string> = {
  low: 'var(--success-500)',
  medium: 'var(--warning-500)',
  high: 'var(--danger-500)',
}

/** Task status → dot token. */
export const TASK_STATUS_VAR: Record<TaskStatus, string> = {
  'todo': 'var(--fg-4)',
  'in-progress': 'var(--warning-500)',
  'done': 'var(--success-500)',
}

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  upcoming: 'قادمة',
  'in-progress': 'جارية',
  completed: 'مكتملة',
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function now(): string {
  return new Date().toISOString()
}
