/**
 * Bosla Works — Cloudflare Pages Function API
 *
 * Handles all /api/* requests. Runs as a Cloudflare Worker alongside
 * the static Next.js export. All reads/writes go through this API and
 * are persisted in Cloudflare D1 (SQLite), enabling real shared data
 * across all authenticated users on the same device or browser.
 *
 * Authentication: Cloudflare Access sets the CF-Access-Authenticated-User-Email
 * header on every request after the visitor passes the Access policy. This
 * header is stripped from client requests and injected server-side — it is
 * safe to trust inside a Pages Function.
 *
 * Permissions:
 *   • admin  → full access to everything
 *   • member → restricted by isFinance, isContent, and per-project rules
 *   Admins can manage users and permissions. Non-admins cannot.
 */

// ── Minimal D1 type declarations (avoids needing @cloudflare/workers-types) ──

interface D1Result<T = Record<string, unknown>> {
  results: T[]
  success: boolean
  meta: Record<string, unknown>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(col?: string): Promise<T | null>
  run(): Promise<{ success: boolean; meta: Record<string, unknown> }>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = Record<string, unknown>>(stmts: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<{ count: number; duration: number }>
}

interface Env {
  DB: D1Database
  /** Optional Resend API key — when present, invitations are emailed automatically. */
  RESEND_API_KEY?: string
  /** Optional verified sender, e.g. "بوصلة الأعمال <no-reply@boslaworks.com>". */
  INVITE_FROM?: string
  /** Public site URL used in invitation links (defaults to https://boslaworks.com). */
  SITE_URL?: string
  /** Cloudflare API token with Access + Account read/write permissions. */
  CLOUDFLARE_API_TOKEN?: string
  /** Cloudflare Account ID — auto-discovered when omitted. */
  CF_ACCOUNT_ID?: string
}

// ── Helpers ───────────────────────────────────────────────

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status)
}

/** Serialize JSON fields before writing to D1. */
function ser(v: unknown): unknown {
  if (Array.isArray(v) || (v !== null && typeof v === 'object')) return JSON.stringify(v)
  return v
}

/** Deserialize JSON text fields from D1 rows. */
function parseRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
      try { out[k] = JSON.parse(v) } catch { out[k] = v }
    } else {
      out[k] = v
    }
  }
  return out
}

/** camelCase → snake_case */
function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

/** snake_case → camelCase */
function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

/** Convert all keys of an object to camelCase and parse JSON string fields. */
function rowToCamel(row: Record<string, unknown>): Record<string, unknown> {
  const parsed = parseRow(row)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(parsed)) out[toCamel(k)] = v
  return out
}

/** Build a parameterised INSERT from a camelCase object. */
function buildInsert(
  table: string,
  data: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): { sql: string; vals: unknown[] } {
  const merged = { ...extra }
  for (const [k, v] of Object.entries(data)) merged[toSnake(k)] = ser(v)
  const cols = Object.keys(merged)
  const vals = Object.values(merged)
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
  return { sql, vals }
}

/** Build a parameterised UPDATE from a camelCase patch. */
function buildUpdate(
  table: string,
  id: string,
  data: Record<string, unknown>
): { sql: string; vals: unknown[] } {
  const sets: string[] = []
  const vals: unknown[] = []
  for (const [k, v] of Object.entries(data)) {
    if (k === 'id') continue
    sets.push(`${toSnake(k)} = ?`)
    vals.push(ser(v))
  }
  vals.push(id)
  return { sql: `UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`, vals }
}

// ── Auth ──────────────────────────────────────────────────

interface UserRow {
  id: string
  name: string
  email: string | null
  avatar: string | null
  system_role: 'admin' | 'member'
  is_finance: number
  is_content: number
  created_at: string
}

/** Decode the `email` claim from a Cloudflare Access JWT payload (no signature
 * check needed — Access already verified it at the edge before forwarding, and
 * clients can't spoof Cf-Access-* headers on a protected app). */
function decodeJwtEmail(jwt: string): string | null {
  try {
    const payload = jwt.split('.')[1]
    if (!payload) return null
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const data = JSON.parse(atob(padded)) as Record<string, unknown>
    const email = (data.email ?? (data.identity as Record<string, unknown> | undefined)?.email) as unknown
    return typeof email === 'string' && email ? email.toLowerCase() : null
  } catch {
    return null
  }
}

/** Resolve the authenticated visitor's email from Access headers, falling back
 * to the JWT when the dedicated email header isn't forwarded (some Access
 * configurations only send Cf-Access-Jwt-Assertion). */
function resolveAccessEmail(req: Request): string | null {
  const header =
    req.headers.get('Cf-Access-Authenticated-User-Email') ||
    req.headers.get('CF-Access-Authenticated-User-Email')
  if (header) return header.toLowerCase()
  const jwt = req.headers.get('Cf-Access-Jwt-Assertion')
  return jwt ? decodeJwtEmail(jwt) : null
}

async function getAuthUser(req: Request, db: D1Database): Promise<UserRow | null> {
  const normalized = resolveAccessEmail(req)
  if (!normalized) return null

  const existing = await db
    .prepare('SELECT * FROM app_users WHERE lower(email) = ?')
    .bind(normalized)
    .first<UserRow>()
  if (existing) return existing

  // Bootstrap: when no users exist yet, the first authenticated visitor claims
  // the admin role server-side. This mirrors the client's bindIdentity claim and
  // breaks the chicken-and-egg where every write needs an already-provisioned
  // user. After the first admin exists, unprovisioned visitors get 401 (an admin
  // must add them).
  const count = await db.prepare('SELECT COUNT(*) AS n FROM app_users').first<{ n: number }>()
  if (!count || count.n === 0) {
    const now = new Date().toISOString()
    const name = (req.headers.get('CF-Access-Authenticated-User-Name') || normalized.split('@')[0] || 'المسؤول').trim()
    const admin: UserRow = {
      id: 'admin-default',
      name,
      email: normalized,
      avatar: null,
      system_role: 'admin',
      is_finance: 1,
      is_content: 1,
      created_at: now,
    }
    await db
      .prepare(`INSERT OR REPLACE INTO app_users (id, name, email, avatar, system_role, is_finance, is_content, created_at)
                VALUES (?, ?, ?, NULL, 'admin', 1, 1, ?)`)
      .bind(admin.id, admin.name, admin.email, admin.created_at)
      .run()
    return admin
  }

  return null
}

