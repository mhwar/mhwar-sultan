'use client'
import { useEffect, useState } from 'react'
import { Compass, LogOut, RefreshCw, ShieldAlert } from 'lucide-react'
import { usePermissionStore } from '@/store/permissionStore'
import { fetchCfIdentity, CF_LOGOUT_URL } from '@/lib/cfAccess'
import { apiGetMe } from '@/lib/api'

/**
 * Resolves the Cloudflare Access identity on load and binds it to an in-app
 * user profile. Visitors who are authenticated at the edge but not yet
 * provisioned in-app see a branded "access pending" screen instead of the app.
 *
 * Outside Cloudflare (local/dev) the identity is null and the app renders
 * normally with its unrestricted local behaviour.
 */
export default function IdentityGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'resolving' | 'ok' | 'pending'>('resolving')
  const signedInEmail = usePermissionStore((s) => s.signedInEmail)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      usePermissionStore.persist.rehydrate()
      const identity = await fetchCfIdentity()
      if (cancelled) return
      if (!identity) {
        setStatus('ok')
        return
      }

      // Fetch own user record from D1 so bindIdentity can find it for member accounts.
      // Admins already have their record in the full sync snapshot; this covers members.
      const me = await apiGetMe()
      if (me && !cancelled) {
        usePermissionStore.setState((s) => {
          const exists = s.users.some((u) => u.id === me.id)
          const users = exists
            ? s.users.map((u) => (u.id === me.id ? { ...u, ...me } : u))
            : [...s.users, me]
          return { users }
        })
      }

      if (cancelled) return
      const result = usePermissionStore.getState().bindIdentity(identity.email, identity.name)
      setStatus(result === 'unprovisioned' ? 'pending' : 'ok')
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'pending') {
    return <AccessPending email={signedInEmail} />
  }

  // During resolution and when authorised, render the app as usual.
  return <>{children}</>
}

function AccessPending({ email }: { email: string | null }) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center p-6 text-center"
      style={{ background: 'var(--color-surface-base)' }}
    >
      <div className="axis-card max-w-md w-full p-8 flex flex-col items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white"
          style={{
            background: 'linear-gradient(135deg, var(--iris-500) 0%, oklch(0.50 0.22 280) 100%)',
            boxShadow: '0 4px 16px oklch(0.62 0.21 275 / 0.35)',
          }}
        >
          <Compass size={30} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2" style={{ color: 'var(--warning-500)' }}>
            <ShieldAlert size={16} />
            <span className="text-sm font-bold">في انتظار منح الصلاحية</span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--fg-1)' }}>
            بوصلة الأعمال
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--fg-3)' }}>
            تم تسجيل دخولك بنجاح، لكن لم يُسنِد إليك المسؤول ملفاً بعد. تواصل مع
            مسؤول المنصة لإضافتك وتحديد صلاحياتك.
          </p>
        </div>

        {email && (
          <div
            className="text-xs rounded-lg px-3 py-2 w-full"
            style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--border-subtle)', color: 'var(--fg-2)' }}
            dir="ltr"
          >
            {email}
          </div>
        )}

        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="axis-btn axis-btn--iris-soft axis-btn--sm flex-1"
          >
            <RefreshCw size={13} />
            تحديث
          </button>
          <a href={CF_LOGOUT_URL} className="axis-btn axis-btn--ghost axis-btn--sm flex-1">
            <LogOut size={13} />
            تبديل الحساب
          </a>
        </div>
      </div>
    </div>
  )
}
