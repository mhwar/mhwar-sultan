'use client'
import { useMemo, useState } from 'react'
import { Plus, Trash2, Check, X, Wallet, ArrowUpRight, ArrowDownRight, Repeat, Users2, Server, Megaphone, Wrench, Tag, CircleDollarSign, Package, Layers, type LucideIcon } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, FinanceEntry, FinanceKind, FinanceStatus, FinancePackage } from '@/types'
import { useFinanceStore, usePackageStore, useClientStore } from '@/store/store'
import { formatDateShort } from '@/lib/utils'

const KIND_LABEL: Record<FinanceKind, string> = { income: 'إيراد', expense: 'مصروف' }
const STATUS_LABEL: Record<FinanceStatus, string> = { planned: 'مخطط', paid: 'مدفوع', overdue: 'متأخر' }
const STATUS_VAR: Record<FinanceStatus, string> = {
  planned: 'var(--fg-3)', paid: 'var(--success-500)', overdue: 'var(--danger-500)',
}

/** Standard categories: salaries, infrastructure, marketing, operations, revenue. */
const CATEGORY_PRESETS = ['رواتب', 'بنية تحتية', 'تسويق', 'عمليات', 'إيرادات'] as const
const CATEGORY_ICON: Record<string, LucideIcon> = {
  'رواتب': Users2,
  'بنية تحتية': Server,
  'تسويق': Megaphone,
  'عمليات': Wrench,
  'إيرادات': CircleDollarSign,
}
const OTHER_CATEGORY = 'غير مصنف'

function fmt(n: number) { return n.toLocaleString('en-US') }

type FinanceView = 'overview' | 'entries' | 'packages' | 'clients'
const VIEW_TABS: { key: FinanceView; label: string }[] = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'entries', label: 'الحركات' },
  { key: 'packages', label: 'الباقات' },
  { key: 'clients', label: 'العملاء' },
]

interface Props { project: Project }

export default function FinanceTab({ project }: Props) {
  const pid = project.id
  const entries = useFinanceStore(useShallow((s) => s.entries.filter((e) => e.projectId === pid).sort((a, b) => a.order - b.order)))
  const [view, setView] = useState<FinanceView>('overview')

  const currency = entries[0]?.currency ?? 'SAR'
  const income = entries.filter((e) => e.kind === 'income').reduce((s, e) => s + e.amount, 0)
  const expense = entries.filter((e) => e.kind === 'expense').reduce((s, e) => s + e.amount, 0)
  const balance = income - expense
  // Monthly burn: recurring expense commitments (salaries, hosting, subscriptions…)
  const monthly = entries.filter((e) => e.kind === 'expense' && e.recurring).reduce((s, e) => s + e.amount, 0)

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
        {VIEW_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className="px-4 py-2 text-sm font-medium transition-colors relative"
            style={{
              color: view === t.key ? 'var(--iris-500)' : 'var(--color-text-muted)',
              borderBottom: view === t.key ? '2px solid var(--iris-500)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <OverviewView income={income} expense={expense} balance={balance} monthly={monthly} currency={currency} entries={entries} />
      )}
      {view === 'entries' && <EntriesView project={project} entries={entries} currency={currency} />}
      {view === 'packages' && <PackagesView project={project} currency={currency} />}
      {view === 'clients' && <ClientsView project={project} entries={entries} currency={currency} />}
    </div>
  )
}

/* ── Overview view: summary cards + charts ─────────────────── */

function OverviewView({ income, expense, balance, monthly, currency, entries }: { income: number; expense: number; balance: number; monthly: number; currency: string; entries: FinanceEntry[] }) {
  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="الإيرادات" value={income} currency={currency} color="var(--success-500)" icon={<ArrowUpRight size={16} />} />
        <SummaryCard label="المصروفات" value={expense} currency={currency} color="var(--danger-500)" icon={<ArrowDownRight size={16} />} />
        <SummaryCard label="الرصيد" value={balance} currency={currency} color={balance >= 0 ? 'var(--iris-500)' : 'var(--danger-500)'} icon={<Wallet size={16} />} />
        <SummaryCard label="التزامات شهرية" value={monthly} currency={currency} color="var(--danger-500)" icon={<Repeat size={16} />} hint="رواتب وبنية تحتية متكررة" />
      </div>

      {/* Charts */}
      {entries.length >= 2 ? (
        <div className="axis-card p-4 md:p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>التوزيع</h3>
          <div className="flex items-start gap-6 flex-wrap">
            <DonutChart income={income} expense={expense} />
            <CategoryBars entries={entries} currency={currency} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Wallet size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد حركات مالية كافية لعرض التوزيع</p>
        </div>
      )}
    </div>
  )
}