function isAdmin(u: UserRow): boolean {
  return u.system_role === 'admin'
}

// ── Permission helpers ────────────────────────────────────

async function canAccessProject(db: D1Database, userId: string, projectId: string): Promise<boolean> {
  const perm = await db
    .prepare('SELECT access FROM project_permissions WHERE user_id = ? AND project_id = ?')
    .bind(userId, projectId)
    .first<{ access: string }>()
  if (!perm) return true
  return perm.access !== 'none'
}

// ── Route handlers ────────────────────────────────────────

// Health check — verifies D1 connectivity and surfaces the Cloudflare Access
// identity headers actually received, so we can diagnose auth wiring.
async function handleHealth(db: D1Database, req: Request): Promise<Response> {
  let dbOk = false
  try {
    await db.prepare('SELECT 1').first()
    dbOk = true
  } catch { /* dbOk stays false */ }

  const accessEmail = resolveAccessEmail(req)
  const jwt = req.headers.get('Cf-Access-Jwt-Assertion')
  const hasJwt = !!jwt

  // Diagnostic: which claim keys does the JWT carry, and is there an email-like one?
  let jwtClaimKeys: string[] | null = null
  let jwtEmailClaim: string | null = null
  if (jwt) {
    try {
      const payload = jwt.split('.')[1]
      const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
      const data = JSON.parse(atob(padded)) as Record<string, unknown>
      jwtClaimKeys = Object.keys(data)
      const e = (data.email ?? (data.identity as Record<string, unknown> | undefined)?.email) as unknown
      jwtEmailClaim = typeof e === 'string' ? e : null
    } catch {
      jwtClaimKeys = ['<decode-error>']
    }
  }

  let userCount: number | null = null
  try {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM app_users').first<{ n: number }>()
    userCount = row?.n ?? 0
  } catch { /* leave null */ }

  return json({
    ok: true,
    db: dbOk,
    accessEmail,
    hasJwt,
    jwtClaimKeys,
    jwtEmailClaim,
    userCount,
    ts: new Date().toISOString(),
  })
}

// ── Invitations ───────────────────────────────────────────
//
// POST /api/invite — notify a granted user by email. Sends automatically via
// Resend when RESEND_API_KEY is configured; otherwise responds with
// { sent: false, fallback: true } so the client can open a mailto draft.

interface InvitePayload {
  email: string
  name?: string
  projectName?: string
  toolLabels?: string[]
  inviterName?: string
}

function inviteSubject(p: InvitePayload): string {
  return p.projectName
    ? `دعوة للوصول إلى مشروع ${p.projectName} — بوصلة الأعمال`
    : 'دعوة للوصول إلى بوصلة الأعمال'
}

function inviteHtml(p: InvitePayload, siteUrl: string): string {
  const tools = (p.toolLabels ?? []).filter(Boolean)
  const toolsBlock = tools.length
    ? `<p style="margin:16px 0 8px;color:#475569;font-size:14px">الأقسام المتاحة لك:</p>
       <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600">${tools.join(' · ')}</p>`
    : ''
  const projectLine = p.projectName
    ? `تم منحك صلاحية الوصول إلى مشروع <strong>${p.projectName}</strong> على منصة بوصلة الأعمال.`
    : 'تم منحك صلاحية الوصول إلى منصة بوصلة الأعمال.'
  return `<!doctype html>
<html dir="rtl" lang="ar"><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Tahoma,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px">
      <div style="width:48px;height:48px;border-radius:12px;background:#6366F1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800">ب</div>
      <h1 style="margin:20px 0 8px;color:#0f172a;font-size:18px">مرحباً ${p.name ?? ''}</h1>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.7">${projectLine}</p>
      ${toolsBlock}
      <a href="${siteUrl}" style="display:inline-block;margin-top:24px;background:#6366F1;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:10px">فتح المنصة وتسجيل الدخول</a>
      <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;line-height:1.7">
        سجّل الدخول باستخدام بريدك (${p.email}) عبر بوابة الدخول الموحّدة.${p.inviterName ? ` الدعوة من ${p.inviterName}.` : ''}
      </p>
    </div>
  </div>
</body></html>`
}

async function handleInvite(req: Request, env: Env, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  const p = await req.json() as InvitePayload
  if (!p.email) return err('البريد مطلوب', 400)

  const siteUrl = env.SITE_URL ?? 'https://boslaworks.com'

  // No provider configured → let the client fall back to a mailto draft.
  if (!env.RESEND_API_KEY) {
    return json({ sent: false, fallback: true })
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.INVITE_FROM ?? 'بوصلة الأعمال <onboarding@resend.dev>',
        to: [p.email],
        subject: inviteSubject(p),
        html: inviteHtml(p, siteUrl),
      }),
    })
    if (!res.ok) {
      const detail = await res.text()
      return json({ sent: false, fallback: true, error: detail }, 200)
    }
    return json({ sent: true })
  } catch {
    return json({ sent: false, fallback: true })
  }
}

// ── Cloudflare Access management ─────────────────────────
//
// Helpers that call the Cloudflare REST API from inside the Pages Function
// (runs on CF infra — never blocked by IP allowlist restrictions).

interface CfApp { id: string; domain?: string; name?: string }
interface CfIdp { id: string; type: string; name: string }

async function cfGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    if (!r.ok) return null
    const d = await r.json() as { result: T }
    return d.result ?? null
  } catch { return null }
}

async function cfGetWithError<T>(token: string, path: string): Promise<{ result: T | null; error: string | null }> {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    const d = await r.json() as { result: T; success: boolean; errors?: Array<{ message: string }> }
    if (!r.ok || !d.success) {
      const msg = d.errors?.[0]?.message ?? `HTTP ${r.status}`
      return { result: null, error: msg }
    }
    return { result: d.result ?? null, error: null }
  } catch (e) {
    return { result: null, error: String(e) }
  }
}

