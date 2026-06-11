'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  Plus, Layers, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, List, Search, CheckCircle2,
  Globe, AlertCircle, SlidersHorizontal, Save, X, Bookmark, CalendarRange, ArrowLeft,
} from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, ContentItem, ContentStatus, ContentType, ContentPlatform, ContentSource } from '@/types'
import { useContentStore, useClientStore, useTeamStore } from '@/store/store'
import { useContentFilterStore, type PresetValues } from '@/store/contentFilterStore'
import Segmented from '@/components/ui/Segmented'
import ContentDrawer from './content/ContentDrawer'
import ContentCalendar from './content/ContentCalendar'
import ContentBoard from './content/ContentBoard'
import ContentList from './content/ContentList'
import GlobalEventsSheet from './content/GlobalEventsSheet'
import ContentMonthComposer from './content/ContentMonthComposer'
import { PlatformIcon } from './content/PlatformIcon'
import {
  scheduledKey, keyInMonth, keyToISO, monthLabel, DONE_STATUSES, buildClientColorMap, CLIENT_COLORS,
  TYPE_LABEL, SOURCE_LABEL, todayKey,
  STAGE_ORDER, STAGE_LABEL, STAGE_VAR, stageOf, type ContentStage,
} from './content/contentMeta'

type View = 'calendar' | 'board' | 'list'
const TYPE_QUICK: ContentType[] = ['post', 'design', 'reel', 'story']

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
  const { addClient } = useClientStore()
  const team = useTeamStore(useShallow((s) => s.members.filter((m) => m.projectId === pid)))

  const today = new Date()
  const [view, setView] = useState<View>('calendar')
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [monthScoped, setMonthScoped] = useState(true)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterStage, setFilterStage] = useState<ContentStage | 'all'>('all')
  const [filterPlatform, setFilterPlatform] = useState<ContentPlatform | 'all'>('all')
  const [filterSource, setFilterSource] = useState<ContentSource | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [showGlobalEvents, setShowGlobalEvents] = useState(false)
  const [composerClient, setComposerClient] = useState<string | null>(null) // '' = no client, id = client; null = closed
  const [showAddClient, setShowAddClient] = useState(false)
  const [addClientName, setAddClientName] = useState('')

  // Saved filter presets (own persisted store; hydrate on mount).
  const presets = useContentFilterStore(useShallow((s) => s.presets.filter((p) => p.projectId === pid)))
  const { addPreset, deletePreset } = useContentFilterStore()
  useEffect(() => { useContentFilterStore.persist.rehydrate() }, [])

  const clientColorMap = useMemo(() => buildClientColorMap(clients.map((c) => c.id)), [clients])
  const clientNameMap = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients])
  const assigneeNameMap = useMemo(() => Object.fromEntries(team.map((m) => [m.id, m.name])), [team])

  const activeFilterCount =
    (filterClient !== 'all' ? 1 : 0) + (filterStage !== 'all' ? 1 : 0) +
    (filterPlatform !== 'all' ? 1 : 0) + (filterSource !== 'all' ? 1 : 0)

  const resetFilters = () => {
    setFilterClient('all'); setFilterStage('all'); setFilterPlatform('all'); setFilterSource('all')
  }
  const applyPreset = (v: PresetValues) => {
    setFilterClient(v.client); setFilterStage(v.stage); setFilterPlatform(v.platform); setFilterSource(v.source)
  }
  const saveCurrentPreset = () => {
    const name = presetName.trim()
    if (!name) return
    addPreset(pid, name, { client: filterClient, stage: filterStage, platform: filterPlatform, source: filterSource })
    setPresetName('')
  }

  const { year, month } = cursor
  const inMonthOrUndated = (i: ContentItem) => {
    const k = scheduledKey(i)
    return k === null || keyInMonth(k, year, month)
  }

  const base = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (filterClient !== 'all' && i.clientId !== filterClient) return false
      if (filterStage !== 'all' && stageOf(i.status) !== filterStage) return false
      if (filterPlatform !== 'all' && i.platform !== filterPlatform) return false
      if (filterSource !== 'all' && (i.source ?? 'internal') !== filterSource) return false
      if (q && !i.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, filterClient, filterStage, filterPlatform, filterSource, search])

  const availablePlatforms = useMemo(() => {
    const seen = new Set<ContentPlatform>()
    items.forEach((i) => { if (i.platform) seen.add(i.platform) })
    return Array.from(seen)
  }, [items])

  const todayOverdue = useMemo(() => {
    const tk = todayKey()
    return items.filter((i) => scheduledKey(i) === tk && !DONE_STATUSES.includes(i.status))
  }, [items])

  const calendarItems = useMemo(() => base.filter(inMonthOrUndated), [base, year, month]) // eslint-disable-line react-hooks/exhaustive-deps
  const scopedItems = useMemo(
    () => (monthScoped ? base.filter(inMonthOrUndated) : base),
    [base, monthScoped, year, month] // eslint-disable-line react-hooks/exhaustive-deps
  )

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

  const submitAddClient = () => {
    if (!addClientName.trim()) return
    addClient({ projectId: pid, name: addClientName.trim(), contractValue: 0, contractCurrency: 'SAR', status: 'active' })
    setAddClientName('')
    setShowAddClient(false)
  }

  /* ── Mutations ── */
  const openNew = (presets?: Partial<ContentItem>) => {
    const id = addItem({ projectId: pid, title: '', type: 'post', status: 'idea', ...presets })
    setOpenId(id)
  }
  const openEdit = (item: ContentItem) => setOpenId(item.id)
  const closeDrawer = () => {
    const cur = openId ? items.find((i) => i.id === openId) : undefined
    if (cur && !cur.title.trim() && !cur.body?.trim()) deleteItem(cur.id)
    setOpenId(null)
  }

  const openItem = openId ? items.find((i) => i.id === openId) : undefined
  const setStatus = (id: string, status: ContentStatus) => updateItem(id, { status })

  const handleReorder = (draggedId: string, targetId: string) => {
    const dragged = items.find((i) => i.id === draggedId)
    const target = items.find((i) => i.id === targetId)
    if (!dragged || !target) return
    updateItem(draggedId, { order: target.order })
    updateItem(targetId, { order: dragged.order })
  }
  const reschedule = (id: string, key: string | null) =>
    updateItem(id, { publishDate: key ? keyToISO(key) : undefined })

  const handleGlobalEventAdd = (title: string, dateKey: string) => {
    addItem({ projectId: pid, title, type: 'post', status: 'idea', publishDate: keyToISO(dateKey) })
  }

  /** Quick-create one idea from the add popover. */
  const quickCreate = (title: string, client: string, type: ContentType) => {
    if (!title.trim()) return
    addItem({ projectId: pid, title: title.trim(), type, status: 'idea', clientId: client || undefined })
  }

  return (
    <div className="axis-card p-4 md:p-6 space-y-4">

      {/* Header — title + count + top actions (new client, global events) */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>المحتوى</h2>
          <span className="axis-num text-xs px-2 h-5 rounded-full inline-flex items-center" style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddClient((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
          >
            <Plus size={13} /> عميل جديد
          </button>
          <button
            onClick={() => setShowGlobalEvents(true)}
            className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            title="الأيام والمناسبات العالمية"
          >
            <Globe size={14} /> المناسبات
          </button>
        </div>
      </div>

      {/* Inline new-client form */}
      {showAddClient && (
        <div className="flex gap-2 items-center rounded-xl p-2" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}>
          <input
            value={addClientName}
            onChange={(e) => setAddClientName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitAddClient()
              if (e.key === 'Escape') { setAddClientName(''); setShowAddClient(false) }
            }}
            placeholder="اسم العميل الجديد…"
            autoFocus
            className="flex-1 min-w-0 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <button onClick={submitAddClient} className="px-3 h-8 rounded-md text-xs font-semibold shrink-0" style={{ background: 'var(--iris-500)', color: 'white' }}>إضافة</button>
          <button onClick={() => { setAddClientName(''); setShowAddClient(false) }} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost"><X size={13} /></button>
        </div>
      )}

      {/* Per-client contract progress cards */}
      {progress.length > 0 && (
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {progress.map(({ client: c, scheduled, done, quota }) => {
            const color = clientColorMap[c.id]
            const pct = quota > 0 ? Math.min(100, Math.round((done / quota) * 100)) : 0
            const complete = quota > 0 && done >= quota
            return (
              <div
                key={c.id}
                className="shrink-0 rounded-xl p-3 text-start relative"
                style={{ width: 176, background: 'var(--color-surface-overlay)', border: `1px solid ${filterClient === c.id ? color : 'var(--color-surface-border)'}` }}
              >
                {/* Card actions */}
                <div className="absolute top-2 end-2 flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setComposerClient(c.id) }}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
                    title="تخطيط محتوى الشهر"
                  >
                    <CalendarRange size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openNew({ clientId: c.id }) }}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
                    style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}
                    title="إضافة محتوى لهذا العميل"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                <button className="w-full text-start" onClick={() => setFilterClient(filterClient === c.id ? 'all' : c.id)}>
                  <div className="flex items-center gap-1.5 mb-1.5 pe-14">
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
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}><span className="axis-num">{scheduled}</span> مجدول</p>
                  )}
                  {quota > 0 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      <span className="axis-num">{scheduled}</span> مجدول · <span className="axis-num">{Math.max(0, quota - scheduled)}</span> متبقٍ للجدولة
                    </p>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Single-row toolbar: month nav · summary · tools */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Month navigator */}
        <div className="flex items-center gap-1">
          <button onClick={() => stepMonth(-1)} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }} aria-label="الشهر السابق">
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-semibold min-w-[112px] text-center" style={{ color: 'var(--color-text-primary)' }}>{monthLabel(year, month)}</span>
          <button onClick={() => stepMonth(1)} className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }} aria-label="الشهر التالي">
            <ChevronLeft size={16} />
          </button>
          {!isThisMonth && (
            <button onClick={goToday} className="ms-1 px-2.5 h-8 rounded-md text-xs font-medium transition-colors hover:bg-white/5" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}>اليوم</button>
          )}
        </div>

        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          <span className="axis-num">{monthSummary.done}</span><span className="mx-0.5">/</span><span className="axis-num">{monthSummary.total}</span> منجز
        </span>

        <div className="ms-auto flex items-center gap-2 flex-wrap">
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

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث"
              className="h-8 rounded-md ps-7 pe-2.5 text-sm outline-none w-32"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* Filter button + popover */}
          <div className="relative">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium transition-colors"
              style={{
                background: activeFilterCount > 0 ? 'color-mix(in oklch, var(--iris-500) 15%, transparent)' : 'var(--color-surface-overlay)',
                color: activeFilterCount > 0 ? 'var(--iris-500)' : 'var(--color-text-secondary)',
                border: `1px solid ${activeFilterCount > 0 ? 'var(--iris-500)' : 'var(--color-surface-border)'}`,
              }}
            >
              <SlidersHorizontal size={13} /> فلترة
              {activeFilterCount > 0 && (
                <span className="axis-num inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white" style={{ background: 'var(--iris-500)' }}>{activeFilterCount}</span>
              )}
            </button>
            {showFilters && (
              <FilterPanel
                clients={clients}
                clientColorMap={clientColorMap}
                availablePlatforms={availablePlatforms}
                filterClient={filterClient} setFilterClient={setFilterClient}
                filterStage={filterStage} setFilterStage={setFilterStage}
                filterSource={filterSource} setFilterSource={setFilterSource}
                filterPlatform={filterPlatform} setFilterPlatform={setFilterPlatform}
                activeFilterCount={activeFilterCount}
                onReset={resetFilters}
                presetName={presetName} setPresetName={setPresetName}
                onSavePreset={saveCurrentPreset}
                onClose={() => setShowFilters(false)}
              />
            )}
          </div>

          {/* Add content button + popover */}
          <div className="relative">
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold text-white"
              style={{ background: 'var(--iris-500)' }}
            >
              <Plus size={14} /> إضافة محتوى
            </button>
            {showAdd && (
              <AddContentPopover
                clients={clients}
                defaultClient={filterClient !== 'all' ? filterClient : ''}
                onQuickCreate={quickCreate}
                onOpenDetails={(title, client) => { openNew({ title, clientId: client || undefined }); setShowAdd(false) }}
                onClose={() => setShowAdd(false)}
              />
            )}
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
      </div>

      {/* Active filter pills + saved presets */}
      {(activeFilterCount > 0 || presets.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilterCount > 0 && (
            <>
              {filterClient !== 'all' && <ActivePill onClear={() => setFilterClient('all')} color={clientColorMap[filterClient]}>{clientNameMap[filterClient] ?? 'عميل'}</ActivePill>}
              {filterStage !== 'all' && <ActivePill onClear={() => setFilterStage('all')} color={STAGE_VAR[filterStage]}>{STAGE_LABEL[filterStage]}</ActivePill>}
              {filterSource !== 'all' && <ActivePill onClear={() => setFilterSource('all')} color="var(--warning-500)">{filterSource === 'client-request' ? SOURCE_LABEL['client-request'] : SOURCE_LABEL.internal}</ActivePill>}
              {filterPlatform !== 'all' && <ActivePill onClear={() => setFilterPlatform('all')} color="var(--iris-500)">{filterPlatform}</ActivePill>}
              <button onClick={resetFilters} className="text-xs font-medium transition-colors hover:underline" style={{ color: 'var(--iris-500)' }}>مسح الكل</button>
            </>
          )}
          {presets.length > 0 && (
            <>
              {activeFilterCount > 0 && <span className="w-px h-5 mx-1" style={{ background: 'var(--color-surface-border)' }} />}
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}><Bookmark size={11} /> محفوظة:</span>
              {presets.map((p) => (
                <span key={p.id} className="group inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium transition-colors hover:bg-white/5" style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}>
                  <button onClick={() => applyPreset(p)}>{p.name}</button>
                  <button onClick={() => deletePreset(p.id)} className="opacity-40 hover:opacity-100 transition-opacity" aria-label="حذف الفلتر المحفوظ"><X size={11} /></button>
                </span>
              ))}
            </>
          )}
        </div>
      )}

      {/* Today overdue warning */}
      {todayOverdue.length > 0 && (
        <div className="rounded-xl px-3 py-2.5 flex items-start gap-2.5" style={{ background: 'color-mix(in oklch, var(--warning-500) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--warning-500) 30%, transparent)' }}>
          <AlertCircle size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--warning-500)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--warning-500)' }}><span className="axis-num">{todayOverdue.length}</span> قطعة محتوى موعدها اليوم ولم تُنشر</p>
            <div className="flex flex-wrap gap-1.5">
              {todayOverdue.map((it) => (
                <button key={it.id} onClick={() => openEdit(it)} className="px-2 h-6 rounded-md text-xs transition-colors hover:bg-white/10 truncate max-w-[200px]" style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-primary)', border: '1px solid var(--color-surface-border)' }}>
                  {it.title || '(بلا عنوان)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View body */}
      {view === 'calendar' && (
        <ContentCalendar
          items={calendarItems} year={year} month={month}
          clientColorMap={clientColorMap} clientNameMap={clientNameMap}
          onOpenItem={openEdit}
          onAddOnDay={(key) => openNew({ status: 'idea', publishDate: keyToISO(key) })}
          onReschedule={reschedule}
        />
      )}
      {view === 'board' && (
        <ContentBoard
          items={scopedItems} clientColorMap={clientColorMap} clientNameMap={clientNameMap} assigneeNameMap={assigneeNameMap}
          onOpenItem={openEdit} onAddInStatus={(status) => openNew({ status })} onSetStatus={setStatus}
        />
      )}
      {view === 'list' && (
        scopedItems.length > 0 ? (
          <ContentList
            items={scopedItems} clientColorMap={clientColorMap} clientNameMap={clientNameMap} assigneeNameMap={assigneeNameMap}
            onOpenItem={openEdit} onSetStatus={setStatus} onDelete={deleteItem} onReorder={handleReorder}
          />
        ) : <Empty hasItems={items.length > 0} />
      )}

      {openItem && (
        <ContentDrawer
          item={openItem} clients={clients}
          accent={openItem.clientId ? (clientColorMap[openItem.clientId] ?? CLIENT_COLORS[0]) : CLIENT_COLORS[0]}
          onUpdate={(data) => updateItem(openItem.id, data)}
          onDelete={() => deleteItem(openItem.id)}
          onClose={closeDrawer}
        />
      )}

      {showGlobalEvents && (
        <GlobalEventsSheet year={year} month={month} onAddToCalendar={handleGlobalEventAdd} onClose={() => setShowGlobalEvents(false)} />
      )}

      {composerClient !== null && (
        <ContentMonthComposer
          projectId={pid}
          clients={clients}
          initialClientId={composerClient || undefined}
          year={year}
          month={month}
          onCreate={(item) => addItem(item as Parameters<typeof addItem>[0])}
          onClose={() => setComposerClient(null)}
        />
      )}
    </div>
  )
}

/* ── Add content popover ─────────────────────────────────────── */
function AddContentPopover({
  clients, defaultClient, onQuickCreate, onOpenDetails, onClose,
}: {
  clients: { id: string; name: string }[]
  defaultClient: string
  onQuickCreate: (title: string, client: string, type: ContentType) => void
  onOpenDetails: (title: string, client: string) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [client, setClient] = useState(defaultClient)
  const [type, setType] = useState<ContentType>('post')

  const quick = () => {
    if (!title.trim()) return
    onQuickCreate(title, client, type)
    setTitle('')
  }

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute end-0 top-10 z-40 w-80 rounded-xl p-4 space-y-3 axis-menu" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>إضافة محتوى</span>
          <button onClick={onClose} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" aria-label="إغلاق"><X size={14} /></button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') quick() }}
          placeholder="اكتب فكرة المحتوى…"
          autoFocus
          className="w-full h-9 rounded-md px-3 text-sm outline-none"
          style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        />

        {clients.length > 0 && (
          <select
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full h-9 rounded-md px-2 text-sm outline-none"
            style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
          >
            <option value="">بدون عميل</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {/* Type quick picks */}
        <div className="flex flex-wrap gap-1.5">
          {TYPE_QUICK.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="px-2.5 h-7 rounded-full text-xs font-medium transition-colors"
              style={{
                background: type === t ? 'color-mix(in oklch, var(--iris-500) 18%, transparent)' : 'var(--color-surface-muted)',
                color: type === t ? 'var(--iris-500)' : 'var(--color-text-secondary)',
                border: `1px solid ${type === t ? 'color-mix(in oklch, var(--iris-500) 45%, transparent)' : 'var(--color-surface-border)'}`,
              }}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={quick}
            disabled={!title.trim()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-md text-xs font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: 'var(--iris-500)' }}
          >
            <Plus size={13} /> إضافة سريعة
          </button>
          <button
            onClick={() => onOpenDetails(title, client)}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            title="فتح نموذج المحتوى الكامل"
          >
            تفاصيل <ArrowLeft size={13} />
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Filter popover ──────────────────────────────────────────── */
function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 h-7 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5"
      style={{
        background: active ? `color-mix(in oklch, ${color} 18%, transparent)` : 'var(--color-surface-overlay)',
        color: active ? color : 'var(--color-text-secondary)',
        border: `1px solid ${active ? `color-mix(in oklch, ${color} 45%, transparent)` : 'var(--color-surface-border)'}`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {children}
    </button>
  )
}

function ActivePill({ color, onClear, children }: { color: string; onClear: () => void; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full text-xs font-medium" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {children}
      <button onClick={onClear} className="opacity-60 hover:opacity-100 transition-opacity" aria-label="إزالة"><X size={11} /></button>
    </span>
  )
}

interface FilterPanelProps {
  clients: { id: string; name: string }[]
  clientColorMap: Record<string, string>
  availablePlatforms: ContentPlatform[]
  filterClient: string; setFilterClient: (v: string) => void
  filterStage: ContentStage | 'all'; setFilterStage: (v: ContentStage | 'all') => void
  filterSource: ContentSource | 'all'; setFilterSource: (v: ContentSource | 'all') => void
  filterPlatform: ContentPlatform | 'all'; setFilterPlatform: (v: ContentPlatform | 'all') => void
  activeFilterCount: number
  onReset: () => void
  presetName: string; setPresetName: (v: string) => void
  onSavePreset: () => void
  onClose: () => void
}

function FilterPanel({
  clients, clientColorMap, availablePlatforms,
  filterClient, setFilterClient, filterStage, setFilterStage,
  filterSource, setFilterSource, filterPlatform, setFilterPlatform,
  activeFilterCount, onReset, presetName, setPresetName, onSavePreset, onClose,
}: FilterPanelProps) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute end-0 top-10 z-40 w-80 rounded-xl p-4 space-y-4 axis-menu" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>تصفية المحتوى</span>
          <button onClick={onClose} className="axis-iconbtn axis-iconbtn--sm axis-iconbtn--ghost" aria-label="إغلاق"><X size={14} /></button>
        </div>

        {clients.length > 0 && (
          <FilterGroup label="العميل">
            <Chip active={filterClient === 'all'} onClick={() => setFilterClient('all')} color="var(--iris-500)">الكل</Chip>
            {clients.map((c) => (
              <Chip key={c.id} active={filterClient === c.id} onClick={() => setFilterClient(filterClient === c.id ? 'all' : c.id)} color={clientColorMap[c.id]}>{c.name}</Chip>
            ))}
          </FilterGroup>
        )}

        <FilterGroup label="المرحلة">
          <Chip active={filterStage === 'all'} onClick={() => setFilterStage('all')} color="var(--iris-500)">الكل</Chip>
          {STAGE_ORDER.map((s) => (
            <Chip key={s} active={filterStage === s} onClick={() => setFilterStage(filterStage === s ? 'all' : s)} color={STAGE_VAR[s]}>{STAGE_LABEL[s]}</Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="المصدر">
          <Chip active={filterSource === 'all'} onClick={() => setFilterSource('all')} color="var(--iris-500)">الكل</Chip>
          <Chip active={filterSource === 'client-request'} onClick={() => setFilterSource(filterSource === 'client-request' ? 'all' : 'client-request')} color="var(--warning-500)">{SOURCE_LABEL['client-request']}</Chip>
          <Chip active={filterSource === 'internal'} onClick={() => setFilterSource(filterSource === 'internal' ? 'all' : 'internal')} color="oklch(0.62 0.17 215)">{SOURCE_LABEL.internal}</Chip>
        </FilterGroup>

        {availablePlatforms.length > 0 && (
          <FilterGroup label="المنصة">
            <Chip active={filterPlatform === 'all'} onClick={() => setFilterPlatform('all')} color="var(--iris-500)">الكل</Chip>
            {availablePlatforms.map((p) => (
              <button
                key={p}
                onClick={() => setFilterPlatform(filterPlatform === p ? 'all' : p)}
                className="px-3 h-7 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                style={{
                  background: filterPlatform === p ? 'color-mix(in oklch, var(--iris-500) 18%, transparent)' : 'var(--color-surface-overlay)',
                  color: filterPlatform === p ? 'var(--iris-500)' : 'var(--color-text-secondary)',
                  border: `1px solid ${filterPlatform === p ? 'color-mix(in oklch, var(--iris-500) 45%, transparent)' : 'var(--color-surface-border)'}`,
                }}
              >
                <PlatformIcon platform={p} size={12} />
              </button>
            ))}
          </FilterGroup>
        )}

        <div className="pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          <div className="flex gap-2">
            <input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSavePreset() }}
              placeholder="اسم الفلتر للحفظ"
              disabled={activeFilterCount === 0}
              className="flex-1 h-8 rounded-md px-2.5 text-xs outline-none disabled:opacity-50"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={onSavePreset}
              disabled={activeFilterCount === 0 || !presetName.trim()}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold text-white shrink-0 disabled:opacity-40"
              style={{ background: 'var(--iris-500)' }}
            >
              <Save size={12} /> حفظ
            </button>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={onReset} className="text-xs font-medium transition-colors hover:underline" style={{ color: 'var(--iris-500)' }}>مسح كل الفلاتر</button>
          )}
        </div>
      </div>
    </>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Empty({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Layers size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{hasItems ? 'لا محتوى ضمن النطاق المحدد' : 'لا يوجد محتوى بعد'}</p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{hasItems ? 'جرّب شهراً آخر أو ألغِ الفلاتر' : 'اضغط «إضافة محتوى» لتبدأ'}</p>
    </div>
  )
}
