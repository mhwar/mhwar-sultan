'use client'
import { Suspense, useState, useCallback, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Compass, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { apiAuth } from '@/lib/api'

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" style={{ background: 'var(--color-surface-base)' }} />}>
      <SetPasswordForm />
    </Suspense>
  )
}

function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const submit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) { setError('كلمة المرور يجب ألا تقل عن 8 أحرف'); return }
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return }
    setSubmitting(true)
    const { data, error } = await apiAuth.setPassword(token, password)
    setSubmitting(false)
    if (error || !data?.ok) {
      setError(error ?? 'تعذّر ضبط كلمة المرور')
      return
    }
    setDone(true)
    setTimeout(() => router.replace('/'), 1200)
  }, [token, password, confirm, router])

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
              اختر كلمة مرور لحسابك
            </p>
          </div>
        </div>

        <div className="axis-card w-full p-8 flex flex-col gap-5">
          {!token ? (
            <ErrorBox message="رابط غير صالح — افتح الرابط من رسالة الدعوة كاملاً" />
          ) : done ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <CheckCircle2 size={32} style={{ color: 'var(--success-500)' }} />
              <p className="text-sm" style={{ color: 'var(--fg-2)' }}>
                تم ضبط كلمة المرور — جارٍ الدخول
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-5">
              <Field
                label="كلمة المرور الجديدة"
                value={password}
                onChange={setPassword}
                placeholder="8 أحرف على الأقل"
                autoComplete="new-password"
              />
              <Field
                label="تأكيد كلمة المرور"
                value={confirm}
                onChange={setConfirm}
                placeholder="أعد كتابة كلمة المرور"
                autoComplete="new-password"
              />

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={submitting || !password || !confirm}
                className="axis-btn axis-btn--primary w-full justify-center gap-2 py-3"
                style={{ fontSize: '0.9375rem' }}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                ضبط كلمة المرور والدخول
              </button>
            </form>
          )}
        </div>

        <p className="text-xs" style={{ color: 'var(--fg-4, var(--fg-3))' }}>
          © {new Date().getFullYear()} بوصلة الأعمال
        </p>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs" style={{ color: 'var(--fg-3)' }}>{label}</span>
      <input
        type="password"
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