async function cfPost<T>(token: string, path: string, body: unknown): Promise<T | null> {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json() as { result: T; success: boolean; errors?: unknown[] }
    return d.success ? d.result : null
  } catch { return null }
}

async function cfPut<T>(token: string, path: string, body: unknown): Promise<T | null> {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json() as { result: T; success: boolean; errors?: unknown[] }
    return d.success ? d.result : null
  } catch { return null }
}

async function cfPatch<T>(token: string, path: string, body: unknown): Promise<T | null> {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json() as { result: T; success: boolean; errors?: unknown[] }
    return d.success ? d.result : null
  } catch { return null }
}

async function cfPostDetailed<T>(
  token: string, path: string, body: unknown
): Promise<{ result: T | null; error: string | null }> {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json() as { result: T; success: boolean; errors?: Array<{ message: string }> }
    if (d.success) return { result: d.result, error: null }
    const msg = d.errors?.[0]?.message ?? `HTTP ${r.status}`
    return { result: null, error: msg }
  } catch (e) { return { result: null, error: String(e) } }
}

async function cfPutDetailed<T>(
  token: string, path: string, body: unknown
): Promise<{ result: T | null; error: string | null }> {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json() as { result: T; success: boolean; errors?: Array<{ message: string }> }
    if (d.success) return { result: d.result, error: null }
    const msg = d.errors?.[0]?.message ?? `HTTP ${r.status}`
    return { result: null, error: msg }
  } catch (e) { return { result: null, error: String(e) } }
}

async function cfPatchDetailed<T>(
  token: string, path: string, body: unknown
): Promise<{ result: T | null; error: string | null }> {
  try {
    const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const d = await r.json() as { result: T; success: boolean; errors?: Array<{ message: string }> }
    if (d.success) return { result: d.result, error: null }
    const msg = d.errors?.[0]?.message ?? `HTTP ${r.status}`
    return { result: null, error: msg }
  } catch (e) { return { result: null, error: String(e) } }
}

const BOSLA_ACCOUNT_ID = '645b32d31a95fbc82db2c606a66565dc'

/** Resolve account ID — uses env var, then discovers from token, then falls back to the known deployment account. */
async function getAccountId(token: string, envId?: string): Promise<string | null> {
  if (envId) return envId
  const accounts = await cfGet<Array<{ id: string }>>(token, '/accounts?per_page=1')
  return accounts?.[0]?.id ?? BOSLA_ACCOUNT_ID
}

/** Find the Cloudflare Access app for boslaworks.com. */
async function findAccessApp(token: string, accountId: string): Promise<CfApp | null> {
  const apps = await cfGet<CfApp[]>(token, `/accounts/${accountId}/access/apps?per_page=50`)
  return (apps ?? []).find(
    (a) => a.domain?.includes('boslaworks') || a.name?.toLowerCase().includes('bosla')
  ) ?? null
}

/** Add an email-based allow policy to the Access app. Idempotent — skips if already present. */
async function grantAccessEmail(token: string, accountId: string, email: string, name: string): Promise<boolean> {
  const app = await findAccessApp(token, accountId)
  if (!app) return false

  // Check if a policy for this email already exists
  const policies = await cfGet<Array<{ id: string; name: string }>>(
    token, `/accounts/${accountId}/access/apps/${app.id}/policies?per_page=100`
  )
  const exists = (policies ?? []).some((p) => p.name === `User: ${email}`)
  if (exists) return true

  const result = await cfPost(token, `/accounts/${accountId}/access/apps/${app.id}/policies`, {
    name: `User: ${email}`,
    decision: 'allow',
    include: [{ email: { email } }],
    precedence: 10,
  })
  return !!result
}

// POST /api/access/grant  — admin grants CF Access + provisions user in D1
interface GrantPayload {
  userId: string
  name: string
  email: string
  systemRole: string
  isFinance: boolean
  isContent: boolean
  createdAt: string
  permissions: Array<{ userId: string; projectId: string; access: string; deniedTools: string[] }>
}

async function handleGrantAccess(req: Request, db: D1Database, env: Env, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)

  const p = await req.json() as GrantPayload
  if (!p.email || !p.userId) return err('البيانات ناقصة', 400)

  // 1) Upsert user in D1
  await db.prepare(`
    INSERT INTO app_users (id, name, email, system_role, is_finance, is_content, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name, email = excluded.email,
      system_role = excluded.system_role,
      is_finance = excluded.is_finance,
      is_content = excluded.is_content
  `).bind(p.userId, p.name, p.email.toLowerCase(), p.systemRole,
           p.isFinance ? 1 : 0, p.isContent ? 1 : 0, p.createdAt).run()

  // 2) Upsert permissions in D1
  for (const perm of (p.permissions ?? [])) {
    await db.prepare(`
      INSERT INTO project_permissions (user_id, project_id, access, denied_tools)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, project_id) DO UPDATE SET
        access = excluded.access, denied_tools = excluded.denied_tools
    `).bind(perm.userId, perm.projectId, perm.access, JSON.stringify(perm.deniedTools ?? [])).run()
  }

  // 3) Add to Cloudflare Access (non-fatal if not configured)
  let addedToAccess = false
  const token = env.CLOUDFLARE_API_TOKEN
  if (token) {
    const accountId = await getAccountId(token, env.CF_ACCOUNT_ID)
    if (accountId) addedToAccess = await grantAccessEmail(token, accountId, p.email, p.name)
  }

  return json({ ok: true, addedToAccess, cfConfigured: !!token })
}

// POST /api/setup/google-idp — one-time: add Google as CF Access identity provider
interface GoogleIdpPayload { clientId: string; clientSecret: string }

