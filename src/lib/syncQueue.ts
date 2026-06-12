/**
 * Durable write queue — guarantees local mutations reach Cloudflare D1.
 *
 * The previous sync layer fired create/update/delete requests and forgot them.
 * A refresh moments after an edit aborted the in-flight request before it ever
 * reached the server, so the change was lost locally on the next pull and never
 * seen by other accounts.
 *
 * This module persists every pending mutation to localStorage and drains it
 * with `keepalive: true` fetches (which survive page unload). An operation is
 * removed from the queue only after the server confirms it (HTTP 2xx); failures
 * stay queued and retry on the next drain (load, focus, interval, or unload).
 */

export type OpKind = 'create' | 'update' | 'delete'

export interface QueueOp {
  /** Stable de-dup key: `${resource}:${id}`. */
  key: string
  resource: string
  kind: OpKind
  id: string
  /** Request body for create/update. Omitted for delete. */
  data?: unknown
}

const STORAGE_KEY = 'mhwar-sync-queue'

let queue: QueueOp[] = load()
let draining: Promise<void> | null = null

function load(): QueueOp[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as QueueOp[]) : []
  } catch {
    return []
  }
}

function persist(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // Quota or serialization failure — keep the in-memory queue; it will retry.
  }
}

/**
 * Queue a mutation. Coalesces by `key` so rapid successive edits to the same
 * record collapse into a single pending write (the latest wins). A delete that
 * follows an un-synced create cancels both (the record never reached D1).
 */
export function enqueue(op: Omit<QueueOp, 'key'>): void {
  const key = `${op.resource}:${op.id}`
  const existing = queue.find((o) => o.key === key)

  if (existing) {
    if (op.kind === 'delete' && existing.kind === 'create') {
      // Created then deleted before either synced — drop both, nothing to send.
      queue = queue.filter((o) => o.key !== key)
      persist()
      return
    }
    if (op.kind === 'update' && existing.kind === 'create') {
      // Fold the update into the still-pending create so it stays a single POST.
      existing.data = op.data
      persist()
      void drain()
      return
    }
    // Replace the pending op in place (latest update / delete supersedes).
    existing.kind = op.kind
    existing.data = op.data
    persist()
    void drain()
    return
  }

  queue.push({ key, ...op })
  persist()
  void drain()
}

/** IDs of records with an un-confirmed write, for non-destructive hydration. */
export function pendingIds(): Set<string> {
  return new Set(queue.map((o) => o.id))
}

export function hasPending(): boolean {
  return queue.length > 0
}

async function sendOp(op: QueueOp): Promise<boolean> {
  let url: string
  let method: string
  let body: string | undefined

  if (op.resource === 'permissions') {
    // Permissions use a composite key carried in the body, not an id in the URL:
    // set → POST /api/permissions, remove → DELETE /api/permissions { userId, projectId }.
    url = '/api/permissions'
    method = op.kind === 'delete' ? 'DELETE' : 'POST'
    body = JSON.stringify(op.data)
  } else {
    const base = `/api/${op.resource}`
    url = op.kind === 'create' ? base : `${base}/${encodeURIComponent(op.id)}`
    method = op.kind === 'create' ? 'POST' : op.kind === 'update' ? 'PUT' : 'DELETE'
    body = op.kind === 'delete' ? undefined : JSON.stringify(op.data)
  }

  try {
    const res = await fetch(url, {
      method,
      credentials: 'include',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    })
    // 2xx = confirmed. 4xx (e.g. 403/404) is terminal too: retrying won't help and
    // would wedge the queue, so we drop it. 5xx/network errors throw and stay queued.
    if (res.ok) return true
    if (res.status >= 400 && res.status < 500) {
      console.warn(`[syncQueue] dropping ${method} ${url} → ${res.status}`)
      return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * Drain the queue in order. Resolves when the queue is empty or a send fails
 * (failed ops stay queued for the next drain). Concurrent calls share one pass.
 */
export function drain(): Promise<void> {
  if (draining) return draining

  draining = (async () => {
    while (queue.length > 0) {
      const op = queue[0]
      const ok = await sendOp(op)
      if (!ok) break // transient failure — stop, keep the op, retry later
      // Remove this op (guard against coalescing having mutated it meanwhile).
      queue = queue.filter((o) => o.key !== op.key)
      persist()
    }
  })().finally(() => { draining = null })

  return draining
}
