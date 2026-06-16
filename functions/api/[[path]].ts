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
  /** HMAC secret used to sign session cookies. Required for password auth. */
  SESSION_SECRET?: string
  /** Master admin email — provisions a primary admin login from environment config. */
  BOOTSTRAP_ADMIN_EMAIL?: string
  /** Master admin password — checked at login for BOOTSTRAP_ADMIN_EMAIL only. */
  BOOTSTRAP_ADMIN_PASSWORD?: string
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

// ── Crypto primitives (Web Crypto — native in the Workers runtime) ──
//
// We run our own authentication instead of trusting Cloudflare Access headers.
// Passwords are hashed with PBKDF2-SHA256; sessions are signed JWTs (HMAC-SHA256)
// stored in an httpOnly cookie; invite/reset tokens are random and stored hashed.

const SESSION_COOKIE = 'bosla_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days
const PBKDF2_ITERATIONS = 100_000

const textEncoder = new TextEncoder()

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function base64UrlEncode(input: string | Uint8Array): string {
  const b64 = typeof input === 'string' ? btoa(input) : bytesToBase64(input)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/')
  return atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
}

/** Constant-time comparison of two strings to avoid timing leaks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(input))
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Derive a PBKDF2-SHA256 hash. Returns base64 hash + base64 salt. */
async function hashPassword(password: string, saltBytes?: Uint8Array): Promise<{ hash: string; salt: string }> {
  const salt = saltBytes ?? crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) }
}

