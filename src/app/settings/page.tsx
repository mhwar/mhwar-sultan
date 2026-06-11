'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Download, Upload, RefreshCw, Info, Shield, Palette,
  Keyboard, Database, Compass, Sun, Moon,
} from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import Tag from '@/components/ui/Tag'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/lib/utils'
import PermissionsSection from '@/components/settings/PermissionsSection'

// ── Shared primitives ─────────────────────────────────────

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

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-3.5 gap-4"
      style={last ? undefined : { borderBottom: '1px solid var(--border-subtle)' }}
    >
      {children}
    </div>
  )
}

function RowLabel({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <p className="text-sm font-medium" style={{ color: 'var(--fg-1)' }}>{title}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--fg-3)' }}>{sub}</p>}
    </div>
  )
}

// ── Storage stats (reads localStorage directly) ───────────

const STORE_MAP = [
  { key: 'mhwar-projects',  label: 'مشاريع',    field: 'projects'  },
  { key: 'mhwar-tasks',     label: 'مهام',       field: 'tasks'     },
  { key: 'mhwar-content',   label: 'محتوى',      field: 'items'     },
  { key: 'mhwar-clients',   label: 'عملاء',      field: 'clients'   },
  { key: 'mhwar-team',      label: 'أعضاء فريق', field: 'members'   },
  { key: 'mhwar-finance',   label: 'قيود مالية', field: 'entries'   },
  { key: 'mhwar-meetings',  label: 'اجتماعات',   field: 'meetings'  },
  { key: 'mhwar-kpis',      label: 'مؤشرات',     field: 'kpis'      },
  { key: 'mhwar-notes',     label: 'ملاحظات',    field: 'notes'     },
  { key: 'mhwar-plans',     label: 'خطط',        field: 'plans'     },
  { key: 'mhwar-sprints',   label: 'مبادرات',    field: 'sprints'   },
]

function useStorageStats() {
  const [stats, setStats] = useState<{ label: string; count: number }[]>([])
  const [sizeKb, setSizeKb] = useState(0)

  useEffect(() => {
    const rows = STORE_MAP.map(({ key, label, field }) => {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return { label, count: 0 }
        const arr = JSON.parse(raw)?.state?.[field]
        return { label, count: Array.isArray(arr) ? arr.length : 0 }
      } catch {
        return { label, count: 0 }
      }
    })
    setStats(rows)

    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k) total += (localStorage.getItem(k)?.length ?? 0)
    }
    setSizeKb(Math.round(total / 1024))
  }, [])

  return { stats, sizeKb }
}

// ── Keyboard shortcuts reference ──────────────────────────

const SHORTCUTS = [
  { keys: ['⌘', 'K'], desc: 'فتح نافذة البحث السريع' },
  { keys: ['Esc'], desc: 'إغلاق النوافذ والأدراج' },
  { keys: ['⌘', 'Enter'], desc: 'حفظ النموذج (داخل النماذج)' },
  { keys: ['↑', '↓'], desc: 'التنقل في قوائم البحث' },
  { keys: ['Enter'], desc: 'تأكيد الاختيار في قوائم البحث' },
]

// ── Platform identity card ────────────────────────────────

function PlatformCard() {
  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Compass size={15} strokeWidth={1.5} />} title="هوية المنصة" tint="var(--iris-500)" />
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-2xl shrink-0"
          style={{
            background: 'linear-gradient(135deg, var(--iris-500) 0%, oklch(0.50 0.22 280) 100%)',
            boxShadow: '0 4px 16px oklch(0.62 0.21 275 / 0.35)',
          }}
        >
          ب
        </div>
        <div>
          <p className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>بوصلة الأعمال</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-3)' }}>نحدد الاتجاه.. ونصنع الأثر</p>
          <div className="flex items-center gap-2 mt-2">
            <Tag variant="iris">حلول أعمال متكاملة</Tag>
            <Tag variant="neutral">v1.0.0</Tag>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Appearance card ───────────────────────────────────────

function AppearanceCard() {
  const { theme, toggle } = useThemeStore()
  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Palette size={15} strokeWidth={1.5} />} title="المظهر" tint="var(--iris-500)" />
      <Row last>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--border-subtle)' }}
          >
            {theme === 'light' ? <Sun size={15} style={{ color: 'var(--warning-500)' }} /> : <Moon size={15} style={{ color: 'var(--iris-500)' }} />}
          </div>
          <RowLabel
            title={theme === 'light' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            sub="التبديل بين الثيم الداكن والفاتح"
          />
        </div>
        <button
          className={cn('axis-switch', theme === 'light' && 'is-on')}
          onClick={toggle}
          aria-label="تبديل الثيم"
        />
      </Row>
    </div>
  )
}

// ── Data card ─────────────────────────────────────────────

