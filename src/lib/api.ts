/**
 * Bosla Works — typed API client for the Cloudflare Pages Function backend.
 *
 * All calls go to /api/* (same origin). In local dev the endpoint 404s and
 * every function returns null, letting the app fall back to localStorage.
 */

import type {
  Project, Task, Plan, PlanPhase, Sprint, Note, ProductDoc,
  TeamMember, ScheduleEvent, Meeting, FinanceEntry, FinancePackage,
  Kpi, Client, GrowthMetric, GrowthExperiment, GrowthChannel,
  ContentItem, Portfolio, ProductProfile, AppUser, ProjectPermission, Contract,
} from '@/types'

// ── Base fetch ────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    // keepalive lets mutating requests finish even if the page starts unloading
    // (e.g. a refresh moments after an edit), so writes are never aborted mid-flight.
    const method = (options?.method ?? 'GET').toUpperCase()
    const keepalive = method === 'POST' || method === 'PUT' || method === 'DELETE'
    const res = await fetch(`/api/${path}`, {
      credentials: 'include',
      keepalive,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options?.headers },
      ...options,
    })
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) return null
      console.warn(`[API] ${options?.method ?? 'GET'} /api/${path} → ${res.status}`)
      return null
    }
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

/** Like apiFetch but surfaces error messages from the response body. */
async function apiFetchDetailed<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(`/api/${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...options?.headers },
      ...options,
    })
    if (!res.ok) {
      // Try to parse JSON error body; fall back to status text
      try {
        const body = await res.json() as { error?: string }
        return { data: null, error: body.error ?? `HTTP ${res.status}` }
      } catch {
        return { data: null, error: `HTTP ${res.status} — الجلسة منتهية أو غير مُصرَّح` }
      }
    }
    const body = await res.json() as T
    return { data: body, error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

// ── Health check ──────────────────────────────────────────

/** Returns true when the Pages Function API is reachable (i.e. in production). */
export async function apiAvailable(): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>('health')
  return result?.ok === true
}

// ── Auth / me ─────────────────────────────────────────────

export async function apiGetMe(): Promise<AppUser | null> {
  return apiFetch<AppUser>('me')
}

// ── Bulk sync ─────────────────────────────────────────────

export interface SyncSnapshot {
  /** True when D1 already holds project data (distinguishes first-time migration). */
  seeded:      boolean
  projects:    Project[]
  tasks:       Task[]
  plans:       Plan[]
  phases:      PlanPhase[]
  sprints:     Sprint[]
  notes:       Note[]
  docs:        ProductDoc[]
  team:        TeamMember[]
  schedule:    ScheduleEvent[]
  meetings:    Meeting[]
  finance:     FinanceEntry[]
  packages:    FinancePackage[]
  kpis:        Kpi[]
  clients:     Client[]
  metrics:     GrowthMetric[]
  experiments: GrowthExperiment[]
  channels:    GrowthChannel[]
  content:     ContentItem[]
  portfolios:  Portfolio[]
  profiles:    ProductProfile[]
  contracts:   Contract[]
  users:       AppUser[]
  permissions: ProjectPermission[]
}

/** Pull all data the current user is allowed to see. */
export async function apiSyncPull(): Promise<SyncSnapshot | null> {
  return apiFetch<SyncSnapshot>('sync')
}

/** Push a full localStorage snapshot (first-time migration). */
export async function apiSyncPush(snapshot: Partial<SyncSnapshot>): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>('sync', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  })
  return result?.ok === true
}

/**
 * Admin recovery: wipe all shared content in D1 and re-seed it from this
 * browser's snapshot, making it the single source of truth. Users & permissions
 * are preserved. Returns true on success.
 */
export async function apiSyncReset(snapshot: Partial<SyncSnapshot>): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>('sync/reset', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  })
  return result?.ok === true
}

// ── Invitations ───────────────────────────────────────────

export interface InvitePayload {
  email: string
  name?: string
  projectName?: string
  toolLabels?: string[]
  inviterName?: string
}

export interface InviteResult {
  sent: boolean
  fallback?: boolean
  error?: string
  /** Set-password link to share manually when no email provider is configured. */
  link?: string
}

/**
 * Ask the backend to email an access invitation. Returns { sent:true } when
 * delivered via Resend, or { fallback:true } when no provider is configured
 * (caller should open a mailto draft). Returns null when the API is unreachable
 * (local dev) — caller should also fall back to mailto.
 */
export async function apiInvite(payload: InvitePayload): Promise<InviteResult | null> {
  return apiFetch<InviteResult>('invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface InviteOutcome {
  status: 'sent' | 'copied' | 'mailto' | 'failed'
  /** The set-password link, present when status is 'copied'. */
  link?: string
}

/**
 * Send an invitation. When the backend delivers it by email → 'sent'. When no
 * email provider is configured the backend returns a set-password link, which
 * we copy to the clipboard (best-effort) and surface as 'copied' so the admin
 * can paste it into WhatsApp/email. Falls back to a mailto draft only when no
 * link is available (e.g. API unreachable in local dev).
 */
export async function sendInvite(payload: InvitePayload): Promise<InviteOutcome> {
  const result = await apiInvite(payload)
  if (result?.sent) return { status: 'sent' }
  if (result?.link) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try { await navigator.clipboard.writeText(result.link) } catch { /* show link inline instead */ }
    }
    return { status: 'copied', link: result.link }
  }
  if (typeof window !== 'undefined') {
    window.location.href = buildInviteMailto(payload)
    return { status: 'mailto' }
  }
  return { status: 'failed' }
}

/** Build a mailto: URL with a pre-filled Arabic invitation draft. */
export function buildInviteMailto(payload: InvitePayload): string {
  const tools = (payload.toolLabels ?? []).filter(Boolean)
  const subject = payload.projectName
    ? `دعوة للوصول إلى مشروع ${payload.projectName} — بوصلة الأعمال`
    : 'دعوة للوصول إلى بوصلة الأعمال'
  const lines = [
    `مرحباً ${payload.name ?? ''}`.trim(),
    '',
    payload.projectName
      ? `تم منحك صلاحية الوصول إلى مشروع "${payload.projectName}" على منصة بوصلة الأعمال.`
      : 'تم منحك صلاحية الوصول إلى منصة بوصلة الأعمال.',
    tools.length ? `الأقسام المتاحة لك: ${tools.join(' · ')}` : '',
    '',
    'افتح المنصة وسجّل دخولك عبر: https://boslaworks.com',
    payload.inviterName ? `\nالدعوة من ${payload.inviterName}` : '',
  ].filter((l) => l !== '')
  return `mailto:${encodeURIComponent(payload.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`
}

// ── Users ─────────────────────────────────────────────────

export const apiUsers = {
  list: () => apiFetch<AppUser[]>('users'),

  create: (data: AppUser) =>
    apiFetch<{ ok: boolean }>('users', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<AppUser>) =>
    apiFetch<{ ok: boolean }>(`users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`users/${id}`, { method: 'DELETE' }),
}

// ── Permissions ───────────────────────────────────────────

export const apiPermissions = {
  list: () => apiFetch<ProjectPermission[]>('permissions'),

  set: (data: ProjectPermission) =>
    apiFetch<{ ok: boolean }>('permissions', { method: 'POST', body: JSON.stringify(data) }),

  remove: (userId: string, projectId: string) =>
    apiFetch<{ ok: boolean }>('permissions', {
      method: 'DELETE',
      body: JSON.stringify({ userId, projectId }),
    }),
}

// ── Authentication (self-hosted, email + password) ────────

export interface SessionResult { authenticated: boolean; user?: AppUser }

export const apiAuth = {
  /** Current session — { authenticated, user? }. Returns null if API unreachable. */
  session: () => apiFetch<SessionResult>('auth/session'),

  /** Sign in with email + password. Sets the session cookie on success. */
  login: (email: string, password: string) =>
    apiFetchDetailed<{ ok: boolean; user: AppUser }>(
      'auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  /** Redeem an invite/reset token and set a password. Signs in on success. */
  setPassword: (token: string, password: string) =>
    apiFetchDetailed<{ ok: boolean; user: AppUser }>(
      'auth/set-password', { method: 'POST', body: JSON.stringify({ token, password }) }
    ),

  /**
   * Request a password reset. Always resolves ok (no account enumeration).
   * During first-admin bootstrap with no email provider, the response includes
   * a `link` to open directly.
   */
  requestReset: (email: string) =>
    apiFetch<{ ok: boolean; link?: string }>('auth/request-reset', { method: 'POST', body: JSON.stringify({ email }) }),

  /** Clear the session cookie. */
  logout: () => apiFetch<{ ok: boolean }>('auth/logout', { method: 'POST', body: '{}' }),
}

// ── Projects ──────────────────────────────────────────────

export const apiProjects = {
  list: () => apiFetch<Project[]>('projects'),

  create: (data: Project) =>
    apiFetch<{ ok: boolean }>('projects', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Project>) =>
    apiFetch<{ ok: boolean }>(`projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`projects/${id}`, { method: 'DELETE' }),
}

// ── Portfolios ────────────────────────────────────────────

export const apiPortfolios = {
  list: () => apiFetch<Portfolio[]>('portfolios'),

  create: (data: Portfolio) =>
    apiFetch<{ ok: boolean }>('portfolios', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Portfolio>) =>
    apiFetch<{ ok: boolean }>(`portfolios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch<{ ok: boolean }>(`portfolios/${id}`, { method: 'DELETE' }),
}

// ── Project-scoped factory ────────────────────────────────

type Resource =
  | 'tasks' | 'plans' | 'phases' | 'sprints' | 'notes' | 'docs'
  | 'team' | 'schedule' | 'meetings' | 'finance' | 'packages' | 'kpis'
  | 'clients' | 'metrics' | 'experiments' | 'channels' | 'content'

function scopedApi<T>(resource: Resource) {
  return {
    list: (projectId: string) =>
      apiFetch<T[]>(`${resource}?projectId=${encodeURIComponent(projectId)}`),

    get: (id: string) => apiFetch<T>(`${resource}/${id}`),

    create: (data: T) =>
      apiFetch<{ ok: boolean; id?: string }>(resource, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<T>) =>
      apiFetch<{ ok: boolean }>(`${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiFetch<{ ok: boolean }>(`${resource}/${id}`, { method: 'DELETE' }),
  }
}

export const apiTasks       = scopedApi<Task>('tasks')
export const apiPlans       = scopedApi<Plan>('plans')
export const apiPhases      = scopedApi<PlanPhase>('phases')
export const apiSprints     = scopedApi<Sprint>('sprints')
export const apiNotes       = scopedApi<Note>('notes')
export const apiDocs        = scopedApi<ProductDoc>('docs')
export const apiTeam        = scopedApi<TeamMember>('team')
export const apiSchedule    = scopedApi<ScheduleEvent>('schedule')
export const apiMeetings    = scopedApi<Meeting>('meetings')
export const apiFinance     = scopedApi<FinanceEntry>('finance')
export const apiPackages    = scopedApi<FinancePackage>('packages')
export const apiKpis        = scopedApi<Kpi>('kpis')
export const apiClients     = scopedApi<Client>('clients')
export const apiMetrics     = scopedApi<GrowthMetric>('metrics')
export const apiExperiments = scopedApi<GrowthExperiment>('experiments')
export const apiChannels    = scopedApi<GrowthChannel>('channels')
export const apiContent     = scopedApi<ContentItem>('content')