/* ── Entries view: grouped list + sub-filter + forms ──────── */

type EntryFilter = 'all' | FinanceKind
const ENTRY_FILTER_TABS: { key: EntryFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'income', label: 'إيراد' },
  { key: 'expense', label: 'مصروف' },
]

function EntriesView({ project, entries, currency }: { project: Project; entries: FinanceEntry[]; currency: string }) {
  const pid = project.id
  const { addEntry, updateEntry, deleteEntry } = useFinanceStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [filter, setFilter] = useState<EntryFilter>('all')

  const filtered = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.kind === filter)),
    [entries, filter]
  )

  // Group entries by category, largest total first
  const groups = useMemo(() => {
    const map = new Map<string, FinanceEntry[]>()
    for (const e of filtered) {
      const cat = e.category || OTHER_CATEGORY
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(e)
    }
    return [...map.entries()].sort((a, b) => {
      const ta = a[1].reduce((s, e) => s + e.amount, 0)
      const tb = b[1].reduce((s, e) => s + e.amount, 0)
      return tb - ta
    })
  }, [filtered])

  return (
    <div className="axis-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>الحركات المالية</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
        >
          <Plus size={13} /> إضافة حركة
        </button>
      </div>

      {/* Sub-filter */}
      <div className="flex gap-1 mb-4 p-0.5 rounded-lg w-fit" style={{ background: 'var(--color-surface-muted)' }}>
        {ENTRY_FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className="px-3 h-7 rounded-md text-xs font-medium transition-colors"
            style={{
              background: filter === t.key ? 'var(--color-surface-overlay)' : 'transparent',
              color: filter === t.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              border: filter === t.key ? '1px solid var(--color-surface-border)' : '1px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {adding && (
        <div className="mb-4">
          <EntryForm
            defaultCurrency={currency}
            onSave={(d) => { addEntry({ ...d, projectId: pid }); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {/* Grouped by category */}
      <div className="space-y-5">
        {groups.map(([cat, list]) => {
          const Icon = CATEGORY_ICON[cat] ?? Tag
          const subtotal = list.reduce((s, e) => s + (e.kind === 'income' ? e.amount : -e.amount), 0)
          return (
            <div key={cat}>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  <Icon size={13} /> {cat}
                  <span className="axis-num font-normal" style={{ color: 'var(--color-text-muted)' }}>({list.length})</span>
                </p>
                <span className="axis-num text-xs font-bold" style={{ color: subtotal >= 0 ? 'var(--success-500)' : 'var(--danger-500)' }}>
                  {subtotal >= 0 ? '+' : '−'}{fmt(Math.abs(subtotal))} {currency}
                </span>
              </div>
              <div className="space-y-2">
                {list.map((e) =>
                  editingId === e.id
                    ? <EntryForm key={e.id} initial={e} onSave={(d) => { updateEntry(e.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
                    : <EntryRow key={e.id} entry={e} onEdit={() => setEditingId(e.id)} onDelete={() => deleteEntry(e.id)} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Wallet size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد حركات مالية بعد — ابدأ بإضافة الرواتب والتزامات البنية التحتية</p>
        </div>
      )}
    </div>
  )
}

/* ── Packages view ────────────────────────────────────────── */

function PackagesView({ project, currency }: { project: Project; currency: string }) {
  const pid = project.id
  const packages = usePackageStore(useShallow((s) => s.packages.filter((p) => p.projectId === pid).sort((a, b) => a.order - b.order)))
  const clients = useClientStore(useShallow((s) => s.clients.filter((c) => c.projectId === pid)))
  const { addPackage, updatePackage, deletePackage } = usePackageStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const clientOptions = useMemo(() => clients.map((c) => ({ id: c.id, name: c.name })), [clients])
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? id

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>الباقات</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
        >
          <Plus size={13} /> إضافة باقة
        </button>
      </div>

      {adding && (
        <PackageForm
          defaultCurrency={currency}
          clients={clientOptions}
          onSave={(d) => { addPackage({ ...d, projectId: pid }); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {packages.map((pkg) =>
          editingId === pkg.id ? (
            <div key={pkg.id} className="md:col-span-2 xl:col-span-3">
              <PackageForm
                initial={pkg}
                defaultCurrency={currency}
                clients={clientOptions}
                onSave={(d) => { updatePackage(pkg.id, d); setEditingId(null) }}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              clientName={clientName}
              onEdit={() => setEditingId(pkg.id)}
              onDelete={() => deletePackage(pkg.id)}
            />
          )
        )}
      </div>

      {packages.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Package size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد باقات بعد — أضف باقات الخدمة وأسعارها الشهرية</p>
        </div>
      )}
    </div>
  )
}

function PackageCard({ pkg, clientName, onEdit, onDelete }: { pkg: FinancePackage; clientName: (id: string) => string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      className="group axis-card p-4 flex flex-col gap-3 cursor-pointer transition-colors hover:bg-white/5"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in oklch, var(--iris-500) 12%, transparent)', color: 'var(--iris-500)' }}>
            <Package size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{pkg.name}</p>
            {pkg.description && <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{pkg.description}</p>}
          </div>
        </div>
        <button
          onClick={(ev) => { ev.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all shrink-0"
          style={{ color: 'var(--danger-500)' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="axis-num text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{fmt(pkg.price)}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{pkg.currency} / شهر</span>
      </div>

      {pkg.deliverables != null && (
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="axis-num font-semibold">{fmt(pkg.deliverables)}</span> قطعة / شهر
        </p>
      )}

      {pkg.features && pkg.features.length > 0 && (
        <ul className="space-y-1.5">
          {pkg.features.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              <Check size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--success-500)' }} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {pkg.clientIds && pkg.clientIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {pkg.clientIds.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)' }}>
              <Users2 size={10} /> {clientName(id)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Clients view: per-client revenue ─────────────────────── */

function ClientsView({ project, entries, currency }: { project: Project; entries: FinanceEntry[]; currency: string }) {
  const pid = project.id
  const clients = useClientStore(useShallow((s) => s.clients.filter((c) => c.projectId === pid).sort((a, b) => a.order - b.order)))
  const packages = usePackageStore(useShallow((s) => s.packages.filter((p) => p.projectId === pid)))

  const rows = useMemo(() => clients.map((c) => {
    const pkg = packages.find((p) => p.clientIds?.includes(c.id))
    const clientIncome = entries.filter((e) => e.kind === 'income' && e.clientId === c.id)
    const paid = clientIncome.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount, 0)
    const planned = clientIncome.filter((e) => e.status !== 'paid').reduce((s, e) => s + e.amount, 0)
    return { client: c, pkg, paid, planned }
  }), [clients, packages, entries])

  const totalRecurring = clients.reduce((s, c) => s + (c.contractValue || 0), 0)

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
        <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>الإيراد الشهري المتكرر من العملاء</p>
        <p className="axis-num text-xl font-bold" style={{ color: 'var(--success-500)' }}>
          {fmt(totalRecurring)} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{currency} / شهر</span>
        </p>
      </div>

      <div className="space-y-2.5">
        {rows.map(({ client, pkg, paid, planned }) => (
          <div key={client.id} className="axis-card p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{client.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="inline-flex items-center gap-1">
                    <Layers size={12} /> {pkg ? pkg.name : 'بلا باقة'}
                  </span>
                  <span className="axis-num">
                    {fmt(client.contractValue || 0)} {client.contractCurrency || currency} / شهر
                  </span>
                </div>
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="text-end">
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>محصّل</p>
                  <p className="axis-num text-sm font-bold" style={{ color: 'var(--success-500)' }}>{fmt(paid)}</p>
                </div>
                <div className="text-end">
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>مخطط</p>
                  <p className="axis-num text-sm font-bold" style={{ color: 'var(--fg-3)' }}>{fmt(planned)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Users2 size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا يوجد عملاء مرتبطون بهذا المشروع</p>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, currency, color, icon, hint }: { label: string; value: number; currency: string; color: string; icon: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
      <div className="flex items-center gap-2 mb-1" style={{ color }}>
        {icon}
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      </div>
      <p className="axis-num text-xl font-bold" style={{ color }}>
        {fmt(value)} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{currency}</span>
      </p>
      {hint && <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
    </div>
  )
}

function EntryRow({ entry: e, onEdit, onDelete }: { entry: FinanceEntry; onEdit: () => void; onDelete: () => void }) {
  const isIncome = e.kind === 'income'
  const sign = isIncome ? '+' : '−'
  const color = isIncome ? 'var(--success-500)' : 'var(--danger-500)'
  return (
    <div
      className="group flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
      onClick={onEdit}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{e.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {e.date && <span className="num-tabular">{formatDateShort(e.date)}</span>}
          {e.recurring && (
            <span className="inline-flex items-center gap-1 px-1.5 rounded font-medium" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)' }}>
              <Repeat size={10} /> شهري
            </span>
          )}
        </div>
      </div>
      <span
        className="shrink-0 flex items-center px-2 h-6 rounded-full text-xs font-medium"
        style={{ background: `color-mix(in oklch, ${STATUS_VAR[e.status]} 15%, transparent)`, color: STATUS_VAR[e.status] }}
      >
        {STATUS_LABEL[e.status]}
      </span>
      <span className="axis-num text-sm font-bold shrink-0 w-28 text-end" style={{ color }}>
        {sign}{fmt(e.amount)} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{e.currency}</span>
      </span>
      <button
        onClick={(ev) => { ev.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all shrink-0"
        style={{ color: 'var(--danger-500)' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

function DonutChart({ income, expense }: { income: number; expense: number }) {
  const total = income + expense
  if (total === 0) return null
  const r = 26, cx = 35, cy = 35
  const circ = 2 * Math.PI * r
  const incomeDash = (income / total) * circ
  const expenseDash = (expense / total) * circ
  return (
    <div className="shrink-0 flex flex-col items-center gap-2">
      <svg width={70} height={70}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-surface-muted)" strokeWidth={9} />
        {income > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--success-500)" strokeWidth={9}
            strokeDasharray={`${incomeDash} ${circ}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {expense > 0 && (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--danger-500)" strokeWidth={9}
            strokeDasharray={`${expenseDash} ${circ}`}
            strokeDashoffset={-incomeDash}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
      </svg>
      <div className="flex gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--success-500)' }} />إيراد</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--danger-500)' }} />مصروف</span>
      </div>
    </div>
  )
}

function CategoryBars({ entries, currency }: { entries: FinanceEntry[]; currency: string }) {
  const grouped: Record<string, { income: number; expense: number }> = {}
  for (const e of entries) {
    const cat = e.category || OTHER_CATEGORY
    if (!grouped[cat]) grouped[cat] = { income: 0, expense: 0 }
    grouped[cat][e.kind] += e.amount
  }
  const cats = Object.entries(grouped)
    .sort((a, b) => (b[1].income + b[1].expense) - (a[1].income + a[1].expense))
    .slice(0, 5)
  const maxTotal = Math.max(...cats.map(([, v]) => v.income + v.expense))
  return (
    <div className="flex-1 min-w-0 space-y-2.5">
      {cats.map(([name, { income, expense }]) => {
        const total = income + expense
        const incW = maxTotal > 0 ? (income / maxTotal) * 100 : 0
        const expW = maxTotal > 0 ? (expense / maxTotal) * 100 : 0
        return (
          <div key={name}>
            <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              <span className="truncate">{name}</span>
              <span className="axis-num shrink-0 ms-2">{fmt(total)} {currency}</span>
            </div>
            <div className="h-1.5 rounded-full flex gap-px overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
              {income > 0 && <div className="h-full rounded-full" style={{ width: `${incW}%`, background: 'var(--success-500)' }} />}
              {expense > 0 && <div className="h-full rounded-full" style={{ width: `${expW}%`, background: 'var(--danger-500)' }} />}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const inputCls = 'w-full h-8 rounded-md px-2 text-sm outline-none'
const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as React.CSSProperties
const CUSTOM = '__custom'

function EntryForm({ initial, defaultCurrency, onSave, onCancel }: { initial?: FinanceEntry; defaultCurrency?: string; onSave: (d: Omit<FinanceEntry, 'id' | 'order' | 'createdAt' | 'projectId'>) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [kind, setKind] = useState<FinanceKind>(initial?.kind ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency ?? 'SAR')
  const initialCat = initial?.category ?? ''
  const isPreset = !initialCat || (CATEGORY_PRESETS as readonly string[]).includes(initialCat)
  const [catChoice, setCatChoice] = useState(isPreset ? initialCat : CUSTOM)
  const [catCustom, setCatCustom] = useState(isPreset ? '' : initialCat)
  const [status, setStatus] = useState<FinanceStatus>(initial?.status ?? 'planned')
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : '')
  const [recurring, setRecurring] = useState(initial?.recurring ?? false)

  const save = () => {
    if (!title.trim()) return
    const category = catChoice === CUSTOM ? (catCustom.trim() || undefined) : (catChoice || undefined)
    onSave({ title, kind, amount: parseFloat(amount) || 0, currency, category, status, date: date ? new Date(date).toISOString() : undefined, recurring: recurring || undefined })
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      <div>
        <label className="axis-label mb-1 block">البيان</label>
        <input className={inputCls} style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: راتب مطوّر الواجهات" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">النوع</label>
          <select className={inputCls} style={inputStyle} value={kind} onChange={(e) => setKind(e.target.value as FinanceKind)}>
            {(Object.keys(KIND_LABEL) as FinanceKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </div>
        <div>
          <label className="axis-label mb-1 block">الحالة</label>
          <select className={inputCls} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as FinanceStatus)}>
            {(Object.keys(STATUS_LABEL) as FinanceStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="axis-label mb-1 block">المبلغ</label>
          <input type="number" className={inputCls} style={inputStyle} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">العملة</label>
          <input className={inputCls} style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">التاريخ</label>
          <input type="date" className={inputCls} style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">التصنيف</label>
          <select className={inputCls} style={inputStyle} value={catChoice} onChange={(e) => setCatChoice(e.target.value)}>
            <option value="">بلا تصنيف</option>
            {CATEGORY_PRESETS.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={CUSTOM}>تصنيف آخر…</option>
          </select>
        </div>
        {catChoice === CUSTOM && (
          <div>
            <label className="axis-label mb-1 block">اسم التصنيف</label>
            <input className={inputCls} style={inputStyle} value={catCustom} onChange={(e) => setCatCustom(e.target.value)} placeholder="مثال: لوجستيات" />
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <button
          type="button"
          onClick={() => setRecurring((v) => !v)}
          className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
          style={{ background: recurring ? 'var(--iris-500)' : 'transparent', border: recurring ? 'none' : '1.5px solid var(--color-surface-border)' }}
          aria-label="التزام شهري متكرر"
        >
          {recurring && <Check size={11} color="#fff" strokeWidth={3} />}
        </button>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>التزام شهري متكرر (راتب، استضافة، اشتراك…)</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button onClick={save} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Check size={12} /> حفظ
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          <X size={12} /> إلغاء
        </button>
      </div>
    </div>
  )
}

/* ── Package form ─────────────────────────────────────────── */

function PackageForm({ initial, defaultCurrency, clients, onSave, onCancel }: { initial?: FinancePackage; defaultCurrency?: string; clients: { id: string; name: string }[]; onSave: (d: Omit<FinancePackage, 'id' | 'order' | 'createdAt' | 'projectId'>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [currency, setCurrency] = useState(initial?.currency ?? defaultCurrency ?? 'SAR')
  const [deliverables, setDeliverables] = useState(initial?.deliverables != null ? String(initial.deliverables) : '')
  const [features, setFeatures] = useState((initial?.features ?? []).join('\n'))
  const [clientIds, setClientIds] = useState<string[]>(initial?.clientIds ?? [])

  const toggleClient = (id: string) =>
    setClientIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const save = () => {
    if (!name.trim()) return
    const featureList = features.split('\n').map((f) => f.trim()).filter(Boolean)
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      price: parseFloat(price) || 0,
      currency,
      deliverables: deliverables.trim() ? parseInt(deliverables, 10) || 0 : undefined,
      features: featureList.length ? featureList : undefined,
      clientIds: clientIds.length ? clientIds : undefined,
    })
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      <div>
        <label className="axis-label mb-1 block">اسم الباقة</label>
        <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: الباقة الذهبية" autoFocus />
      </div>
      <div>
        <label className="axis-label mb-1 block">الوصف</label>
        <input className={inputCls} style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: إدارة محتوى لمنصتين مع تصاميم متقدمة" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="axis-label mb-1 block">السعر الشهري</label>
          <input type="number" className={inputCls} style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">العملة</label>
          <input className={inputCls} style={inputStyle} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">عدد القطع</label>
          <input type="number" className={inputCls} style={inputStyle} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="axis-label mb-1 block">المزايا (سطر لكل ميزة)</label>
        <textarea
          className="w-full rounded-md px-2 py-1.5 text-sm outline-none"
          style={{ ...inputStyle, minHeight: 88 }}
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          placeholder={'16 قطعة محتوى شهرياً\nإدارة منصتين\nتقرير أداء نصف شهري'}
        />
      </div>
      {clients.length > 0 && (
        <div>
          <label className="axis-label mb-1 block">العملاء المرتبطون</label>
          <div className="flex flex-wrap gap-1.5">
            {clients.map((c) => {
              const on = clientIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClient(c.id)}
                  className="inline-flex items-center gap-1 px-2 h-7 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: on ? 'color-mix(in oklch, var(--iris-500) 14%, transparent)' : 'var(--color-surface-muted)',
                    color: on ? 'var(--iris-500)' : 'var(--color-text-secondary)',
                    border: on ? '1px solid var(--iris-500)' : '1px solid var(--color-surface-border)',
                  }}
                >
                  {on && <Check size={11} />} {c.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={save} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs font-semibold" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Check size={12} /> حفظ
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 px-3 h-7 rounded-md text-xs" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
          <X size={12} /> إلغاء
        </button>
      </div>
    </div>
  )
}
