/**
 * Self-hosted authentication bridge.
 *
 * The app guards itself with its own email + password sessions (a signed cookie
 * verified by the Pages Function) instead of relying on Cloudflare Access. This
 * module reads the current session and clears it on logout.
 *
 * Three states are distinguished so local dev stays unrestricted:
 *   • `unreachable`   — the API 404s/errors (local dev, preview) → render freely
 *   • `anonymous`     — API is up but no valid session → send the user to /login
 *   • `authenticated` — a valid session; we know who is browsing
 */

import type { AppUser } from '@/types'
import { apiAuth } from '@/lib/api'

export type SessionState =
  | { status: 'unreachable' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; email: string; name?: string; user: AppUser }

export async function getSession(): Promise<SessionState> {
  const res = await apiAuth.session()
  if (!res) return { status: 'unreachable' }
  if (!res.authenticated || !res.user?.email) return { status: 'anonymous' }
  return {
    status: 'authenticated',
    email: res.user.email.toLowerCase(),
    name: res.user.name?.trim() || undefined,
    user: res.user,
  }
}

/** Clear the session cookie and return to the login page. */
export async function logout(): Promise<void> {
  await apiAuth.logout()
  if (typeof window !== 'undefined') window.location.href = '/login'
}
