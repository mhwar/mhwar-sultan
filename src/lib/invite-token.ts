import type { AppUser, ProjectPermission } from '@/types'

export interface InviteBundle {
  user: AppUser
  perms: ProjectPermission[]
}

export function encodeBundle(bundle: InviteBundle): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(bundle))))
}

export function decodeBundle(token: string): InviteBundle | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(token))))
    if (!parsed?.user?.id || !parsed?.user?.name) return null
    return parsed as InviteBundle
  } catch {
    return null
  }
}

export function buildInviteUrl(bundle: InviteBundle): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://boslaworks.com'
  return `${origin}/join?t=${encodeBundle(bundle)}`
}
