'use client'
import { useState, useEffect } from 'react'
import {
  UserCog, ChevronDown, Plus, Pencil, Trash2, Check, X,
  ShieldCheck, ShieldOff, Eye, EyeOff, Settings2, BadgeCheck, LogOut, Send, Mail, Link2,
  UserCheck, Globe, ExternalLink, Compass,
} from 'lucide-react'
import { usePermissionStore } from '@/store/permissionStore'
import { useProjectStore } from '@/store/store'
import { TOOLS } from '@/lib/tool-registry'
import { CF_LOGOUT_URL } from '@/lib/cfAccess'
import { sendInvite, apiAccess } from '@/lib/api'
import { buildInviteUrl } from '@/lib/invite-token'
import type { AppUser, ProjectPermission } from '@/types'

// ── Helpers ───────────────────────────────────────────────

function SectionHeader({ icon, title, tint }: { icon: React.ReactNode; title: string; tint: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}
      >
        {icon}
      </div>
      <h2 className="text-sm font-bold" style={{ color: 'var(--fg-1)' }}>{title}</h2>
    </div>
  )
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      className={`axis-switch ${on ? 'is-on' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      aria-checked={on}
      role="switch"
    />
  )
}

function Avatar({ user }: { user: Pick<AppUser, 'name' | 'avatar'> }) {
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: 'var(--iris-500)', color: '#fff' }}
    >
      {user.name.charAt(0)}
    </div>
  )
}

// ── Blank form state ──────────────────────────────────────

const BLANK: Omit<AppUser, 'id' | 'createdAt'> = {
  name: '',
  email: '',
  systemRole: 'member',
  isFinance: false,
  isContent: true,
}

// ── Sub-components ────────────────────────────────────────

function ActiveUserPicker({ hydrated }: { hydrated: boolean }) {
  const { users, activeUserId, setActiveUser, signedInEmail } = usePermissionStore()
  const activeUser = users.find((u) => u.id === activeUserId) ?? null
  const signedInUser = signedInEmail
    ? users.find((u) => u.email?.toLowerCase() === signedInEmail) ?? null
    : null
  const isAdmin = signedInUser?.systemRole === 'admin'

  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<UserCog size={15} strokeWidth={1.5} />} title="الجلسة النشطة" tint="var(--iris-500)" />

      {/* Cloudflare Access — verified identity */}
      {signedInEmail ? (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'color-mix(in srgb, var(--success-500) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--success-500) 25%, transparent)' }}
        >
          {signedInUser ? <Avatar user={signedInUser} /> : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--iris-500)' }}>
              {signedInEmail.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--fg-1)' }}>
                {signedInUser?.name ?? 'مستخدم غير مُسنَد'}
              </p>
              <BadgeCheck size={14} style={{ color: 'var(--success-500)' }} />
            </div>
            <p className="text-xs truncate" style={{ color: 'var(--fg-3)' }} dir="ltr">{signedInEmail}</p>
          </div>
          <a
            href={CF_LOGOUT_URL}
            className="axis-btn axis-btn--ghost axis-btn--sm shrink-0"
            title="تسجيل الخروج"
          >
            <LogOut size={13} />
            خروج
          </a>
        </div>
      ) : (
        <div
          className="rounded-xl px-4 py-3 text-xs"
          style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--fg-3)' }}
        >
          لا توجد جلسة موثّقة عبر Cloudflare Access — يعمل الوضع المحلي دون قيود. عند
          النشر خلف Cloudflare، يُربط المستخدم تلقائياً ببريده.
        </div>
      )}

      {/* Admin-only impersonation: preview the app as any user. */}
      {(isAdmin || !signedInEmail) && (
        <div className="flex items-center justify-between gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>معاينة كمستخدم</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
              للمسؤول — جرّب واجهة أي مستخدم وصلاحياته
            </p>
          </div>
          <div className="relative">
            <select
              className="text-sm rounded-lg border px-3 py-2 pe-8 appearance-none cursor-pointer"
              style={{
                background: 'var(--color-surface-raised)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--fg-1)',
                minWidth: 160,
              }}
              value={activeUserId ?? ''}
              onChange={(e) => setActiveUser(e.target.value || null)}
              disabled={!hydrated}
            >
              <option value="">بدون تقييد (وصول كامل)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.systemRole === 'admin' ? '(مدير)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute top-1/2 -translate-y-1/2 end-2.5 pointer-events-none" style={{ color: 'var(--fg-3)' }} />
          </div>
        </div>
      )}

      {activeUser && activeUser.id !== signedInUser?.id && (
        <div
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
          style={{ background: 'color-mix(in srgb, var(--warning-500) 10%, transparent)' }}
        >
          <Avatar user={activeUser} />
          <span style={{ color: 'var(--fg-2)' }}>
            تعاين الآن كـ {activeUser.name} —{' '}
            {activeUser.systemRole === 'admin'
              ? 'مدير (وصول كامل)'
              : `عضو · المالية: ${activeUser.isFinance ? 'مسموح' : 'محجوب'} · المحتوى: ${activeUser.isContent ? 'مسموح' : 'محجوب'}`}
          </span>
        </div>
      )}
    </div>
  )
}

// ── User form (add / edit) ────────────────────────────────

interface UserFormProps {
  initial?: Partial<Omit<AppUser, 'id' | 'createdAt'>>
  onSave: (data: Omit<AppUser, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

function UserForm({ initial, onSave, onCancel }: UserFormProps) {
  const [form, setForm] = useState<Omit<AppUser, 'id' | 'createdAt'>>({ ...BLANK, ...initial })
  const set = (k: keyof typeof form, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div
      className="rounded-xl p-4 space-y-3 mt-2"
      style={{ background: 'var(--color-surface-base)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--fg-2)' }}>الاسم*</label>
          <input
            className="axis-input w-full text-sm"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="اسم المستخدم"
          />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--fg-2)' }}>البريد</label>
          <input
            className="axis-input w-full text-sm"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            placeholder="email@example.com"
            dir="ltr"
          />
          <p className="text-[11px] mt-1" style={{ color: 'var(--fg-3)' }}>
            يُربط به الدخول عبر Cloudflare — استخدم نفس بريد دعوة العضو
          </p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="radio"
            name="role"
            checked={form.systemRole === 'admin'}
            onChange={() => set('systemRole', 'admin')}
          />
          <span className="text-sm" style={{ color: 'var(--fg-1)' }}>مدير النظام</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="radio"
            name="role"
            checked={form.systemRole === 'member'}
            onChange={() => set('systemRole', 'member')}
          />
          <span className="text-sm" style={{ color: 'var(--fg-1)' }}>عضو</span>
        </label>
      </div>
      {form.systemRole === 'member' && (
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Toggle on={form.isFinance} onChange={(v) => set('isFinance', v)} />
            <span className="text-sm" style={{ color: 'var(--fg-1)' }}>وصول للمالية</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Toggle on={form.isContent} onChange={(v) => set('isContent', v)} />
            <span className="text-sm" style={{ color: 'var(--fg-1)' }}>وصول للمحتوى</span>
          </label>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="axis-btn axis-btn--ghost axis-btn--sm"
        >
          <X size={13} />
          إلغاء
        </button>
        <button
          type="button"
          disabled={!form.name.trim()}
          onClick={() => onSave(form)}
          className="axis-btn axis-btn--primary axis-btn--sm"
        >
          <Check size={13} />
          حفظ
        </button>
      </div>
    </div>
  )
}

// ── Invite button (emails the user their access) ──────────

function InviteButton({ user }: { user: AppUser }) {
  const inviterName = usePermissionStore((s) => s.getSignedInUser()?.name)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'mailto'>('idle')

  const invite = async () => {
    if (!user.email) return
    setState('sending')
    const result = await sendInvite({ email: user.email, name: user.name, inviterName })
    setState(result === 'sent' ? 'sent' : result === 'mailto' ? 'mailto' : 'idle')
    if (result !== 'failed') setTimeout(() => setState('idle'), 3000)
  }

  return (
    <button
      type="button"
      onClick={invite}
      disabled={state === 'sending'}
      className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
      title="إرسال دعوة بالبريد"
    >
      {state === 'sent' ? <Check size={13} style={{ color: 'var(--success-500)' }} />
        : state === 'mailto' ? <Mail size={13} style={{ color: 'var(--iris-500)' }} />
        : <Send size={13} style={{ color: 'var(--iris-500)' }} />}
    </button>
  )
}

// ── Copy invite link button ───────────────────────────────

function CopyInviteButton({ user, userPermissions }: { user: AppUser; userPermissions: ProjectPermission[] }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const url = buildInviteUrl({ user, perms: userPermissions })
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
      title="نسخ رابط الدعوة"
    >
      {copied
        ? <Check size={13} style={{ color: 'var(--success-500)' }} />
        : <Link2 size={13} style={{ color: 'var(--iris-500)' }} />}
    </button>
  )
}

// ── Grant Cloudflare Access button ───────────────────────

function GrantAccessButton({ user, userPermissions }: { user: AppUser; userPermissions: ProjectPermission[] }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'noApi' | 'err'>('idle')

  const grant = async () => {
    if (!user.email) return
    setState('loading')
    const result = await apiAccess.grant({
      userId: user.id,
      name: user.name,
      email: user.email,
      systemRole: user.systemRole,
      isFinance: user.isFinance,
      isContent: user.isContent,
      createdAt: user.createdAt,
      permissions: userPermissions.map((p) => ({
        userId: p.userId,
        projectId: p.projectId,
        access: p.access,
        deniedTools: p.deniedTools,
      })),
    })
    if (!result) { setState('err'); setTimeout(() => setState('idle'), 3000); return }
    if (!result.cfConfigured) { setState('noApi'); setTimeout(() => setState('idle'), 4000); return }
    setState('ok')
    setTimeout(() => setState('idle'), 3000)
  }

  const label =
    state === 'loading' ? '...' :
    state === 'ok'      ? 'تم الإضافة' :
    state === 'noApi'   ? 'تم (بدون CF)' :
    state === 'err'     ? 'فشل' : 'منح الوصول'

  const tint =
    state === 'ok'    ? 'var(--success-500)' :
    state === 'err'   ? 'var(--danger-500)'  :
    state === 'noApi' ? 'var(--warning-500)' : 'var(--iris-500)'

  return (
    <button
      type="button"
      onClick={grant}
      disabled={state === 'loading' || !user.email}
      title={!user.email ? 'أضف البريد أولاً' : 'منح صلاحية الوصول وإضافة لـ Cloudflare Access'}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors disabled:opacity-40"
      style={{ color: tint, border: `1px solid color-mix(in srgb, ${tint} 30%, transparent)` }}
    >
      <UserCheck size={12} />
      {label}
    </button>
  )
}

// ── Google SSO setup card ─────────────────────────────────

function GoogleSsoCard() {
  const signedInEmail = usePermissionStore((s) => s.signedInEmail)
  const isAdmin = usePermissionStore((s) => {
    const u = s.signedInEmail ? s.users.find((x) => x.email?.toLowerCase() === s.signedInEmail) : null
    return !u || u.systemRole === 'admin'
  })
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [redirectUri, setRedirectUri] = useState('')
  const [errMsg, setErrMsg] = useState('')

  if (!isAdmin) return null

  const setup = async () => {
    if (!clientId.trim() || !clientSecret.trim()) return
    setState('loading')
    setErrMsg('')
    const { data, error } = await apiAccess.setupGoogleIdp(clientId.trim(), clientSecret.trim())
    if (error || !data) { setErrMsg(error ?? 'خطأ غير معروف'); setState('err'); return }
    if (data.alreadyExists) { setState('ok'); setRedirectUri(''); return }
    if (data.redirectUri) setRedirectUri(data.redirectUri)
    setState('ok')
  }

  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Globe size={15} strokeWidth={1.5} />} title="تسجيل الدخول بـ Google" tint="#4285F4" />

      {state === 'ok' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success-500)' }}>
            <Check size={15} />
            تم إعداد Google كمزوّد هوية في Cloudflare Access
          </div>
          {redirectUri && (
            <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--color-surface-base)', border: '1px solid var(--border-subtle)' }}>
              <p className="font-medium mb-1" style={{ color: 'var(--fg-2)' }}>Authorized redirect URI (أضفه في Google Console):</p>
              <p className="font-mono break-all" style={{ color: 'var(--iris-500)' }} dir="ltr">{redirectUri}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--fg-3)' }}>
            أنشئ OAuth 2.0 Client ID من Google Cloud Console ثم الصق البيانات هنا.
          </p>
          <div className="space-y-2">
            <input
              className="axis-input w-full text-sm font-mono"
              placeholder="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              dir="ltr"
            />
            <input
              className="axis-input w-full text-sm font-mono"
              placeholder="Client Secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              dir="ltr"
            />
          </div>
          {state === 'err' && (
            <p className="text-xs font-mono break-all" dir="ltr" style={{ color: 'var(--danger-500)' }}>
              {errMsg}
            </p>
          )}
          <button
            type="button"
            onClick={setup}
            disabled={state === 'loading' || !clientId.trim() || !clientSecret.trim()}
            className="axis-btn axis-btn--primary axis-btn--sm"
          >
            {state === 'loading' ? 'جارٍ الإعداد...' : 'إعداد Google SSO'}
          </button>
          <p className="text-[11px]" style={{ color: 'var(--fg-3)' }}>
            يتطلب إعداد env var: <span className="font-mono" dir="ltr">CLOUDFLARE_API_TOKEN</span> في Cloudflare Pages.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Custom login page card ────────────────────────────────

function CustomLoginCard() {
  const isAdmin = usePermissionStore((s) => {
    const u = s.signedInEmail ? s.users.find((x) => x.email?.toLowerCase() === s.signedInEmail) : null
    return !u || u.systemRole === 'admin'
  })
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')
  const [results, setResults] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [errMsg, setErrMsg] = useState('')
  const [googleRedirectUri, setGoogleRedirectUri] = useState('')

  if (!isAdmin) return null

  const activate = async () => {
    setState('loading')
    setErrMsg('')
    const { data, error } = await apiAccess.setupCustomLogin()
    if (error || !data) { setErrMsg(error ?? 'خطأ غير معروف'); setState('err'); return }
    setResults(data.results ?? [])
    setWarnings(data.warnings ?? [])
    if (data.googleRedirectUri) setGoogleRedirectUri(data.googleRedirectUri)
    setState('ok')
  }

  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Compass size={15} strokeWidth={1.5} />} title="صفحة تسجيل الدخول" tint="var(--iris-500)" />

      {state === 'ok' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success-500)' }}>
            <Check size={15} />
            تم تفعيل صفحة تسجيل الدخول المخصصة
          </div>
          {results.length > 0 && (
            <ul className="text-xs space-y-1" style={{ color: 'var(--fg-2)' }}>
              {results.map((r, i) => <li key={i}>✓ {r}</li>)}
            </ul>
          )}
          {googleRedirectUri && (
            <div className="rounded-lg p-3 text-xs space-y-2" style={{ background: 'var(--color-surface-base)', border: '1px solid var(--border-subtle)' }}>
              <p className="font-medium" style={{ color: 'var(--fg-1)' }}>
                تحقق من Google Console — الرابط المُسموح به يجب أن يكون:
              </p>
              <p className="font-mono break-all select-all" dir="ltr" style={{ color: 'var(--iris-500)' }}>
                {googleRedirectUri}
              </p>
              <p style={{ color: 'var(--fg-3)' }}>
                Google Console ← بيانات اعتماد ← OAuth ← URIs إعادة التوجيه المُصرَّح بها
              </p>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: 'var(--color-surface-base)', border: '1px solid var(--warning-500)' }}>
              <p className="font-medium" style={{ color: 'var(--warning-500)' }}>ملاحظات تتطلب تدخلاً:</p>
              {warnings.map((w, i) => <p key={i} style={{ color: 'var(--fg-2)' }}>{w}</p>)}
            </div>
          )}
          <a
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
            className="axis-btn axis-btn--iris-soft axis-btn--sm inline-flex"
          >
            <ExternalLink size={13} />
            معاينة صفحة تسجيل الدخول
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs" style={{ color: 'var(--fg-3)' }}>
            استبدل صفحة Cloudflare الافتراضية بصفحة مُصمَّمة تعكس هوية المنصة. تُفعَّل آلياً عبر CF API.
          </p>
          {state === 'err' && (
            <p className="text-xs font-mono break-all" dir="ltr" style={{ color: 'var(--danger-500)' }}>
              {errMsg}
            </p>
          )}
          <button
            type="button"
            onClick={activate}
            disabled={state === 'loading'}
            className="axis-btn axis-btn--primary axis-btn--sm"
          >
            {state === 'loading' ? 'جارٍ التفعيل...' : 'تفعيل صفحة تسجيل الدخول'}
          </button>
          <p className="text-[11px]" style={{ color: 'var(--fg-3)' }}>
            يتطلب <span className="font-mono" dir="ltr">CLOUDFLARE_API_TOKEN</span> في Cloudflare Pages.
          </p>
        </div>
      )}
    </div>
  )
}

// ── User list card ────────────────────────────────────────

function UserListCard() {
  const { users, permissions, addUser, updateUser, deleteUser, signedInEmail } = usePermissionStore()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAdd = (data: Omit<AppUser, 'id' | 'createdAt'>) => {
    addUser(data)
    setAdding(false)
  }

  const handleUpdate = (id: string, data: Omit<AppUser, 'id' | 'createdAt'>) => {
    updateUser(id, data)
    setEditingId(null)
  }

  const handleDelete = (u: AppUser) => {
    if (u.id === 'admin-default') return
    if (!confirm(`هل تريد حذف المستخدم "${u.name}"؟`)) return
    deleteUser(u.id)
  }

  return (
    <div className="axis-card p-6">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader icon={<ShieldCheck size={15} strokeWidth={1.5} />} title="المستخدمون" tint="var(--success-500)" />
        <button
          type="button"
          onClick={() => { setAdding(true); setEditingId(null) }}
          className="axis-btn axis-btn--iris-soft axis-btn--sm"
        >
          <Plus size={13} />
          إضافة مستخدم
        </button>
      </div>

      <div className="space-y-px">
        {users.map((u, i) => (
          <div key={u.id}>
            {editingId === u.id ? (
              <UserForm
                initial={u}
                onSave={(data) => handleUpdate(u.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                className="flex items-center gap-3 py-3"
                style={i < users.length - 1 ? { borderBottom: '1px solid var(--border-subtle)' } : undefined}
              >
                <Avatar user={u} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)' }}>{u.name}</p>
                    {!!u.email && u.email.toLowerCase() === signedInEmail && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                        style={{ background: 'color-mix(in srgb, var(--success-500) 16%, transparent)', color: 'var(--success-500)' }}
                      >
                        أنت
                      </span>
                    )}
                  </div>
                  {u.email && (
                    <p className="text-xs truncate" style={{ color: 'var(--fg-3)' }} dir="ltr">{u.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: u.systemRole === 'admin' ? 'color-mix(in srgb, var(--iris-500) 14%, transparent)' : 'color-mix(in srgb, var(--fg-3) 12%, transparent)',
                      color: u.systemRole === 'admin' ? 'var(--iris-500)' : 'var(--fg-2)',
                    }}
                  >
                    {u.systemRole === 'admin' ? 'مدير' : 'عضو'}
                  </span>
                  {u.systemRole === 'member' && (
                    <>
                      <span
                        title={u.isFinance ? 'وصول للمالية' : 'محجوب عن المالية'}
                        style={{ color: u.isFinance ? 'var(--success-500)' : 'var(--fg-3)' }}
                      >
                        {u.isFinance ? <Eye size={13} /> : <EyeOff size={13} />}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--fg-3)' }}>مالية</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!!u.email && <GrantAccessButton user={u} userPermissions={permissions.filter((p) => p.userId === u.id)} />}
                  <CopyInviteButton user={u} userPermissions={permissions.filter((p) => p.userId === u.id)} />
                  {u.systemRole === 'member' && !!u.email && <InviteButton user={u} />}
                  <button
                    type="button"
                    onClick={() => { setEditingId(u.id); setAdding(false) }}
                    className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="تعديل"
                  >
                    <Pencil size={13} style={{ color: 'var(--fg-3)' }} />
                  </button>
                  {u.id !== 'admin-default' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={13} style={{ color: 'var(--danger-500)' }} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {adding && (
        <UserForm onSave={handleAdd} onCancel={() => setAdding(false)} />
      )}
    </div>
  )
}

// ── Tool checkbox grid for a project ─────────────────────

interface ToolGridProps {
  projectTools: string[]
  user: AppUser
  perm: ProjectPermission | undefined
  onToggleTool: (toolId: string, denied: boolean) => void
}

function ToolCheckboxGrid({ projectTools, user, perm, onToggleTool }: ToolGridProps) {
  const deniedTools = perm?.deniedTools ?? []

  return (
    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 ps-2">
      {projectTools.map((toolId) => {
        const def = TOOLS.find((t) => t.id === toolId)
        if (!def) return null

        const isFinanceTool = toolId === 'finance'
        const isContentTool = toolId === 'content' || toolId === 'clients'
        const blockedByGlobal =
          (isFinanceTool && !user.isFinance) ||
          (isContentTool && !user.isContent)

        const isDenied = blockedByGlobal || deniedTools.includes(toolId)
        const isCore = def.core

        const tooltipText = blockedByGlobal
          ? isFinanceTool
            ? 'محجوب — المستخدم ليس مالياً'
            : 'محجوب — المستخدم ليس محتوى'
          : isCore
          ? 'تبويب أساسي — لا يمكن إخفاؤه'
          : undefined

        return (
          <label
            key={toolId}
            title={tooltipText}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors ${
              blockedByGlobal || isCore ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'
            }`}
          >
            <input
              type="checkbox"
              checked={!isDenied}
              disabled={blockedByGlobal || isCore}
              onChange={(e) => {
                if (blockedByGlobal || isCore) return
                onToggleTool(toolId, !e.target.checked)
              }}
              className="rounded"
            />
            <span className="text-xs" style={{ color: 'var(--fg-2)' }}>
              {def.label}
            </span>
            {blockedByGlobal && (
              <ShieldOff size={11} style={{ color: 'var(--danger-500)' }} />
            )}
          </label>
        )
      })}
    </div>
  )
}