async function handleSetupGoogleIdp(req: Request, env: Env, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)

  const token = env.CLOUDFLARE_API_TOKEN
  if (!token) return err('CLOUDFLARE_API_TOKEN غير مُعدَّ', 400)

  const p = await req.json() as GoogleIdpPayload
  if (!p.clientId || !p.clientSecret) return err('Client ID و Client Secret مطلوبان', 400)

  const accountId = await getAccountId(token, env.CF_ACCOUNT_ID)
  if (!accountId) return err('تعذّر تحديد الحساب', 500)

  // Verify token has Zero Trust access by listing identity providers
  const existing = await cfGetWithError<CfIdp[]>(token, `/accounts/${accountId}/access/identity_providers?per_page=50`)
  if (existing.error) return err(`صلاحية Cloudflare API: ${existing.error}`, 400)
  const hasGoogle = (existing.result ?? []).some((idp) => idp.type === 'google')
  if (hasGoogle) return json({ ok: true, alreadyExists: true })

  const result = await cfPost(token, `/accounts/${accountId}/access/identity_providers`, {
    type: 'google',
    name: 'Google',
    config: { client_id: p.clientId, client_secret: p.clientSecret },
  })

  if (!result) return err('فشل إضافة Google IDP — تحقق من Client ID و Secret', 500)

  // Return the redirect URI the user needs to add in Google Console.
  // auth_domain (e.g. "tiny-shape-6245.cloudflareaccess.com") comes from the org object;
  // fallback to the team slug known at build time so the URL is always correct.
  const orgForIdp = await cfGet<{ auth_domain?: string }>(
    token, `/accounts/${accountId}/access/organizations`
  )
  const authDomain = orgForIdp?.auth_domain ?? 'tiny-shape-6245.cloudflareaccess.com'
  const redirectUri = `https://${authDomain}/cdn-cgi/access/callback`
  return json({ ok: true, redirectUri })
}

// POST /api/setup/custom-login — brand the CF Access login page + enable /login bypass

async function handleSetupCustomLogin(env: Env, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)

  const token = env.CLOUDFLARE_API_TOKEN
  if (!token) return err('CLOUDFLARE_API_TOKEN غير مُعدَّ', 400)

  const accountId = await getAccountId(token, env.CF_ACCOUNT_ID)
  if (!accountId) return err('تعذّر تحديد الحساب', 500)

  const results: string[] = []
  const warnings: string[] = []

  // 1. Update the CF Access organization login design.
  // Must GET first (PUT replaces the full object — sending only login_design wipes other required fields).
  // Read-only fields (timestamps) are stripped so CF doesn't reject the echo-back.
  const { result: currentOrg, error: orgGetErr } =
    await cfGetWithError<Record<string, unknown>>(token, `/accounts/${accountId}/access/organizations`)
  if (currentOrg) {
    const { created_at: _c, updated_at: _u, ...writable } = currentOrg
    const { result: updated, error: orgPutErr } = await cfPutDetailed(
      token, `/accounts/${accountId}/access/organizations`, {
        ...writable,
        login_design: {
          ...((currentOrg.login_design as Record<string, unknown> | undefined) ?? {}),
          background_color:  '#0f0f16',
          button_color:      '#6366f1',
          button_text_color: '#ffffff',
          text_color:        '#e8e8f0',
          logo_path:         'https://boslaworks.com/apple-touch-icon.png',
          header_text:       'بوصلة الأعمال',
          footer_text:       'نظام مقيّد للأعضاء المُصرَّح لهم فقط',
        },
      }
    )
    if (updated) results.push('تم تحديث تصميم صفحة تسجيل الدخول')
    else warnings.push(`تعذّر تحديث تصميم CF Access${orgPutErr ? ` (${orgPutErr})` : ''}`)
  } else {
    warnings.push(`تعذّر جلب إعدادات المنظمة من CF Access${orgGetErr ? ` (${orgGetErr})` : ''}`)
  }

  // 2. Create a dedicated Access app for boslaworks.com/login with a bypass policy.
  // CF Access policies are app-level; the only way to bypass a specific sub-path is
  // to create a separate app scoped to that path, which CF prioritises over the parent.
  const apps = await cfGet<Array<{ id: string; name: string; domain: string }>>(
    token, `/accounts/${accountId}/access/apps?per_page=100`
  )
  const loginApp = (apps ?? []).find(
    (a) => a.domain?.includes('boslaworks.com/login') || a.name?.toLowerCase().includes('login page (public)')
  )

  if (loginApp) {
    results.push('تطبيق bypass لـ /login موجود بالفعل')
  } else {
    interface CfAppResult { id: string }
    const { result: newApp, error: appErr } = await cfPostDetailed<CfAppResult>(
      token, `/accounts/${accountId}/access/apps`, {
        name: 'boslaworks.com — Login Page (Public)',
        domain: 'boslaworks.com/login',
        self_hosted_domains: ['boslaworks.com/login'],
        type: 'self_hosted',
        session_duration: '24h',
        auto_redirect_to_identity: false,
        skip_interstitial: true,
      }
    )

    if (!newApp) {
      warnings.push(`تعذّر إنشاء تطبيق Access لـ /login${appErr ? ` (${appErr})` : ''} — أنشئه يدوياً: domain "boslaworks.com/login"، نوع self-hosted، سياسة bypass للجميع`)
    } else {
      const { result: policy, error: polErr } = await cfPostDetailed(
        token, `/accounts/${accountId}/access/apps/${newApp.id}/policies`, {
          name: 'Bypass — public login page',
          decision: 'bypass',
          include: [{ everyone: {} }],
        }
      )
      if (policy) results.push('تم إنشاء تطبيق /login العام وإضافة سياسة bypass')
      else warnings.push(`تم إنشاء التطبيق لكن تعذّر إضافة سياسة bypass${polErr ? ` (${polErr})` : ''} — افتح التطبيق في CF Zero Trust وأضف سياسة "bypass" يدوياً`)
    }
  }

  // 3. Make the main app redirect straight to Google (skip Cloudflare's own login screen).
  // When the custom /login button sends the user to the protected root, CF Access intercepts
  // it. Without auto-redirect, CF shows its own IdP-chooser page — redundant on top of our
  // branded page. Setting auto_redirect_to_identity + a single allowed IdP (Google) makes CF
  // jump straight to Google.
  const mainApp = (apps ?? []).find(
    (a) => (a.domain?.includes('boslaworks.com') || a.name?.toLowerCase().includes('bosla'))
      && !a.domain?.includes('/login')
      && !a.name?.toLowerCase().includes('login page (public)')
  )
  if (!mainApp) {
    warnings.push('تعذّر العثور على تطبيق Access الرئيسي لتفعيل التحويل المباشر لقوقل')
  } else {
    const { result: idps } = await cfGetWithError<CfIdp[]>(
      token, `/accounts/${accountId}/access/identity_providers?per_page=50`
    )
    const google = (idps ?? []).find((i) => i.type === 'google')
    const patchBody: Record<string, unknown> = { auto_redirect_to_identity: true }
    if (google) patchBody.allowed_idps = [google.id]
    const { result: patched, error: patchErr } = await cfPatchDetailed(
      token, `/accounts/${accountId}/access/apps/${mainApp.id}`, patchBody
    )
    if (patched) results.push('تم تفعيل التحويل المباشر لقوقل عند تسجيل الدخول')
    else warnings.push(`تعذّر تفعيل التحويل المباشر لقوقل${patchErr ? ` (${patchErr})` : ''}`)
  }

  // Surface the correct Google Console redirect URI so the user can verify it.
  const orgCheck = await cfGet<{ auth_domain?: string }>(
    token, `/accounts/${accountId}/access/organizations`
  )
  const authDomain = orgCheck?.auth_domain ?? 'tiny-shape-6245.cloudflareaccess.com'
  const googleRedirectUri = `https://${authDomain}/cdn-cgi/access/callback`

  return json({
    ok: true,
    results,
    warnings,
    loginPageUrl: 'https://boslaworks.com/login',
    googleRedirectUri,
  })
}

