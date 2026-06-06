'use client'
import { useState } from 'react'
import { Plus, Trash2, Check, X, TrendingUp, TrendingDown, Minus, Gauge, BookmarkPlus } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, Kpi, KpiTrend, KpiSnapshot } from '@/types'
import { useKpiStore } from '@/store/store'

function fmt(n: number) { return n.toLocaleString('en-US') }

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Sparkline({ history }: { history: KpiSnapshot[] }) {
  if (history.length < 2) return null
  const W = 88, H = 28
  const vals = history.map((h) => h.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const pts = history.map((p, i) => {
    const x = (i / (history.length - 1)) * W
    const y = H - ((p.value - min) / range) * (H - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const last = history[history.length - 1]
  const lx = W, ly = H - ((last.value - min) / range) * (H - 4) - 2
  return (
    <svg width={W} height={H} className="overflow-visible shrink-0">
      <polyline points={pts} fill="none" stroke="var(--iris-500)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <circle cx={lx} cy={ly} r={2.5} fill="var(--iris-500)" />
    </svg>
  )
}

interface Props { project: Project }

export default function KpisTab({ project }: Props) {
  const pid = project.id
  const kpis = useKpiStore(useShallow((s) => s.kpis.filter((k) => k.projectId === pid).sort((a, b) => a.order - b.order)))
  const { addKpi, updateKpi, deleteKpi } = useKpiStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const handleSnapshot = (k: Kpi) => {
    const today = todayKey()
    const newHistory: KpiSnapshot[] = [
      ...(k.history ?? []).filter((h) => h.date !== today),
      { date: today, value: k.value },
    ].sort((a, b) => a.date.localeCompare(b.date))
    updateKpi(k.id, { history: newHistory })
  }

  return (
    <div className="axis-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>المؤشرات</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
        >
          <Plus size={13} /> إضافة مؤشر
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) =>
          editingId === k.id
            ? <KpiForm key={k.id} initial={k} onSave={(d) => { updateKpi(k.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
            : <KpiCard key={k.id} kpi={k} onEdit={() => setEditingId(k.id)} onDelete={() => deleteKpi(k.id)} onSnapshot={() => handleSnapshot(k)} />
        )}
        {adding && (
          <KpiForm
            onSave={(d) => { addKpi({ ...d, projectId: pid }); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {kpis.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Gauge size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد مؤشرات بعد</p>
        </div>
      )}
    </div>
  )
}

function KpiCard({ kpi: k, onEdit, onDelete, onSnapshot }: { kpi: Kpi; onEdit: () => void; onDelete: () => void; onSnapshot: () => void }) {
  const pct = k.target ? Math.min(100, Math.round((k.value / k.target) * 100)) : null
  const trendColor = k.trend === 'up' ? 'var(--success-500)' : k.trend === 'down' ? 'var(--danger-500)' : 'var(--fg-3)'
  const history = k.history ?? []
  const todayRecorded = history.some((h) => h.date === todayKey())

  return (
    <div
      className="group relative rounded-xl p-4 transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium cursor-pointer flex-1" style={{ color: 'var(--color-text-secondary)' }} onClick={onEdit}>{k.name}</p>
        <div className="flex items-center gap-1 shrink-0">
          {k.trend && (
            <span style={{ color: trendColor }}>
              {k.trend === 'up' ? <TrendingUp size={13} /> : k.trend === 'down' ? <TrendingDown size={13} /> : <Minus size={13} />}
            </span>
          )}
          <button
            onClick={onSnapshot}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ color: todayRecorded ? 'var(--success-500)' : 'var(--color-text-muted)' }}
            title={todayRecorded ? 'تم التسجيل اليوم' : 'سجّل القيمة الحالية'}
          >
            <BookmarkPlus size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all"
            style={{ color: 'var(--danger-500)' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2" onClick={onEdit} style={{ cursor: 'pointer' }}>
        <p className="axis-num text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {fmt(k.value)}
          <span className="text-sm font-normal ms-1" style={{ color: 'var(--color-text-muted)' }}>{k.unit}</span>
        </p>
        {history.length >= 2 && <Sparkline history={history} />}
      </div>

      {history.length >= 2 && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          <span className="axis-num">{history.length}</span> نقطة بيانات
        </p>
      )}

      {pct !== null && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            <span><span className="axis-num">{pct}</span>% من الهدف</span>
            <span className="axis-num">{fmt(k.target!)} {k.unit}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--iris-500)' }} />
          </div>
        </div>
      )}
      {k.notes && <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{k.notes}</p>}
    </div>
  )
}

const inputCls = 'w-full h-8 rounded-md px-2 text-sm outline-none'
const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as React.CSSProperties

const TREND_LABEL: Record<KpiTrend, string> = { up: 'صاعد', down: 'هابط', flat: 'مستقر' }

function KpiForm({ initial, onSave, onCancel }: { initial?: Kpi; onSave: (d: Omit<Kpi, 'id' | 'order' | 'createdAt' | 'updatedAt' | 'projectId'>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [value, setValue] = useState(initial ? String(initial.value) : '0')
  const [unit, setUnit] = useState(initial?.unit ?? '')
  const [target, setTarget] = useState(initial?.target !== undefined ? String(initial.target) : '')
  const [trend, setTrend] = useState<KpiTrend | ''>(initial?.trend ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const save = () => {
    if (!name.trim()) return
    onSave({
      name, value: parseFloat(value) || 0, unit,
      target: target ? parseFloat(target) : undefined,
      trend: trend || undefined, notes: notes || undefined,
      history: initial?.history,
    })
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      <div>
        <label className="axis-label mb-1 block">اسم المؤشر</label>
        <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: عدد الحضور" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">القيمة</label>
          <input type="number" className={inputCls} style={inputStyle} value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div>
          <label className="axis-label mb-1 block">الوحدة</label>
          <input className={inputCls} style={inputStyle} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="شخص" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">الهدف</label>
          <input type="number" className={inputCls} style={inputStyle} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="اختياري" />
        </div>
        <div>
          <label className="axis-label mb-1 block">الاتجاه</label>
          <select className={inputCls} style={inputStyle} value={trend} onChange={(e) => setTrend(e.target.value as KpiTrend | '')}>
            <option value="">—</option>
            {(Object.keys(TREND_LABEL) as KpiTrend[]).map((k) => <option key={k} value={k}>{TREND_LABEL[k]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="axis-label mb-1 block">ملاحظات</label>
        <input className={inputCls} style={inputStyle} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="اختياري" />
      </div>
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