// ── Project permission row ────────────────────────────────

interface ProjectPermRowProps {
  projectId: string
  projectName: string
  projectTools: string[]
  user: AppUser
  perm: ProjectPermission | undefined
  onSetPermission: (perm: Partial<Pick<ProjectPermission, 'access' | 'deniedTools'>>) => void
}

function ProjectPermRow({ projectId, projectName, projectTools, user, perm, onSetPermission }: ProjectPermRowProps) {
  const access = perm?.access ?? 'all'
  const [expanded, setExpanded] = useState(false)
  const isAdmin = user.systemRole === 'admin'

  const handleAccess = (val: ProjectPermission['access']) => {
    onSetPermission({ access: val, deniedTools: perm?.deniedTools ?? [] })
    if (val === 'custom') setExpanded(true)
  }

  const handleToggleTool = (toolId: string, denied: boolean) => {
    const current = perm?.deniedTools ?? []
    const next = denied ? [...current, toolId] : current.filter((t) => t !== toolId)
    onSetPermission({ access: 'custom', deniedTools: next })
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--color-surface-raised)' }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)' }}>{projectName}</p>
          {isAdmin && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--success-500)' }}>وصول كامل (مدير)</p>
          )}
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-1">
            {(['all', 'custom', 'none'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAccess(opt)}
                className="text-xs px-2.5 py-1 rounded-md transition-colors font-medium"
                style={{
                  background:
                    access === opt
                      ? opt === 'none'
                        ? 'color-mix(in srgb, var(--danger-500) 18%, transparent)'
                        : opt === 'all'
                        ? 'color-mix(in srgb, var(--success-500) 18%, transparent)'
                        : 'color-mix(in srgb, var(--iris-500) 18%, transparent)'
                      : 'color-mix(in srgb, var(--fg-3) 10%, transparent)',
                  color:
                    access === opt
                      ? opt === 'none'
                        ? 'var(--danger-500)'
                        : opt === 'all'
                        ? 'var(--success-500)'
                        : 'var(--iris-500)'
                      : 'var(--fg-3)',
                }}
              >
                {opt === 'all' ? 'كامل' : opt === 'custom' ? 'مخصص' : 'مخفي'}
              </button>
            ))}
            {access === 'custom' && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Settings2 size={13} style={{ color: 'var(--fg-3)' }} />
              </button>
            )}
          </div>
        )}
      </div>

      {!isAdmin && access === 'custom' && expanded && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--fg-3)' }}>
            التبويبات المسموحة لهذا المستخدم في هذا المشروع:
          </p>
          <ToolCheckboxGrid
            projectTools={projectTools}
            user={user}
            perm={perm}
            onToggleTool={handleToggleTool}
          />
        </div>
      )}
    </div>
  )
}