// ── Users ─────────────────────────────────────────────────

async function handleGetUsers(db: D1Database): Promise<Response> {
  const { results } = await db.prepare('SELECT * FROM app_users ORDER BY created_at ASC').all()
  return json(results.map(rowToCamel))
}

async function handleCreateUser(req: Request, db: D1Database, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  const body = await req.json() as Record<string, unknown>
  const { sql, vals } = buildInsert('app_users', body)
  await db.prepare(sql).bind(...vals).run()
  return json({ ok: true })
}

async function handleUpdateUser(req: Request, db: D1Database, caller: UserRow, id: string): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  const body = await req.json() as Record<string, unknown>
  const { sql, vals } = buildUpdate('app_users', id, body)
  await db.prepare(sql).bind(...vals).run()
  return json({ ok: true })
}

async function handleDeleteUser(db: D1Database, caller: UserRow, id: string): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  if (id === caller.id) return err('لا يمكن حذف حسابك الخاص', 400)
  await db.prepare('DELETE FROM app_users WHERE id = ?').bind(id).run()
  return json({ ok: true })
}

// ── Permissions ───────────────────────────────────────────

async function handleGetPermissions(db: D1Database, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  const { results } = await db.prepare('SELECT * FROM project_permissions').all()
  return json(results.map(rowToCamel))
}

async function handleSetPermission(req: Request, db: D1Database, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  const body = await req.json() as { userId: string; projectId: string; access: string; deniedTools: string[] }
  await db
    .prepare(`INSERT INTO project_permissions (user_id, project_id, access, denied_tools)
              VALUES (?, ?, ?, ?)
              ON CONFLICT (user_id, project_id) DO UPDATE SET access = excluded.access, denied_tools = excluded.denied_tools`)
    .bind(body.userId, body.projectId, body.access, JSON.stringify(body.deniedTools ?? []))
    .run()
  return json({ ok: true })
}

async function handleDeletePermission(req: Request, db: D1Database, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  const body = await req.json() as { userId: string; projectId: string }
  await db
    .prepare('DELETE FROM project_permissions WHERE user_id = ? AND project_id = ?')
    .bind(body.userId, body.projectId)
    .run()
  return json({ ok: true })
}

// ── Generic project-scoped CRUD ───────────────────────────

type Table =
  | 'tasks' | 'plans' | 'plan_phases' | 'sprints' | 'notes'
  | 'product_docs' | 'team_members' | 'schedule_events' | 'meetings'
  | 'finance_entries' | 'finance_packages' | 'kpis' | 'clients'
  | 'growth_metrics' | 'growth_experiments' | 'growth_channels' | 'content_items'
  | 'product_profiles'

const ORDER_COL: Record<string, string> = {
  tasks: 'created_at',
  plan_phases: 'order_index',
  plans: 'order_index',
  sprints: 'order_index',
  notes: 'pinned DESC, created_at',
  product_docs: 'order_index',
  team_members: 'order_index',
  schedule_events: 'order_index',
  meetings: 'date DESC',
  finance_entries: 'order_index',
  finance_packages: 'order_index',
  kpis: 'order_index',
  clients: 'order_index',
  growth_metrics: 'order_index',
  growth_experiments: 'order_index',
  growth_channels: 'order_index',
  content_items: 'order_index',
  product_profiles: 'created_at',
}

async function handleList(
  db: D1Database,
  table: Table,
  caller: UserRow,
  projectId: string
): Promise<Response> {
  if (!isAdmin(caller)) {
    if (!(await canAccessProject(db, caller.id, projectId))) return json([])
    // Finance-only tables
    if (['finance_entries', 'finance_packages', 'kpis'].includes(table) && !caller.is_finance) return json([])
    // Content-only tables
    if (['content_items', 'clients'].includes(table) && !caller.is_content) return json([])
  }
  const order = ORDER_COL[table] ?? 'created_at'
  const { results } = await db
    .prepare(`SELECT * FROM ${table} WHERE project_id = ? ORDER BY ${order}`)
    .bind(projectId)
    .all()
  return json(results.map(rowToCamel))
}

async function handleGet(db: D1Database, table: Table, id: string): Promise<Response> {
  const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first()
  if (!row) return err('غير موجود', 404)
  return json(rowToCamel(row as Record<string, unknown>))
}