function DataCard() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const exportData = () => {
    const backup: Record<string, unknown> = { exportedAt: new Date().toISOString(), platform: 'بوصلة الأعمال' }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('mhwar-')) {
        try { backup[k] = JSON.parse(localStorage.getItem(k) ?? '{}') } catch { /* skip */ }
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bawsala-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target?.result as string)
        let restored = 0
        for (const [k, v] of Object.entries(backup)) {
          if (k.startsWith('mhwar-')) {
            localStorage.setItem(k, JSON.stringify(v))
            restored++
          }
        }
        setImportMsg(`تم استعادة ${restored} مخازن بيانات. يتم إعادة التحميل...`)
        setTimeout(() => window.location.reload(), 1500)
      } catch {
        setImportMsg('خطأ في قراءة الملف — تأكد أنه نسخة احتياطية صحيحة من بوصلة الأعمال.')
        setImporting(false)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const resetData = () => {
    if (!confirm('سيتم حذف جميع البيانات والعودة للبيانات الافتراضية. لا يمكن التراجع عن هذا.\n\nهل أنت متأكد؟')) return
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k?.startsWith('mhwar-')) localStorage.removeItem(k)
    }
    window.location.reload()
  }

  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Download size={15} strokeWidth={1.5} />} title="البيانات" tint="var(--iris-500)" />

      <Row>
        <RowLabel
          title="تصدير نسخة احتياطية"
          sub="تنزيل كامل بيانات المنصة بصيغة JSON"
        />
        <Button variant="iris-soft" size="sm" onClick={exportData}>
          <Download size={13} />
          تصدير JSON
        </Button>
      </Row>

      <Row>
        <RowLabel
          title="استيراد نسخة احتياطية"
          sub="استعادة البيانات من ملف JSON سبق تصديره"
        />
        <div className="flex flex-col items-end gap-1">
          <Button variant="iris-soft" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload size={13} />
            {importing ? 'جارٍ الاستيراد…' : 'اختر ملفاً'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
          {importMsg && (
            <p className="text-xs" style={{ color: 'var(--fg-3)' }}>{importMsg}</p>
          )}
        </div>
      </Row>

      <Row last>
        <RowLabel
          title="إعادة تعيين البيانات"
          sub="حذف كل البيانات والعودة للبيانات الافتراضية"
        />
        <Button variant="danger" size="sm" onClick={resetData}>
          <RefreshCw size={13} />
          إعادة تعيين
        </Button>
      </Row>
    </div>
  )
}

// ── Storage stats card ────────────────────────────────────

function StorageCard() {
  const { stats, sizeKb } = useStorageStats()

  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Database size={15} strokeWidth={1.5} />} title="إحصائيات التخزين" tint="var(--success-500)" />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {stats.map(({ label, count }) => (
          <div
            key={label}
            className="rounded-xl px-3 py-2.5 flex flex-col gap-0.5"
            style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="axis-num text-base font-bold" style={{ color: 'var(--fg-1)' }}>{count}</span>
            <span className="text-xs" style={{ color: 'var(--fg-3)' }}>{label}</span>
          </div>
        ))}
      </div>

      {[
        { label: 'مكان التخزين', value: 'المتصفح (localStorage)' },
        { label: 'الحجم التقريبي', value: `${sizeKb} كيلوبايت` },
      ].map((row, i, arr) => (
        <Row key={row.label} last={i === arr.length - 1}>
          <span className="text-sm" style={{ color: 'var(--fg-2)' }}>{row.label}</span>
          <span className="axis-num text-sm font-semibold" style={{ color: 'var(--fg-1)' }}>{row.value}</span>
        </Row>
      ))}
    </div>
  )
}

// ── Keyboard shortcuts card ───────────────────────────────

function ShortcutsCard() {
  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Keyboard size={15} strokeWidth={1.5} />} title="اختصارات لوحة المفاتيح" tint="var(--warning-500)" />
      <div className="space-y-px">
        {SHORTCUTS.map((s, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5"
            style={i < SHORTCUTS.length - 1 ? { borderBottom: '1px solid var(--border-subtle)' } : undefined}
          >
            <span className="text-sm" style={{ color: 'var(--fg-2)' }}>{s.desc}</span>
            <div className="flex items-center gap-1">
              {s.keys.map((k, ki) => (
                <kbd
                  key={ki}
                  className="axis-kbd"
                  style={{ fontSize: '11px' }}
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── About card ────────────────────────────────────────────

function AboutCard() {
  return (
    <div className="axis-card p-6">
      <SectionHeader icon={<Info size={15} strokeWidth={1.5} />} title="عن المنصة" tint="var(--info-500)" />
      {[
        { label: 'المنصة', value: 'بوصلة الأعمال' },
        { label: 'الإصدار', value: '1.0.0' },
        { label: 'إطار العمل', value: 'Next.js 16' },
        { label: 'واجهة المستخدم', value: 'Tailwind CSS v4' },
        { label: 'إدارة الحالة', value: 'Zustand' },
        { label: 'المطور', value: 'مهوار' },
      ].map((row, i, arr) => (
        <Row key={row.label} last={i === arr.length - 1}>
          <span className="text-sm" style={{ color: 'var(--fg-2)' }}>{row.label}</span>
          <Tag variant="neutral">{row.value}</Tag>
        </Row>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 animate-fade-up">
        <div className="mx-auto w-full max-w-[1400px] space-y-6">
          <PageHeader title="الإعدادات" sub="إعدادات المنصة والصلاحيات والبيانات" />

          {/* Access control — the featured section, full width */}
          <PermissionsSection />

          {/* Platform settings — responsive multi-column grid */}
          <div>
            <h2 className="text-xs font-bold mb-3 px-1" style={{ color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
              المنصة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
              <PlatformCard />
              <AppearanceCard />
              <AboutCard />
              <DataCard />
              <StorageCard />
              <ShortcutsCard />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
