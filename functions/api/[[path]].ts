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

async function getAuthUser(req: Request, db: D1Database): Promise<UserRow | null> {
  const email = req.headers.get('CF-Access-Authenticated-User-Email')
  if (!email) return null
  return db
    .prepare('SELECT * FROM app_users WHERE lower(email) = ?')
    .bind(email.toLowerCase())
    .first<UserRow>()
}

function isAdmin(u: UserRow): boolean {
  return u.system_role === 'admin'
}

// ── Permission helpers ────────────────────────────────────

interface PermRow {
  user_id: string
  project_id: string
  access: 'all' | 'custom' | 'none'
  denied_tools: string // JSON string
}

async function canAccessProject(db: D1Database, userId: string, projectId: string): Promise<boolean> {
  const perm = await db
    .prepare('SELECT access FROM project_permissions WHERE user_id = ? AND project_id = ?')
    .bind(userId, projectId)
    .first<{ access: string }>()
  if (!perm) return true
  return perm.access !== 'none'
}

// ── Route handlers ────────────────────────────────────────

// Health check — also verifies D1 connectivity
async function handleHealth(db: D1Database): Promise<Response> {
  try {
    await db.prepare('SELECT 1').first()
    return json({ ok: true, db: true, ts: new Date().toISOString() })
  } catch {
    return json({ ok: true, db: false, ts: new Date().toISOString() })
  }
}

// ── Users ─────────────────────────────────────────────────

async function handleGetUsers(db: D1Database): Promise<Response> {
  const { results } = await db.prepare('SELECT * FROM app_users ORDER BY created_at ASC').all<UserRow>()
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
  const { results } = await db.prepare('SELECT * FROM project_permissions').all<PermRow>()
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
    channels, content, portfolios, users, permissions,
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
    isAdm
      ? db.prepare('SELECT * FROM app_users ORDER BY created_at').all().then((r) => r.results.map(rowToCamel))
      : Promise.resolve([]),
    isAdm
      ? db.prepare('SELECT * FROM project_permissions').all().then((r) => r.results.map(rowToCamel))
      : Promise.resolve([]),
  ])

  return json({
    projects, tasks, plans, phases, sprints, notes, docs, team, schedule,
    meetings, finance, packages, kpis, clients, metrics, experiments,
    channels, content, portfolios, users, permissions,
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
    users?: AnyObj[]; permissions?: AnyObj[]
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

  // Users & permissions: only admin-provided data
  if (isAdmin(caller)) {
    await upsertBatch(db, 'app_users',            body.users       ?? [])
    await upsertBatch(db, 'project_permissions',  body.permissions ?? [])
  }

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
  if (segments[0] === 'health') return handleHealth(db)

  // All other routes require authentication
  const caller = await getAuthUser(request, db)
  if (!caller) return err('غير مصرح — تسجيل الدخول مطلوب', 401)

  const [resource, idOrSub] = segments

  // /api/sync
  if (resource === 'sync') {
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