async function verifyPassword(password: string, expectedHash: string, salt: string): Promise<boolean> {
  try {
    const { hash } = await hashPassword(password, base64ToBytes(salt))
    return timingSafeEqual(hash, expectedHash)
  } catch {
    return false
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', textEncoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

/** Sign a session token (compact JWT, HS256) carrying the user's email. */
async function signSession(email: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(JSON.stringify({ sub: email, iat: now, exp: now + SESSION_TTL_SECONDS }))
  const data = `${header}.${payload}`
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, textEncoder.encode(data))
  return `${data}.${base64UrlEncode(new Uint8Array(sig))}`
}

/** Verify a session token and return the email, or null if invalid/expired. */
async function verifySession(token: string, secret: string): Promise<string | null> {
  try {
    const [header, payload, sig] = token.split('.')
    if (!header || !payload || !sig) return null
    const data = `${header}.${payload}`
    const key = await hmacKey(secret)
    const valid = await crypto.subtle.verify('HMAC', key, base64ToBytes(sig.replace(/-/g, '+').replace(/_/g, '/')), textEncoder.encode(data))
    if (!valid) return null
    const claims = JSON.parse(base64UrlDecode(payload)) as { sub?: string; exp?: number }
    if (!claims.sub || !claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null
    return claims.sub.toLowerCase()
  } catch {
    return null
  }
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('Cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return rest.join('=')
  }
  return null
}

function sessionCookie(value: string, maxAge: number): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

/** Resolve the signed-in email from the session cookie. */
async function resolveSessionEmail(req: Request, env: Env): Promise<string | null> {
  if (!env.SESSION_SECRET) return null
  const token = readCookie(req, SESSION_COOKIE)
  if (!token) return null
  return verifySession(token, env.SESSION_SECRET)
}

async function getAuthUser(req: Request, db: D1Database, env: Env): Promise<UserRow | null> {
  const normalized = await resolveSessionEmail(req, env)
  if (!normalized) return null
  return db
    .prepare('SELECT * FROM app_users WHERE lower(email) = ?')
    .bind(normalized)
    .first<UserRow>()
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

// Health check — verifies D1 connectivity and reports whether session auth is
// configured, so we can diagnose deployment wiring.
async function handleHealth(db: D1Database, req: Request, env: Env): Promise<Response> {
  let dbOk = false
  try {
    await db.prepare('SELECT 1').first()
    dbOk = true
  } catch { /* dbOk stays false */ }

  let userCount: number | null = null
  try {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM app_users').first<{ n: number }>()
    userCount = row?.n ?? 0
  } catch { /* leave null */ }

  // credentialCount > 0 means at least one account has a password. -1 signals a
  // missing user_credentials table (schema problem).
  let credentialCount: number | null = null
  try {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM user_credentials').first<{ n: number }>()
    credentialCount = row?.n ?? 0
  } catch { credentialCount = -1 }

  const email = await resolveSessionEmail(req, env)
  return json({
    ok: true,
    db: dbOk,
    sessionConfigured: !!env.SESSION_SECRET,
    emailConfigured: !!env.RESEND_API_KEY,
    masterAdminConfigured: !!(env.BOOTSTRAP_ADMIN_EMAIL && env.BOOTSTRAP_ADMIN_PASSWORD),
    authenticated: !!email,
    email,
    userCount,
    credentialCount,
    ts: new Date().toISOString(),
  })
}

// ── Self-hosted authentication ────────────────────────────
//
// Email + password auth that replaces Cloudflare Access. Admins invite users by
// email; the invitee sets their own password via a one-time link, then signs in
// with email + password. Sessions are signed cookies verified on every request.

interface LoginPayload { email?: string; password?: string }
interface SetPasswordPayload { token?: string; password?: string }
interface RequestResetPayload { email?: string }

/** POST /api/auth/login — verify password, issue a session cookie. */
async function handleLogin(req: Request, db: D1Database, env: Env): Promise<Response> {
  if (!env.SESSION_SECRET) return err('المصادقة غير مُعدّة على الخادم (SESSION_SECRET مفقود)', 500)
  const p = await req.json().catch(() => ({})) as LoginPayload
  const email = (p.email ?? '').trim().toLowerCase()
  const password = p.password ?? ''
  if (!email || !password) return err('البريد وكلمة المرور مطلوبان', 400)

  const generic = () => err('بريد أو كلمة مرور غير صحيحة', 401)

  // Master admin login: a primary admin credential provisioned from environment
  // config (BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD). Lets the owner sign
  // in without the email-based set-password flow. The password lives only in the
  // Cloudflare environment — never in the database or the repo — and is compared in
  // constant time. Bypasses user_credentials entirely for this one account.
  const bootEmail = (env.BOOTSTRAP_ADMIN_EMAIL ?? '').trim().toLowerCase()
  const bootPass = env.BOOTSTRAP_ADMIN_PASSWORD ?? ''
  if (bootEmail && bootPass && email === bootEmail && timingSafeEqual(password, bootPass)) {
    const now = new Date().toISOString()
    await db
      .prepare(`INSERT INTO app_users (id, name, email, avatar, system_role, is_finance, is_content, created_at)
                VALUES (?, ?, ?, NULL, 'admin', 1, 1, ?)
                ON CONFLICT(email) DO UPDATE SET system_role = 'admin'`)
      .bind(`admin-${crypto.randomUUID()}`, email.split('@')[0] || 'المسؤول', email, now)
      .run()
    const admin = await db.prepare('SELECT * FROM app_users WHERE lower(email) = ?').bind(email).first<UserRow>()
    const token = await signSession(email, env.SESSION_SECRET)
    return new Response(JSON.stringify({ ok: true, user: rowToCamel(admin as unknown as Record<string, unknown>) }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS),
      },
    })
  }

  const user = await db.prepare('SELECT * FROM app_users WHERE lower(email) = ?').bind(email).first<UserRow>()
  if (!user) return generic()
  const cred = await db
    .prepare('SELECT password_hash, password_salt FROM user_credentials WHERE email = ?')
    .bind(email)
    .first<{ password_hash: string; password_salt: string }>()
  if (!cred) return err('لم تُضبط كلمة المرور بعد — استخدم رابط الدعوة أو «نسيت كلمة المرور»', 403)

  const ok = await verifyPassword(password, cred.password_hash, cred.password_salt)
  if (!ok) return generic()

  const token = await signSession(email, env.SESSION_SECRET)
  return new Response(JSON.stringify({ ok: true, user: rowToCamel(user as unknown as Record<string, unknown>) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS),
    },
  })
}