// ── Project permissions card ──────────────────────────────

function ProjectPermissionsCard({ hydrated }: { hydrated: boolean }) {
  const { users, permissions, setPermission } = usePermissionStore()
  const { projects } = useProjectStore()
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  useEffect(() => {
    if (!selectedUserId && users.length > 0) setSelectedUserId(users[0].id)
  }, [users, selectedUserId])

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Settings2 size={15} strokeWidth={1.5} />} title="الصلاحيات بالمشاريع" tint="var(--warning-500)" />

      {!hydrated && (
        <div className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--color-surface-raised)' }} />
      )}

      {hydrated && (
        <>
          {/* User tabs */}
          <div
            className="flex gap-1 flex-wrap mb-4 rounded-xl p-1"
            style={{ background: 'var(--color-surface-base)' }}
          >
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUserId(u.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: selectedUserId === u.id ? 'var(--color-surface-raised)' : 'transparent',
                  color: selectedUserId === u.id ? 'var(--fg-1)' : 'var(--fg-3)',
                  boxShadow: selectedUserId === u.id ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <Avatar user={u} />
                {u.name}
              </button>
            ))}
          </div>

          {selectedUser && projects.length > 0 && (
            <div className="space-y-2">
              {projects.map((proj) => {
                const perm = permissions.find(
                  (p) => p.userId === selectedUser.id && p.projectId === proj.id
                )
                return (
                  <ProjectPermRow
                    key={proj.id}
                    projectId={proj.id}
                    projectName={proj.name}
                    projectTools={proj.tools}
                    user={selectedUser}
                    perm={perm}
                    onSetPermission={(update) => setPermission(selectedUser.id, proj.id, update)}
                  />
                )
              })}
            </div>
          )}

          {projects.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: 'var(--fg-3)' }}>
              لا توجد مشاريع بعد
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────

export default function PermissionsSection() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    usePermissionStore.persist.rehydrate()
    setHydrated(true)
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <ActiveUserPicker hydrated={hydrated} />
        <UserListCard />
      </div>
      <ProjectPermissionsCard hydrated={hydrated} />
      <GoogleSsoCard />
      <CustomLoginCard />
    </div>
  )
}
