'use client'
import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Compass, AlertCircle, Loader2 } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { apiAuth } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'reset'>('login')
  const [resetSent, setResetSent] = useState(false)

  // If already signed in, skip straight to the app.
  useEffect(() => {
    getSession().then((s) => {
      if (s.status === 'authenticated') {
        router.replace('/')
        return
      }
      setChecking(false)
    })
  }, [router])

  const submitLogin = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { data, error } = await apiAuth.login(email.trim(), password)
    setSubmitting(false)
    if (error || !data?.ok) {
      setError(error ?? 'تعذّر تسجيل الدخول')
      return
    }
    router.replace('/')
  }, [email, password, router])

  const submitReset = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    await apiAuth.requestReset(email.trim())
    setSubmitting(false)
    setResetSent(true)
  }, [email])

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
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg-1)' }}>
              بوصلة الأعمال
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--fg-3)' }}>
              منصة إدارة المشاريع الداخلية
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="axis-card w-full p-8 flex flex-col gap-5">
          {mode === 'login' ? (
            <form onSubmit={submitLogin} className="flex flex-col gap-5">
              <p className="text-sm text-center" style={{ color: 'var(--fg-2)' }}>
                سجّل دخولك للمتابعة إلى المنصة
              </p>

              <Field
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />
              <Field
                label="كلمة المرور"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
              />

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="axis-btn axis-btn--primary w-full justify-center gap-2 py-3"
                style={{ fontSize: '0.9375rem' }}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                تسجيل الدخول
              </button>

              <button
                type="button"
                onClick={() => { setMode('reset'); setError(null); setResetSent(false) }}
                className="text-xs text-center mx-auto"
                style={{ color: 'var(--fg-3)' }}
              >
                نسيت كلمة المرور؟
              </button>
            </form>
          ) : (
            <form onSubmit={submitReset} className="flex flex-col gap-5">
              <p className="text-sm text-center" style={{ color: 'var(--fg-2)' }}>
                إعادة تعيين كلمة المرور
              </p>

              {resetSent ? (
                <div
                  className="rounded-lg p-3 text-xs leading-relaxed"
                  style={{
                    border: '1px solid var(--feedback-success-border, var(--success-500))',
                    background: 'var(--feedback-success-bg, oklch(0.15 0.05 145))',
                    color: 'var(--success-500)',
                  }}
                >
                  إن كان بريدك مسجّلاً ستصلك رسالة تحتوي رابطاً لإعادة تعيين كلمة المرور. تحقق من بريدك
                </div>
              ) : (
                <>
                  <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--fg-3)' }}>
                    أدخل بريدك وسنرسل لك رابطاً لاختيار كلمة مرور جديدة
                  </p>
                  <Field
                    label="البريد الإلكتروني"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !email}
                    className="axis-btn axis-btn--primary w-full justify-center gap-2 py-3"
                    style={{ fontSize: '0.9375rem' }}
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    إرسال رابط الإعادة
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => { setMode('login'); setError(null) }}
                className="text-xs text-center mx-auto"
                style={{ color: 'var(--fg-3)' }}
              >
                العودة لتسجيل الدخول
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--fg-4, var(--fg-3))' }}>
          النظام مقيّد للأعضاء المُصرَّح لهم فقط.
          <br />
          إذا لم يكن لديك وصول تواصل مع مسؤول المنصة.
        </p>

        <p className="text-xs" style={{ color: 'var(--fg-4, var(--fg-3))' }}>
          © {new Date().getFullYear()} بوصلة الأعمال
        </p>
      </div>
    </div>
  )
}

function Field({
  label, type, value, onChange, placeholder, autoComplete,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs" style={{ color: 'var(--fg-3)' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        dir="ltr"
        style={{
          background: 'var(--color-surface-base)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: '0.875rem',
          color: 'var(--fg-1)',
          textAlign: 'start',
        }}
      />
    </label>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg p-3"
      style={{
        border: '1px solid var(--feedback-danger-border, var(--danger-500))',
        background: 'var(--feedback-danger-bg, oklch(0.15 0.05 25))',
      }}
    >
      <AlertCircle size={16} strokeWidth={1.5} style={{ color: 'var(--danger-500)', flexShrink: 0, marginTop: 2 }} />
      <p className="text-xs leading-relaxed" style={{ color: 'var(--danger-500)' }}>{message}</p>
    </div>
  )
}
