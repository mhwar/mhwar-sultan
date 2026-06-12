/**
 * Cloudflare Access identity bridge.
 *
 * When the site is served behind a Cloudflare Access application, Cloudflare
 * authenticates the visitor at the edge and exposes their verified identity at
 * `/cdn-cgi/access/get-identity`. We read it client-side to know *who* is
 * browsing, then map that email onto an in-app `AppUser` + its permissions.
 *
 * Outside Cloudflare (local dev, preview), the endpoint 404s and we return
 * `null` so the app falls back to its unrestricted local behaviour.
 */

export interface CfIdentity {
  email: string
  name?: string
}

/** The Cloudflare Access logout endpoint — clears the session and re-prompts. */
export const CF_LOGOUT_URL = '/cdn-cgi/access/logout'

/** Initiates a new Cloudflare Access session (triggers Google OAuth).
 *  After authentication CF redirects back to the app automatically. */
export const CF_LOGIN_URL =
  'https://tiny-shape-6245.cloudflareaccess.com/cdn-cgi/access/login/boslaworks.com'

export async function fetchCfIdentity(): Promise<CfIdentity | null> {
  try {
    const res = await fetch('/cdn-cgi/access/get-identity', {
      credentials: 'include',
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (!data || typeof data !== 'object') return null
    const email = (data as Record<string, unknown>).email
    if (typeof email !== 'string' || !email) return null
    const name = (data as Record<string, unknown>).name
    return {
      email: email.toLowerCase(),
      name: typeof name === 'string' && name.trim() ? name.trim() : undefined,
    }
  } catch {
    return null
  }
}