/** POST /api/auth/set-password — redeem an invite/reset token, set password, sign in. */
async function handleSetPassword(req: Request, db: D1Database, env: Env): Promise<Response> {
  if (!env.SESSION_SECRET) return err('المصادقة غير مُعدّة على الخادم (SESSION_SECRET مفقود)', 500)
  const p = await req.json().catch(() => ({})) as SetPasswordPayload
  const rawToken = (p.token ?? '').trim()
  const password = p.password ?? ''
  if (!rawToken) return err('رابط غير صالح', 400)
  if (password.length < 8) return err('كلمة المرور يجب ألا تقل عن 8 أحرف', 400)

  const tokenHash = await sha256Hex(rawToken)
  const row = await db
    .prepare('SELECT email, kind, expires_at, consumed_at FROM auth_tokens WHERE token_hash = ?')
    .bind(tokenHash)
    .first<{ email: string; kind: string; expires_at: string; consumed_at: string | null }>()
  if (!row) return err('الرابط غير صالح', 400)
  if (row.consumed_at) return err('سبق استخدام هذا الرابط', 400)
  if (new Date(row.expires_at).getTime() < Date.now()) return err('انتهت صلاحية الرابط — اطلب رابطاً جديداً', 400)

  const email = row.email.toLowerCase()
  const now = new Date().toISOString()

  // Ensure a user record exists (invites create one upfront; this is a safety net).
  const user = await db.prepare('SELECT * FROM app_users WHERE lower(email) = ?').bind(email).first<UserRow>()
  if (!user) return err('لم يعد هذا الحساب موجوداً', 400)

  const { hash, salt } = await hashPassword(password)
  await db
    .prepare(`INSERT INTO user_credentials (email, password_hash, password_salt, updated_at)
              VALUES (?, ?, ?, ?)
              ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash,
                password_salt = excluded.password_salt, updated_at = excluded.updated_at`)
    .bind(email, hash, salt, now)
    .run()
  await db.prepare('UPDATE auth_tokens SET consumed_at = ? WHERE token_hash = ?').bind(now, tokenHash).run()

  const token = await signSession(email, env.SESSION_SECRET)
  return new Response(JSON.stringify({ ok: true, user: rowToCamel(user as unknown as Record<string, unknown>) }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': sessionCookie(token, SESSION_TTL_SECONDS),
    },
  })
}

/** Create + store a one-time token and return the raw value (for emailing). */
async function issueToken(db: D1Database, email: string, kind: 'invite' | 'reset', ttlMs: number): Promise<string> {
  const raw = bytesToBase64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c] as string))
  const tokenHash = await sha256Hex(raw)
  const now = Date.now()
  await db
    .prepare(`INSERT INTO auth_tokens (token_hash, email, kind, expires_at, created_at)
              VALUES (?, ?, ?, ?, ?)`)
    .bind(tokenHash, email.toLowerCase(), kind, new Date(now + ttlMs).toISOString(), new Date(now).toISOString())
    .run()
  return raw
}

