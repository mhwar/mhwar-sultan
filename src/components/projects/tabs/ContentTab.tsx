'use client'
import { useState, useMemo } from 'react'
import {
  Plus, Layers, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, List, Search, CheckCircle2,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, ContentItem, ContentStatus } from '@/types'
import { useContentStore, useClientStore } from '@/store/store'
import Segmented from '@/components/ui/Segmented'
import ContentForm, { type ContentFormData } from './content/ContentForm'
import ContentCalendar from './content/ContentCalendar'
import ContentBoard from './content/ContentBoard'
import ContentList from './content/ContentList'
import {
  scheduledKey, keyInMonth, keyToISO, monthLabel, DONE_STATUSES, buildClientColorMap,
} from './content/contentMeta'

type View = 'calendar' | 'board' | 'list'

interface EditorState {
  open: boolean
  item?: ContentItem
  presets?: Partial<ContentItem>
}

interface Props { project: Project }

export default function ContentTab({ project }: Props) {
  const pid = project.id
  const items = useContentStore(useShallow((s) =>
    s.items.filter((i) => i.projectId === pid).sort((a, b) => a.order - b.order)
  ))
  const { addItem, updateItem, deleteItem } = useContentStore()
  const clients = useClientStore(useShallow((s) =>
    s.clients.filter((c) => c.projectId === pid).sort((a, b) => a.order - b.order)
  ))

  const today = new Date()
  const [view, setView] = useState<View>('calendar')
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [monthScoped, setMonthScoped] = useState(true)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [quickTitle, setQuickTitle] = useState('')
  const [quickClient, setQuickClient] = useState<string>('')
  const [editor, setEditor] = useState<EditorState>({ open: false })

  const clientColorMap = useMemo(() => buildClientColorMap(clients.map((c) => c.id)), [clients])
  const clientNameMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients])

  const { year, month } = cursor
  const inMonthOrUndated = (i: ContentItem) => {
    const k = scheduledKey(i)
    return k === null || keyInMonth(k, year, month)
  }

  // client + search filter
  const base = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (filterClient !== 'all' && i.clientId !== filterClient) return false
      if (q && !i.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, filterClient, search])

  const calendarItems = useMemo(() => base.filter(inMonthOrUndated), [base, year, month]) // eslint-disable-line react-hooks/exhaustive-deps
  const scopedItems = useMemo(
    () => (monthScoped ? base.filter(inMonthOrUndated) : base),
    [base, monthScoped, year, month] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Per-client contract progress for the selected month (independent of filters).
  const progress = useMemo(() => {
    return clients
      .map((c) => {
        const monthItems = items.filter((i) => i.clientId === c.id && keyInMonth(scheduledKey(i), year, month))
        const done = monthItems.filter((i) => DONE_STATUSES.includes(i.status)).length
        const quota = c.deliverableCount ?? 0
        return { client: c, scheduled: monthItems.length, done, quota }
      })
      .filter((p) => p.client.status === 'active' || p.scheduled > 0 || p.quota > 0)
  }, [clients, items, year, month])

  // Month summary across all clients.
  const monthSummary = useMemo(() => {
    const monthItems = items.filter((i) => keyInMonth(scheduledKey(i), year, month))
    const done = monthItems.filter((i) => DONE_STATUSES.includes(i.status)).length
    return { total: monthItems.length, done }
  }, [items, year, month])

  const stepMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(Date.UTC(c.year, c.month + delta, 1))
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
    })
  }
  const goToday = () => setCursor({ year: today.getFullYear(), month: today.getMonth() })
  const isThisMonth = year === today.getFullYear() && month === today.getMonth()

  /* ── Mutations ── */
  const openNew = (presets?: Partial<ContentItem>) => setEditor({ open: true, presets })
  const openEdit = (item: ContentItem) => setEditor({ open: true, item })
  const closeEditor = () => setEditor({ open: false })

  const handleSave = (data: ContentFormData) => {
    if (editor.item) updateItem(editor.item.id, data)
    else addItem({ ...data, projectId: pid })
    closeEditor()
  }
  const handleDelete = () => {
    if (editor.item) deleteItem(editor.item.id)
    closeEditor()
  }
  const setStatus = (id: string, status: ContentStatus) => updateItem(id, { status })
  const reschedule = (id: string, key: string | null) =>
    updateItem(id, { publishDate: key ? keyToISO(key) : undefined })

  const quickAdd = () => {
    const t = quickTitle.trim()
    if (!t) return
    addItem({
      projectId: pid,
      title: t,
      type: 'post',
      status: 'idea',
      clientId: (quickClient || (filterClient !== 'all' ? filterClient : '')) || undefined,
    })
    setQuickTitle('')
  }

  return (
    <div className="axis-card p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>المحتوى</h2>
          <span className="axis-num text-xs px-2 h-5 rounded-full inline-flex items-center" style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
            {items.length}
          </span>
        </div>
        <Segmented
          value={view}
          onChange={(v) => setView(v as View)}
          options={[
            { value: 'calendar', icon: <CalendarDays size={15} />, label: 'تقويم' },
            { value: 'board', icon: <LayoutGrid size={15} />, label: 'لوحة' },
            { value: 'list', icon: <List size={15} />, label: 'قائمة' },
          ]}
        />
      </div>

      {/* Month navigator + summary + tools */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => stepMonth(-1)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            aria-label="الشهر السابق"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-semibold min-w-[120px] text-center" style={{ color: 'var(--color-text-primary)' }}>
            {monthLabel(year, month)}
          </span>
          <button
            onClick={() => stepMonth(1)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            aria-label="الشهر التالي"
          >
            <ChevronLeft size={16} />
          </button>
          {!isThisMonth && (
            <button
              onClick={goToday}
              className="ms-1 px-2.5 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            >
              اليوم
            </button>
          )}
        </div>

        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="axis-num">{monthSummary.done}</span>
          <span className="mx-0.5">/</span>
          <span className="axis-num">{monthSummary.total}</span> منجز هذا الشهر
        </span>

        <div className="ms-auto flex items-center gap-2">
          {view !== 'calendar' && (
            <button
              onClick={() => setMonthScoped((s) => !s)}
              className="px-2.5 h-8 rounded-md text-xs font-medium transition-colors"
              style={{
                background: monthScoped ? 'color-mix(in oklch, var(--iris-500) 15%, transparent)' : 'var(--color-surface-overlay)',
                color: monthScoped ? 'var(--iris-500)' : 'var(--color-text-muted)',
                border: `1px solid ${monthScoped ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
              }}
            >
              هذا الشهر
            </button>
          )}
          <div className="relative">
            <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث"
              className="h-8 rounded-md ps-7 pe-2.5 text-sm outline-none w-36"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Quick add */}
      <div
        className="flex items-center gap-2 rounded-xl p-2"
        style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
      >
        <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: 'var(--iris-500)', color: 'white' }}>
          <Plus size={15} />
        </span>
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') quickAdd() }}
          placeholder="اكتب فكرة محتوى ثم اضغط Enter…"
          className="flex-1 min-w-0 bg-transparent text-sm outline-none"
          style={{ color: 'var(--color-text-primary)' }}
        />
        {clients.length > 0 && (
          <select
            value={quickClient}
            onChange={(e) => setQuickClient(e.target.value)}
            className="h-8 rounded-md px-2 text-xs outline-none shrink-0 max-w-[130px]"
            style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
          >
            <option value="">عميل…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <button
          onClick={quickAdd}
          disabled={!quickTitle.trim()}
          className="px-3 h-8 rounded-md text-xs font-semibold shrink-0 transition-opacity disabled:opacity-40"
          style={{ background: 'var(--iris-500)', color: 'white' }}
        >
          إضافة
        </button>
        <button
          onClick={() => openNew()}
          className="px-2.5 h-8 rounded-md text-xs font-medium shrink-0 transition-colors hover:bg-white/5"
          style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          title="إضافة مع كل التفاصيل"
        >
          تفاصيل
        </button>
      </div>

      {/* Per-client contract progress */}
      {progress.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {progress.map(({ client: c, scheduled, done, quota }) => {
            const color = clientColorMap[c.id]
            const pct = quota > 0 ? Math.min(100, Math.round((done / quota) * 100)) : 0
            const complete = quota > 0 && done >= quota
            return (
              <button
                key={c.id}
                onClick={() => setFilterClient(filterClient === c.id ? 'all' : c.id)}
                className="shrink-0 rounded-xl p-3 text-start transition-colors hover:bg-white/5"
                style={{
                  width: 168,
                  background: 'var(--color-surface-overlay)',
                  border: `1px solid ${filterClient === c.id ? color : 'var(--color-surface-border)'}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{c.name}</span>
                  {complete && <CheckCircle2 size={13} style={{ color: 'var(--success-500)' }} className="ms-auto shrink-0" />}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="axis-num text-lg font-bold" style={{ color }}>{done}</span>
                  {quota > 0 && <span className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>/ {quota}</span>}
                  <span className="text-xs ms-1" style={{ color: 'var(--color-text-muted)' }}>منجز</span>
                </div>
                {quota > 0 ? (
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: complete ? 'var(--success-500)' : color }} />
                  </div>
                ) : (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="axis-num">{scheduled}</span> مجدول
                  </p>
                )}
                {quota > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="axis-num">{scheduled}</span> مجدول · <span className="axis-num">{Math.max(0, quota - scheduled)}</span> متبقٍ للجدولة
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Client filter chips */}
      {clients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filterClient === 'all'} onClick={() => setFilterClient('all')} color="var(--iris-500)">
            كل العملاء
          </Chip>
          {clients.map((c) => (
            <Chip key={c.id} active={filterClient === c.id} onClick={() => setFilterClient(filterClient === c.id ? 'all' : c.id)} color={clientColorMap[c.id]}>
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      {/* View body */}
      {view === 'calendar' && (
        <ContentCalendar
          items={calendarItems}
          year={year}
          month={month}
          clientColorMap={clientColorMap}
          clientNameMap={clientNameMap}
          onOpenItem={openEdit}
          onAddOnDay={(key) => openNew({ status: 'idea', publishDate: keyToISO(key) })}
          onReschedule={reschedule}
        />
      )}
      {view === 'board' && (
        <ContentBoard
          items={scopedItems}
          clientColorMap={clientColorMap}
          clientNameMap={clientNameMap}
          onOpenItem={openEdit}
          onAddInStatus={(status) => openNew({ status })}
          onSetStatus={setStatus}
        />
      )}
      {view === 'list' && (
        scopedItems.length > 0 ? (
          <ContentList
            items={scopedItems}
            clientColorMap={clientColorMap}
            clientNameMap={clientNameMap}
            onOpenItem={openEdit}
            onSetStatus={setStatus}
            onDelete={deleteItem}
          />
        ) : (
          <Empty hasItems={items.length > 0} />
        )
      )}

      {editor.open && (
        <ContentForm
          initial={editor.item}
          presets={editor.presets}
          clients={clients}
          onSave={handleSave}
          onDelete={editor.item ? handleDelete : undefined}
          onClose={closeEditor}
        />
      )}
    </div>
  )
}

function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 h-7 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5"
      style={{
        background: active ? color : 'var(--color-surface-overlay)',
        color: active ? 'white' : 'var(--color-text-secondary)',
        border: `1px solid ${active ? 'transparent' : 'var(--color-surface-border)'}`,
      }}
    >
      {!active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}

function Empty({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Layers size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {hasItems ? 'لا محتوى ضمن النطاق المحدد' : 'لا يوجد محتوى بعد'}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {hasItems ? 'جرّب شهراً آخر أو ألغِ الفلاتر' : 'اكتب فكرة في الأعلى لتبدأ'}
      </p>
    </div>
  )
}