async function handleCreate(
  req: Request,
  db: D1Database,
  table: Table,
  caller: UserRow
): Promise<Response> {
  const body = await req.json() as Record<string, unknown>
  // Permission checks on create
  if (!isAdmin(caller)) {
    const projectId = body.projectId as string | undefined
    if (projectId && !(await canAccessProject(db, caller.id, projectId))) return err('غير مصرح', 403)
    if (['finance_entries', 'finance_packages', 'kpis'].includes(table) && !caller.is_finance) return err('غير مصرح', 403)
    if (['content_items', 'clients'].includes(table) && !caller.is_content) return err('غير مصرح', 403)
  }
  const { sql, vals } = buildInsert(table, body)
  await db.prepare(sql).bind(...vals).run()
  return json({ ok: true, id: body.id })
}

async function handleUpdate(
  req: Request,
  db: D1Database,
  table: Table,
  id: string
): Promise<Response> {
  const body = await req.json() as Record<string, unknown>
  const { sql, vals } = buildUpdate(table, id, body)
  await db.prepare(sql).bind(...vals).run()
  return json({ ok: true })
}

async function handleDelete(db: D1Database, table: Table, id: string): Promise<Response> {
  await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run()
  return json({ ok: true })
}

// ── Projects ──────────────────────────────────────────────

async function handleListProjects(db: D1Database, caller: UserRow): Promise<Response> {
  const { results } = await db
    .prepare('SELECT * FROM projects ORDER BY updated_at DESC')
    .all()
  if (isAdmin(caller)) return json(results.map(rowToCamel))

  // Filter by permission
  const { results: perms } = await db
    .prepare('SELECT project_id, access FROM project_permissions WHERE user_id = ?')
    .bind(caller.id)
    .all<{ project_id: string; access: string }>()
  const blocked = new Set(perms.filter((p) => p.access === 'none').map((p) => p.project_id))
  return json(results.filter((r) => !blocked.has(r.id as string)).map(rowToCamel))
}

async function handleCreateProject(req: Request, db: D1Database, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('المشاريع يُنشئها المسؤول فقط', 403)
  const body = await req.json() as Record<string, unknown>
  const { sql, vals } = buildInsert('projects', body)
  await db.prepare(sql).bind(...vals).run()
  return json({ ok: true, id: body.id })
}

async function handleUpdateProject(req: Request, db: D1Database, id: string): Promise<Response> {
  const body = await req.json() as Record<string, unknown>
  const { sql, vals } = buildUpdate('projects', id, body)
  await db.prepare(sql).bind(...vals).run()
  return json({ ok: true })
}

async function handleDeleteProject(db: D1Database, caller: UserRow, id: string): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
  return json({ ok: true })
}

// ── Portfolios ────────────────────────────────────────────

async function handleListPortfolios(db: D1Database): Promise<Response> {
  const { results } = await db.prepare('SELECT * FROM portfolios ORDER BY created_at ASC').all()
  return json(results.map(rowToCamel))
}

async function handleCreatePortfolio(req: Request, db: D1Database): Promise<Response> {
  const body = await req.json() as Record<string, unknown>
  const { sql, vals } = buildInsert('portfolios', body)
  await db.prepare(sql).bind(...vals).run()
  return json({ ok: true, id: body.id })
}

async function handleUpdatePortfolio(req: Request, db: D1Database, id: string): Promise<Response> {
  const body = await req.json() as Record<string, unknown>
  const { sql, vals } = buildUpdate('portfolios', id, body)
  await db.prepare(sql).bind(...vals).run()
  return json({ ok: true })
}

async function handleDeletePortfolio(db: D1Database, id: string): Promise<Response> {
  await db.prepare('DELETE FROM portfolios WHERE id = ?').bind(id).run()
  return json({ ok: true })
}

// ── Bulk sync endpoints ───────────────────────────────────
//
// GET  /api/sync  → pull all data the caller can access (initial hydration)
// POST /api/sync  → push local snapshot (first-time migration from localStorage)

