'use client'
import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'

export default function BillingPreviewPage() {
  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'var(--color-surface-base)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 h-10 shrink-0 z-10"
        style={{
          background: 'var(--color-surface-raised)',
          borderBottom: '1px solid var(--color-surface-border)',
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold transition-colors hover:opacity-80"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <ArrowRight size={13} data-flip-rtl />
          العودة للوحة التحكم
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
            معاينة — الرصيد والباقات
          </span>
          <a
            href="/billing-preview.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
            style={{ color: 'var(--color-brand)' }}
          >
            <ExternalLink size={12} />
            فتح في تبويب جديد
          </a>
        </div>
      </div>

      {/* Full iframe */}
      <iframe
        src="/billing-preview.html"
        className="flex-1 w-full border-0"
        title="معاينة — الرصيد والباقات"
      />
    </div>
  )
}
