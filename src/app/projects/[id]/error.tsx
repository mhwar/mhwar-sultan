'use client'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react'

export default function ProjectError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        <AlertTriangle size={28} style={{ color: '#EF4444' }} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          تعذّر تحميل المشروع
        </h2>
        <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
          حدث خطأ أثناء تحميل الصفحة. حاول مجدداً أو عد للمشاريع.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
        >
          <RefreshCw size={14} />
          إعادة المحاولة
        </button>
        <Link
          href="/projects"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ArrowRight size={14} />
          المشاريع
        </Link>
      </div>
    </div>
  )
}
