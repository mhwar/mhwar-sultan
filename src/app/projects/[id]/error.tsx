'use client'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react'

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--feedback-danger-bg)', border: '1px solid color-mix(in srgb, var(--danger-500) 25%, transparent)' }}
      >
        <AlertTriangle size={28} style={{ color: 'var(--danger-500)' }} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          تعذّر تحميل المشروع
        </h2>
        <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
          حدث خطأ أثناء تحميل الصفحة. حاول مجدداً أو عد للمشاريع.
        </p>
        {error?.message && (
          <p
            className="text-xs font-mono mt-2 px-3 py-2 rounded-lg max-w-sm break-all"
            style={{ background: 'var(--feedback-danger-bg)', color: 'var(--danger-500)' }}
          >
            {error.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={reset} className="axis-btn axis-btn--primary axis-btn--md">
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
        <Link href="/projects" className="axis-btn axis-btn--secondary axis-btn--md">
          <ArrowRight size={14} data-flip-rtl />
          المشاريع
        </Link>
      </div>
    </div>
  )
}