/** Send a set-password / reset email via Resend. Returns whether it was sent. */
async function sendAuthLink(env: Env, email: string, name: string, token: string, kind: 'invite' | 'reset'): Promise<boolean> {
  const siteUrl = env.SITE_URL ?? 'https://boslaworks.com'
  const link = `${siteUrl}/set-password?token=${token}`
  if (!env.RESEND_API_KEY) return false
  const subject = kind === 'invite' ? 'دعوة للانضمام إلى بوصلة الأعمال' : 'إعادة تعيين كلمة المرور — بوصلة الأعمال'
  const intro = kind === 'invite'
    ? `تمت دعوتك للوصول إلى منصة بوصلة الأعمال. اضبط كلمة مرورك لإكمال إنشاء حسابك.`
    : `وصلنا طلب لإعادة تعيين كلمة مرور حسابك. اضغط الزر لاختيار كلمة مرور جديدة.`
  const cta = kind === 'invite' ? 'ضبط كلمة المرور والدخول' : 'إعادة تعيين كلمة المرور'
  const html = `<!doctype html>
<html dir="rtl" lang="ar"><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Tahoma,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px">
      <div style="width:48px;height:48px;border-radius:12px;background:#6366F1;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800">ب</div>
      <h1 style="margin:20px 0 8px;color:#0f172a;font-size:18px">مرحباً ${name || ''}</h1>
      <p style="margin:0;color:#475569;font-size:14px;line-height:1.7">${intro}</p>
      <a href="${link}" style="display:inline-block;margin-top:24px;background:#6366F1;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 22px;border-radius:10px">${cta}</a>
      <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;line-height:1.7">
        الحساب: ${email}. الرابط صالح لمدة ${kind === 'invite' ? '7 أيام' : 'ساعة واحدة'}. إن لم تطلب هذا تجاهل الرسالة.
      </p>
    </div>
  </div>
</body></html>`
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.INVITE_FROM ?? 'بوصلة الأعمال <onboarding@resend.dev>',
        to: [email],
        subject,
        html,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** POST /api/auth/request-reset — email a reset link. Always returns ok (no enumeration). */
async function handleRequestReset(req: Request, db: D1Database, env: Env): Promise<Response> {
  const p = await req.json().catch(() => ({})) as RequestResetPayload
  const email = (p.email ?? '').trim().toLowerCase()
  if (!email) return err('البريد مطلوب', 400)

  // Global bootstrap: no password exists for anyone yet. The very first email to
  // reach this endpoint (site still gated by Cloudflare Access) may claim an admin
  // account, so the platform has an owner.
  const credCount = await db.prepare('SELECT COUNT(*) AS n FROM user_credentials').first<{ n: number }>()
  const globalBootstrap = !credCount || credCount.n === 0

  let user = await db.prepare('SELECT * FROM app_users WHERE lower(email) = ?').bind(email).first<UserRow>()

  if (!user && globalBootstrap) {
    const now = new Date().toISOString()
    await db
      .prepare(`INSERT INTO app_users (id, name, email, avatar, system_role, is_finance, is_content, created_at)
                VALUES (?, ?, ?, NULL, 'admin', 1, 1, ?)
                ON CONFLICT(email) DO NOTHING`)
      .bind(`admin-${crypto.randomUUID()}`, email.split('@')[0] || 'المسؤول', email, now)
      .run()
    user = await db.prepare('SELECT * FROM app_users WHERE lower(email) = ?').bind(email).first<UserRow>()
  }

  // Unknown email → say ok without doing anything (no account enumeration).
  if (!user) return json({ ok: true })

  // "Activating" = the account exists but has never set a password (a pending
  // invite, or an admin added after bootstrap closed). For these accounts there
  // is no existing password to protect, so when we can't send email we return the
  // set-password link directly — this is what unblocks an admin who was created
  // after someone else already claimed the global-bootstrap window. Accounts that
  // ALREADY have a password get a normal reset and never have a link exposed
  // here (prevents takeover of active accounts). Safe in the CF Access window.
  const hasCredential = await db
    .prepare('SELECT 1 AS n FROM user_credentials WHERE email = ?')
    .bind(email)
    .first<{ n: number }>()
  const activating = !hasCredential

  const kind: 'invite' | 'reset' = activating ? 'invite' : 'reset'
  const ttl = activating ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
  const token = await issueToken(db, email, kind, ttl)
  const sent = await sendAuthLink(env, email, user.name, token, kind)

  if (activating && !sent) {
    const siteUrl = env.SITE_URL ?? 'https://boslaworks.com'
    return json({ ok: true, link: `${siteUrl}/set-password?token=${token}` })
  }
  return json({ ok: true })
}

/** POST /api/auth/logout — clear the session cookie. */
function handleLogout(): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': sessionCookie('', 0),
    },
  })
}

/** GET /api/auth/session — return the current user, or { authenticated: false }. */
async function handleSession(req: Request, db: D1Database, env: Env): Promise<Response> {
  const user = await getAuthUser(req, db, env)
  if (!user) return json({ authenticated: false })
  return json({ authenticated: true, user: rowToCamel(user as unknown as Record<string, unknown>) })
}

// ── Invitations ───────────────────────────────────────────
//
// POST /api/invite — notify a granted user by email. Sends automatically via
// Resend when RESEND_API_KEY is configured; otherwise responds with
// { sent: false, fallback: true } so the client can open a mailto draft.

interface InvitePayload {
  email: string
  name?: string
}

/**
 * POST /api/invite — provision a user and email them a set-password link.
 * Creates the app_users record if missing, issues a 7-day invite token, and
 * sends the branded set-password email via Resend. Idempotent: re-inviting an
 * existing user just sends a fresh link (useful for resending).
 */
