'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Compass } from 'lucide-react'
import { fetchCfIdentity, CF_LOGIN_URL } from '@/lib/cfAccess'

export default function LoginPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // If already authenticated, go straight to the app.
    fetchCfIdentity().then((identity) => {
      if (identity) router.replace('/')
      else setChecking(false)
    })
  }, [router])

  if (checking) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center"
        style={{ background: 'var(--color-surface-base)' }}
      />
    )
  }

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center p-6"
      style={{ background: 'var(--color-surface-base)', direction: 'rtl' }}
    >
      {/* Background decorative glow */}
      <div
        aria-hidden
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.62 0.21 275 / 0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm flex flex-col items-center gap-8">

        {/* Brand mark */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-white"
            style={{
              background: 'linear-gradient(135deg, var(--iris-500) 0%, oklch(0.50 0.22 280) 100%)',
              boxShadow: '0 8px 32px oklch(0.62 0.21 275 / 0.40)',
            }}
          >
            <Compass size={38} strokeWidth={1.5} />
          </div>

          <div className="text-center">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: 'var(--fg-1)' }}
            >
              بوصلة الأعمال
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--fg-3)' }}
            >
              منصة إدارة المشاريع الداخلية
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="axis-card w-full p-8 flex flex-col gap-6"
        >
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--fg-2)' }}>
              سجّل دخولك للمتابعة إلى المنصة
            </p>
          </div>

          <a
            href={CF_LOGIN_URL}
            className="axis-btn axis-btn--primary w-full justify-center gap-3 py-3"
            style={{ fontSize: '0.9375rem' }}
          >
            <GoogleIcon />
            تسجيل الدخول بقوقل
          </a>

          <p
            className="text-xs text-center leading-relaxed"
            style={{ color: 'var(--fg-4, var(--fg-3))' }}
          >
            النظام مقيّد للأعضاء المُصرَّح لهم فقط.
            <br />
            إذا لم يكن لديك وصول تواصل مع مسؤول المنصة.
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: 'var(--fg-4, var(--fg-3))' }}>
          © {new Date().getFullYear()} بوصلة الأعمال
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="rgba(255,255,255,0.9)"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="rgba(255,255,255,0.75)"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="rgba(255,255,255,0.75)"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="rgba(255,255,255,0.9)"
      />
    </svg>
  )
}
