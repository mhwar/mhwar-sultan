'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Compass, LogOut, RefreshCw, ShieldAlert } from 'lucide-react'
import { usePermissionStore } from '@/store/permissionStore'
import { getSession, logout } from '@/lib/auth'

/** Pages reachable without a session (the auth flow itself). */
const PUBLIC_PATHS = ['/login', '/set-password']

/**
 * Resolves the signed-in identity from our own session cookie and binds it to an
 * in-app user profile. Unauthenticated visitors are sent to /login; users with a
 * valid session but no provisioned profile see a branded "access pending" screen.
 *
 * When the API is unreachable (local dev, preview) the app renders normally with
 * its unrestricted local behaviour.
 */
export default function IdentityGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'resolving' | 'ok' | 'pending'>('resolving')
  const signedInEmail = usePermissionStore((s) => s.signedInEmail)
  const router = useRouter()
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p))

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      usePermissionStore.persist.rehydrate()
      const session = await getSession()
      if (cancelled) return

      // Local dev / preview: API down → render freely, no gating.
      if (session.status === 'unreachable') {
        setStatus('ok')
        return
      }

      // Not signed in → send to the login page (unless already on a public page).
      if (session.status === 'anonymous') {
        if (!isPublic) router.replace('/login')
        setStatus('ok')
        return
      }

      // Authenticated: fold the user record into the store so bindIdentity matches.
      const me = session.user
      usePermissionStore.setState((s) => {
        const exists = s.users.some((u) => u.id === me.id)
        const users = exists
          ? s.users.map((u) => (u.id === me.id ? { ...u, ...me } : u))
          : [...s.users, me]
        return { users }
      })

      if (cancelled) return
      const result = usePermissionStore.getState().bindIdentity(session.email, session.name)
      setStatus(result === 'unprovisioned' ? 'pending' : 'ok')
    })()
    return () => {
      cancelled = true
    }
  }, [router, isPublic])

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
          <button type="button" onClick={() => { void logout() }} className="axis-btn axis-btn--ghost axis-btn--sm flex-1">
            <LogOut size={13} />
            تبديل الحساب
          </button>
        </div>
      </div>
    </div>
  )
}
