'use client'
import { useEffect, useState } from 'react'
import { Cloud, CloudUpload, RefreshCw, Check, AlertTriangle } from 'lucide-react'
import { usePermissionStore } from '@/store/permissionStore'
import { apiAvailable, apiSyncReset } from '@/lib/api'
import { localSnapshot } from '@/components/shared/ApiSync'

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

/**
 * Cloud sync status + admin recovery. The "force sync" action wipes the shared
 * D1 content and re-seeds it from this browser, resolving a divergent state
 * (e.g. records deleted in one browser reappearing from a stale one).
 */
export default function CloudSyncCard() {
  const [online, setOnline] = useState<boolean | null>(null)
  const [state, setState] = useState<'idle' | 'working' | 'done' | 'error'>('idle')

  // Only the admin (or unrestricted local mode) may force-reset shared data.
  const isAdmin = usePermissionStore((s) => {
    const u = s.activeUserId ? s.users.find((x) => x.id === s.activeUserId) : null
    return !u || u.systemRole === 'admin'
  })

  useEffect(() => {
    let live = true
    apiAvailable().then((v) => { if (live) setOnline(v) })
    return () => { live = false }
  }, [])

  const forceSync = async () => {
    if (!confirm(
      'سيتم استبدال كل البيانات المشتركة في السحابة ببيانات هذا المتصفح، ليصبح هو المصدر الموحّد.\n\n' +
      'افعل هذا من المتصفح الذي يحتوي البيانات الصحيحة. المستخدمون والصلاحيات لن تتأثر.\n\nهل أنت متأكد؟'
    )) return
    setState('working')
    const ok = await apiSyncReset(localSnapshot())
    setState(ok ? 'done' : 'error')
    if (ok) setTimeout(() => setState('idle'), 4000)
  }

  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Cloud size={15} strokeWidth={1.5} />} title="المزامنة السحابية" tint="var(--info-500)" />

      <div
        className="flex items-center justify-between py-3.5 gap-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>حالة الاتصال</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>
            مشاركة البيانات بين جميع المستخدمين عبر السحابة
          </p>
        </div>
        {online === null ? (
          <span className="text-xs" style={{ color: 'var(--fg-3)' }}>…</span>
        ) : online ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--success-500)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success-500)' }} />
            متصل
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--fg-3)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--fg-3)' }} />
            محلي فقط
          </span>
        )}
      </div>

      {isAdmin && (
        <div className="flex items-start justify-between py-3.5 gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>مزامنة قسرية</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--fg-3)' }}>
              اجعل بيانات هذا المتصفح هي المصدر الموحّد للجميع. استخدمها إذا ظهرت بيانات
              محذوفة أو مكررة في متصفح آخر
            </p>
            {state === 'done' && (
              <p className="inline-flex items-center gap-1 text-xs mt-2" style={{ color: 'var(--success-500)' }}>
                <Check size={12} /> تمت المزامنة — اطلب من البقية تحديث صفحاتهم
              </p>
            )}
            {state === 'error' && (
              <p className="inline-flex items-center gap-1 text-xs mt-2" style={{ color: 'var(--danger-500)' }}>
                <AlertTriangle size={12} /> تعذّرت المزامنة — تأكد من الاتصال وأنك المسؤول
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={forceSync}
            disabled={!online || state === 'working'}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors disabled:opacity-40"
            style={{ background: 'color-mix(in srgb, var(--iris-500) 14%, transparent)', color: 'var(--iris-500)' }}
          >
            {state === 'working'
              ? <><RefreshCw size={13} className="animate-spin" /> جارٍ…</>
              : <><CloudUpload size={13} /> رفع كأساس</>}
          </button>
        </div>
      )}
    </div>
  )
}
