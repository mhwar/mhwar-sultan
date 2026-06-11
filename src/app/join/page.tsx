'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, LogIn } from 'lucide-react'
import { usePermissionStore } from '@/store/permissionStore'
import { decodeBundle } from '@/lib/invite-token'
import type { InviteBundle } from '@/lib/invite-token'

export default function JoinPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading')
  const [bundle, setBundle] = useState<InviteBundle | null>(null)

  useEffect(() => {
    usePermissionStore.persist.rehydrate()
    const token = new URLSearchParams(window.location.search).get('t')
    if (!token) { setStatus('invalid'); return }
    const decoded = decodeBundle(token)
    if (!decoded) { setStatus('invalid'); return }
    setBundle(decoded)
    setStatus('ready')
  }, [])

  const handleJoin = () => {
    if (!bundle) return
    const { user, perms } = bundle

    usePermissionStore.setState((s) => {
      const updatedUsers = s.users.some((u) => u.id === user.id)
        ? s.users.map((u) => (u.id === user.id ? { ...u, ...user } : u))
        : [...s.users, user]
      const otherPerms = s.permissions.filter((p) => p.userId !== user.id)
      return { users: updatedUsers, permissions: [...otherPerms, ...perms], activeUserId: user.id }
    })

    setStatus('done')
    setTimeout(() => router.push('/'), 1200)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-surface-base)', direction: 'rtl' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center space-y-5"
        style={{
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-surface-border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Logo / brand */}
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-xl font-bold"
          style={{ background: 'color-mix(in srgb, var(--iris-500) 16%, transparent)', color: 'var(--iris-500)' }}
        >
          ب
        </div>

        {status === 'loading' && (
          <p className="text-sm" style={{ color: 'var(--fg-3)' }}>جارٍ التحقق من الرابط…</p>
        )}

        {status === 'invalid' && (
          <>
            <XCircle size={40} className="mx-auto" style={{ color: 'var(--danger-500)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--fg-1)' }}>رابط غير صالح</p>
              <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>
                الرابط منتهي الصلاحية أو غير صحيح. اطلب رابطاً جديداً من المسؤول.
              </p>
            </div>
          </>
        )}

        {status === 'ready' && bundle && (
          <>
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--fg-1)' }}>
                مرحباً، {bundle.user.name}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>
                تمت دعوتك للوصول إلى منصة بوصلة الأعمال
              </p>
            </div>

            <div
              className="rounded-xl px-4 py-3 text-sm text-start space-y-1"
              style={{ background: 'var(--color-surface-base)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex justify-between">
                <span style={{ color: 'var(--fg-3)' }}>الدور</span>
                <span style={{ color: 'var(--fg-1)' }}>
                  {bundle.user.systemRole === 'admin' ? 'مدير النظام' : 'عضو'}
                </span>
              </div>
              {bundle.user.systemRole === 'member' && (
                <>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--fg-3)' }}>المالية</span>
                    <span style={{ color: bundle.user.isFinance ? 'var(--success-500)' : 'var(--fg-3)' }}>
                      {bundle.user.isFinance ? 'مسموح' : 'محجوب'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--fg-3)' }}>المحتوى</span>
                    <span style={{ color: bundle.user.isContent ? 'var(--success-500)' : 'var(--fg-3)' }}>
                      {bundle.user.isContent ? 'مسموح' : 'محجوب'}
                    </span>
                  </div>
                </>
              )}
              {bundle.perms.length > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--fg-3)' }}>المشاريع</span>
                  <span style={{ color: 'var(--fg-1)' }}>{bundle.perms.length} مشروع</span>
                </div>
              )}
            </div>

            <button
              onClick={handleJoin}
              className="axis-btn axis-btn--primary w-full justify-center gap-2"
            >
              <LogIn size={15} />
              دخول للمنصة
            </button>
          </>
        )}

        {status === 'done' && (
          <>
            <CheckCircle2 size={40} className="mx-auto" style={{ color: 'var(--success-500)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--fg-1)' }}>تم الدخول بنجاح</p>
              <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>جارٍ التوجيه للصفحة الرئيسية…</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