async function handleInvite(req: Request, db: D1Database, env: Env, caller: UserRow): Promise<Response> {
  if (!isAdmin(caller)) return err('غير مصرح', 403)
  const p = await req.json().catch(() => ({})) as InvitePayload
  const email = (p.email ?? '').trim().toLowerCase()
  if (!email) return err('البريد مطلوب', 400)

  const existing = await db.prepare('SELECT * FROM app_users WHERE lower(email) = ?').bind(email).first<UserRow>()
  const name = (p.name ?? existing?.name ?? email.split('@')[0] ?? '').trim()
  if (!existing) {
    const now = new Date().toISOString()
    await db
      .prepare(`INSERT INTO app_users (id, name, email, avatar, system_role, is_finance, is_content, created_at)
                VALUES (?, ?, ?, NULL, 'member', 0, 0, ?)`)
      .bind(`user-${crypto.randomUUID()}`, name || email, email, now)
      .run()
  }

  // Always issue a fresh token and build the set-password link. When no email
  // provider is configured (or sending fails) we return the link so the admin
  // can copy it and share it manually. Safe to expose here: this route is
  // admin-only (isAdmin check above).
  const token = await issueToken(db, email, 'invite', 7 * 24 * 60 * 60 * 1000)
  const siteUrl = env.SITE_URL ?? 'https://boslaworks.com'
  const link = `${siteUrl}/set-password?token=${token}`

  if (!env.RESEND_API_KEY) {
    return json({ sent: false, fallback: true, reason: 'no-email-provider', link })
  }

  const sent = await sendAuthLink(env, email, name, token, 'invite')
  return json({ sent, fallback: !sent, link: sent ? undefined : link })
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
  | 'product_profiles' | 'contracts'

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
  contracts: 'order_index',
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
    // Admin-only tables
    if (table === 'contracts') return json([])
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
    if (table === 'contracts') return err('غير مصرح', 403)
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
    channels, content, portfolios, profiles, users, permissions, contracts,
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
    isAdm
      ? (async () => {
          try {
            const { results } = await db.prepare('SELECT * FROM contracts ORDER BY order_index').all()
            return results.map(rowToCamel)
          } catch { return [] }
        })()
      : Promise.resolve([]),
  ])

  // `seeded` reflects whether D1 holds any projects at all (unfiltered), so the
  // client can tell "first-time migration" apart from "this member sees nothing".
  const seededRow = await db.prepare('SELECT COUNT(*) AS n FROM projects').first<{ n: number }>()
  const seeded = (seededRow?.n ?? 0) > 0

  return json({
    seeded,
    projects, tasks, plans, phases, sprints, notes, docs, team, schedule,
    meetings, finance, packages, kpis, clients, metrics, experiments,
    channels, content, portfolios, profiles, contracts, users, permissions,
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
    profiles?: AnyObj[]; contracts?: AnyObj[]; users?: AnyObj[]; permissions?: AnyObj[]
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

  // Admin-only data
  if (isAdmin(caller)) {
    await upsertBatch(db, 'contracts',            body.contracts   ?? [])
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
  if (segments[0] === 'health') return handleHealth(db, request, env as Env)

  // Public authentication endpoints (no session required — these establish it)
  if (segments[0] === 'auth') {
    const sub = segments[1]
    if (sub === 'login'         && method === 'POST') return handleLogin(request, db, env as Env)
    if (sub === 'set-password'  && method === 'POST') return handleSetPassword(request, db, env as Env)
    if (sub === 'request-reset' && method === 'POST') return handleRequestReset(request, db, env as Env)
    if (sub === 'logout'        && method === 'POST') return handleLogout()
    if (sub === 'session'       && method === 'GET')  return handleSession(request, db, env as Env)
  }

  // All other routes require authentication
  const caller = await getAuthUser(request, db, env as Env)
  if (!caller) return err('غير مصرح — تسجيل الدخول مطلوب', 401)

  const [resource, idOrSub] = segments

  // /api/invite — provision a user + email a set-password link
  if (resource === 'invite') {
    if (method === 'POST') return handleInvite(request, db, env as Env, caller)
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