async function handleSyncPull(db: D1Database, caller: UserRow): Promise<Response> {
  const isAdm = isAdmin(caller)

  const [
    projects, tasks, plans, phases, sprints, notes, docs, team, schedule,
    meetings, finance, packages, kpis, clients, metrics, experiments,
    channels, content, portfolios, profiles, users, permissions,
  ] = await Promise.all([
    handleListProjects(db, caller).then((r) => r.json()),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM tasks ORDER BY created_at').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM plans ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM plan_phases ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM sprints ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM notes ORDER BY pinned DESC, created_at').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM product_docs ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM team_members ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM schedule_events ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM meetings ORDER BY date DESC').all()
      return results.map(rowToCamel)
    })(),
    isAdm || caller.is_finance
      ? db.prepare('SELECT * FROM finance_entries ORDER BY order_index').all().then((r) => r.results.map(rowToCamel))
      : Promise.resolve([]),
    isAdm || caller.is_finance
      ? db.prepare('SELECT * FROM finance_packages ORDER BY order_index').all().then((r) => r.results.map(rowToCamel))
      : Promise.resolve([]),
    isAdm || caller.is_finance
      ? db.prepare('SELECT * FROM kpis ORDER BY order_index').all().then((r) => r.results.map(rowToCamel))
      : Promise.resolve([]),
    isAdm || caller.is_content
      ? db.prepare('SELECT * FROM clients ORDER BY order_index').all().then((r) => r.results.map(rowToCamel))
      : Promise.resolve([]),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM growth_metrics ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM growth_experiments ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    (async () => {
      const { results } = await db.prepare('SELECT * FROM growth_channels ORDER BY order_index').all()
      return results.map(rowToCamel)
    })(),
    isAdm || caller.is_content
      ? db.prepare('SELECT * FROM content_items ORDER BY order_index').all().then((r) => r.results.map(rowToCamel))
      : Promise.resolve([]),
    handleListPortfolios(db).then((r) => r.json()),
    (async () => {
      // Tolerate a not-yet-migrated DB (table added after deploy) — sync must not break.
      try {
        const { results } = await db.prepare('SELECT * FROM product_profiles ORDER BY created_at').all()
        return results.map(rowToCamel)
      } catch { return [] }
    })(),
    isAdm
      ? db.prepare('SELECT * FROM app_users ORDER BY created_at').all().then((r) => r.results.map(rowToCamel))
      : db.prepare('SELECT * FROM app_users WHERE id = ?').bind(caller.id).all().then((r) => r.results.map(rowToCamel)),
    isAdm
      ? db.prepare('SELECT * FROM project_permissions').all().then((r) => r.results.map(rowToCamel))
      : db.prepare('SELECT * FROM project_permissions WHERE user_id = ?').bind(caller.id).all().then((r) => r.results.map(rowToCamel)),
  ])

  // `seeded` reflects whether D1 holds any projects at all (unfiltered), so the
  // client can tell "first-time migration" apart from "this member sees nothing".
  const seededRow = await db.prepare('SELECT COUNT(*) AS n FROM projects').first<{ n: number }>()
  const seeded = (seededRow?.n ?? 0) > 0

  return json({
    seeded,
    projects, tasks, plans, phases, sprints, notes, docs, team, schedule,
    meetings, finance, packages, kpis, clients, metrics, experiments,
    channels, content, portfolios, profiles, users, permissions,
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

async function upsertBatch(
  db: D1Database,
  table: string,
  rows: AnyObj[],
  idField = 'id'
): Promise<void> {
  if (!rows.length) return
  // Insert or replace — works because all tables have PRIMARY KEY on id
  for (const row of rows) {
    const merged: AnyObj = {}
    for (const [k, v] of Object.entries(row)) merged[toSnake(k)] = ser(v)
    const cols = Object.keys(merged)
    const vals = Object.values(merged)
    const sql = `INSERT OR REPLACE INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`
    await db.prepare(sql).bind(...vals).run()
  }
}

async function handleSyncPush(req: Request, db: D1Database, caller: UserRow): Promise<Response> {
  // Only allowed when the DB is empty (first-time migration) or caller is admin
  const existing = await db.prepare('SELECT COUNT(*) as n FROM projects').first<{ n: number }>()
  if (existing && existing.n > 0 && !isAdmin(caller)) {
    return err('البيانات موجودة بالفعل. تواصل مع المسؤول للمزامنة.', 403)
  }

  const body = await req.json() as {
    projects?: AnyObj[]; tasks?: AnyObj[]; plans?: AnyObj[]; phases?: AnyObj[]
    sprints?: AnyObj[]; notes?: AnyObj[]; docs?: AnyObj[]; team?: AnyObj[]
    schedule?: AnyObj[]; meetings?: AnyObj[]; finance?: AnyObj[]; packages?: AnyObj[]
    kpis?: AnyObj[]; clients?: AnyObj[]; metrics?: AnyObj[]; experiments?: AnyObj[]
    channels?: AnyObj[]; content?: AnyObj[]; portfolios?: AnyObj[]
    profiles?: AnyObj[]; users?: AnyObj[]; permissions?: AnyObj[]
  }

  await upsertBatch(db, 'projects',           body.projects    ?? [])
  await upsertBatch(db, 'tasks',              body.tasks       ?? [])
  await upsertBatch(db, 'plans',              body.plans       ?? [])
  await upsertBatch(db, 'plan_phases',        body.phases      ?? [])
  await upsertBatch(db, 'sprints',            body.sprints     ?? [])
  await upsertBatch(db, 'notes',              body.notes       ?? [])
  await upsertBatch(db, 'product_docs',       body.docs        ?? [])
  await upsertBatch(db, 'team_members',       body.team        ?? [])
  await upsertBatch(db, 'schedule_events',    body.schedule    ?? [])
  await upsertBatch(db, 'meetings',           body.meetings    ?? [])
  await upsertBatch(db, 'finance_entries',    body.finance     ?? [])
  await upsertBatch(db, 'finance_packages',   body.packages    ?? [])
  await upsertBatch(db, 'kpis',              body.kpis        ?? [])
  await upsertBatch(db, 'clients',            body.clients     ?? [])
  await upsertBatch(db, 'growth_metrics',     body.metrics     ?? [])
  await upsertBatch(db, 'growth_experiments', body.experiments ?? [])
  await upsertBatch(db, 'growth_channels',    body.channels    ?? [])
  await upsertBatch(db, 'content_items',      body.content     ?? [])
  await upsertBatch(db, 'portfolios',         body.portfolios  ?? [])
  await upsertBatch(db, 'product_profiles',   body.profiles    ?? [])

  // Users & permissions: only admin-provided data
  if (isAdmin(caller)) {
    await upsertBatch(db, 'app_users',            body.users       ?? [])
    await upsertBatch(db, 'project_permissions',  body.permissions ?? [])
  }

  return json({ ok: true })
}

// Data tables wiped by a force-reset (everything except users & permissions,
// which manage access and must survive a content reset).
const DATA_TABLES = [
  'tasks', 'plan_phases', 'plans', 'sprints', 'notes', 'product_docs',
  'team_members', 'schedule_events', 'meetings', 'finance_entries',
  'finance_packages', 'kpis', 'clients', 'growth_metrics', 'growth_experiments',
  'growth_channels', 'content_items', 'portfolios', 'product_profiles', 'projects',
]

/**
 * POST /api/sync/reset — admin recovery. Clears all shared content from D1 and
 * re-seeds it from the caller's snapshot, making this browser the single source
 * of truth. Users & permissions are preserved. Use to recover from a divergent
 * state where stale browsers had resurrected deleted records.
 */
async function handleSyncReset(req: Request, db: D1Database, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح — المزامنة القسرية للمسؤول فقط', 403)

  for (const t of DATA_TABLES) {
    await db.prepare(`DELETE FROM ${t}`).run()
  }

  const body = await req.json() as Record<string, AnyObj[]>
  await upsertBatch(db, 'projects',           body.projects    ?? [])
  await upsertBatch(db, 'tasks',              body.tasks       ?? [])
  await upsertBatch(db, 'plans',              body.plans       ?? [])
  await upsertBatch(db, 'plan_phases',        body.phases      ?? [])
  await upsertBatch(db, 'sprints',            body.sprints     ?? [])
  await upsertBatch(db, 'notes',              body.notes       ?? [])
  await upsertBatch(db, 'product_docs',       body.docs        ?? [])
  await upsertBatch(db, 'team_members',       body.team        ?? [])
  await upsertBatch(db, 'schedule_events',    body.schedule    ?? [])
  await upsertBatch(db, 'meetings',           body.meetings    ?? [])
  await upsertBatch(db, 'finance_entries',    body.finance     ?? [])
  await upsertBatch(db, 'finance_packages',   body.packages    ?? [])
  await upsertBatch(db, 'kpis',              body.kpis        ?? [])
  await upsertBatch(db, 'clients',            body.clients     ?? [])
  await upsertBatch(db, 'growth_metrics',     body.metrics     ?? [])
  await upsertBatch(db, 'growth_experiments', body.experiments ?? [])
  await upsertBatch(db, 'growth_channels',    body.channels    ?? [])
  await upsertBatch(db, 'content_items',      body.content     ?? [])
  await upsertBatch(db, 'portfolios',         body.portfolios  ?? [])
  await upsertBatch(db, 'product_profiles',   body.profiles    ?? [])

  return json({ ok: true })
}

// ── Main router ───────────────────────────────────────────

const RESOURCE_TABLE: Record<string, Table> = {
  tasks:       'tasks',
  plans:       'plans',
  phases:      'plan_phases',
  sprints:     'sprints',
  notes:       'notes',
  docs:        'product_docs',
  team:        'team_members',
  schedule:    'schedule_events',
  meetings:    'meetings',
  finance:     'finance_entries',
  packages:    'finance_packages',
  kpis:        'kpis',
  clients:     'clients',
  metrics:     'growth_metrics',
  experiments: 'growth_experiments',
  channels:    'growth_channels',
  content:     'content_items',
  profiles:    'product_profiles',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequest(ctx: any): Promise<Response> {
  const { request, env, params } = ctx
  const db: D1Database = env.DB
  const method: string = request.method.toUpperCase()

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  // Path segments after /api/
  const segments: string[] = Array.isArray(params?.path) ? params.path : (params?.path ? [params.path] : [])

  // Health check — no auth required
  if (segments[0] === 'health') return handleHealth(db, request)

  // All other routes require authentication
  const caller = await getAuthUser(request, db)
  if (!caller) return err('غير مصرح — تسجيل الدخول مطلوب', 401)

  const [resource, idOrSub] = segments

  // /api/invite
  if (resource === 'invite') {
    if (method === 'POST') return handleInvite(request, env as Env, caller)
  }

  // /api/access/grant  — provision user in D1 + Cloudflare Access
  if (resource === 'access' && idOrSub === 'grant') {
    if (method === 'POST') return handleGrantAccess(request, db, env as Env, caller)
  }

  // /api/setup/google-idp  — one-time Google Identity Provider setup
  if (resource === 'setup' && idOrSub === 'google-idp') {
    if (method === 'POST') return handleSetupGoogleIdp(request, env as Env, caller)
  }

  // /api/setup/custom-login — brand CF Access login page + enable /login bypass
  if (resource === 'setup' && idOrSub === 'custom-login') {
    if (method === 'POST') return handleSetupCustomLogin(env as Env, caller)
  }

  // /api/sync  (and /api/sync/reset)
  if (resource === 'sync') {
    if (idOrSub === 'reset' && method === 'POST') return handleSyncReset(request, db, caller)
    if (method === 'GET')  return handleSyncPull(db, caller)
    if (method === 'POST') return handleSyncPush(request, db, caller)
  }

  // /api/me
  if (resource === 'me') {
    return json(rowToCamel(caller as unknown as Record<string, unknown>))
  }

  // /api/users
  if (resource === 'users') {
    if (!idOrSub) {
      if (method === 'GET')  return handleGetUsers(db)
      if (method === 'POST') return handleCreateUser(request, db, caller)
    } else {
      if (method === 'PUT')    return handleUpdateUser(request, db, caller, idOrSub)
      if (method === 'DELETE') return handleDeleteUser(db, caller, idOrSub)
    }
  }

  // /api/permissions
  if (resource === 'permissions') {
    if (method === 'GET')    return handleGetPermissions(db, caller)
    if (method === 'POST')   return handleSetPermission(request, db, caller)
    if (method === 'DELETE') return handleDeletePermission(request, db, caller)
  }

  // /api/projects
  if (resource === 'projects') {
    if (!idOrSub) {
      if (method === 'GET')  return handleListProjects(db, caller)
      if (method === 'POST') return handleCreateProject(request, db, caller)
    } else {
      if (method === 'GET')    return handleGet(db, 'tasks', idOrSub) // shouldn't happen but safe
      if (method === 'PUT')    return handleUpdateProject(request, db, idOrSub)
      if (method === 'DELETE') return handleDeleteProject(db, caller, idOrSub)
    }
  }

  // /api/portfolios
  if (resource === 'portfolios') {
    if (!idOrSub) {
      if (method === 'GET')  return handleListPortfolios(db)
      if (method === 'POST') return handleCreatePortfolio(request, db)
    } else {
      if (method === 'PUT')    return handleUpdatePortfolio(request, db, idOrSub)
      if (method === 'DELETE') return handleDeletePortfolio(db, idOrSub)
    }
  }

  // /api/{resource}?projectId=xxx  (project-scoped entities)
  const table = RESOURCE_TABLE[resource]
  if (table) {
    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId') ?? ''

    if (!idOrSub) {
      if (method === 'GET' && projectId) return handleList(db, table, caller, projectId)
      if (method === 'POST') return handleCreate(request, db, table, caller)
    } else {
      if (method === 'GET')    return handleGet(db, table, idOrSub)
      if (method === 'PUT')    return handleUpdate(request, db, table, idOrSub)
      if (method === 'DELETE') return handleDelete(db, table, idOrSub)
    }
  }

  return err('مسار غير موجود', 404)
}
