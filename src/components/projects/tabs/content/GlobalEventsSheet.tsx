'use client'
import { useState, useMemo } from 'react'
import { X, Globe, Search, Plus, CalendarDays } from 'lucide-react'

export interface GlobalEvent {
  month: number   // 1–12
  day: number     // 1–31
  title: string
  emoji: string
  tags: string[]
}

/** Master list of international days — heavily weighted toward charitable org content. */
export const GLOBAL_EVENTS: GlobalEvent[] = [
  // January
  { month: 1, day: 1,  title: 'اليوم العالمي للسلام', emoji: '🕊️', tags: ['سلام', 'خيري'] },
  { month: 1, day: 4,  title: 'اليوم العالمي للبرايل', emoji: '👁️', tags: ['إعاقة', 'خيري'] },
  { month: 1, day: 24, title: 'اليوم الدولي للتعليم', emoji: '📚', tags: ['تعليم', 'خيري'] },
  { month: 1, day: 27, title: 'يوم إحياء ذكرى ضحايا الهولوكوست', emoji: '🕯️', tags: ['إنساني'] },
  { month: 1, day: 30, title: 'اليوم العالمي لضحايا الجذام', emoji: '🤲', tags: ['صحة', 'خيري'] },

  // February
  { month: 2, day: 4,  title: 'اليوم العالمي للسرطان', emoji: '🎗️', tags: ['صحة', 'خيري'] },
  { month: 2, day: 6,  title: 'اليوم الدولي للقضاء على الختان', emoji: '🚫', tags: ['حقوق المرأة', 'خيري'] },
  { month: 2, day: 11, title: 'اليوم الدولي للمرأة في العلوم', emoji: '🔬', tags: ['مرأة', 'خيري'] },
  { month: 2, day: 13, title: 'اليوم العالمي للراديو', emoji: '📻', tags: ['إعلام'] },
  { month: 2, day: 20, title: 'يوم العدالة الاجتماعية العالمي', emoji: '⚖️', tags: ['عدالة', 'خيري'] },
  { month: 2, day: 21, title: 'اليوم الدولي للغة الأم', emoji: '🗣️', tags: ['ثقافة'] },
  { month: 2, day: 22, title: 'يوم التأسيس السعودي', emoji: '🇸🇦', tags: ['وطني'] },

  // March
  { month: 3, day: 1,  title: 'اليوم العالمي للكلى', emoji: '🫘', tags: ['صحة', 'خيري'] },
  { month: 3, day: 3,  title: 'اليوم العالمي للحياة البرية', emoji: '🐘', tags: ['بيئة'] },
  { month: 3, day: 8,  title: 'اليوم العالمي للمرأة', emoji: '♀️', tags: ['مرأة', 'خيري'] },
  { month: 3, day: 20, title: 'اليوم الدولي للسعادة', emoji: '😊', tags: ['مجتمع'] },
  { month: 3, day: 21, title: 'اليوم العالمي لمتلازمة داون', emoji: '🎗️', tags: ['إعاقة', 'خيري'] },
  { month: 3, day: 21, title: 'اليوم العالمي لمكافحة التمييز العنصري', emoji: '🤝', tags: ['حقوق', 'خيري'] },
  { month: 3, day: 22, title: 'اليوم العالمي للمياه', emoji: '💧', tags: ['بيئة', 'خيري'] },
  { month: 3, day: 23, title: 'اليوم العالمي للتوحد', emoji: '🔵', tags: ['إعاقة', 'خيري'] },
  { month: 3, day: 25, title: 'اليوم الدولي للتضامن مع ضحايا الاتجار بالأشخاص', emoji: '🛡️', tags: ['حقوق', 'خيري'] },

  // April
  { month: 4, day: 2,  title: 'اليوم العالمي للتوعية بالتوحد', emoji: '🧩', tags: ['إعاقة', 'خيري'] },
  { month: 4, day: 4,  title: 'اليوم الدولي للتوعية بالألغام', emoji: '🕊️', tags: ['إنساني', 'خيري'] },
  { month: 4, day: 7,  title: 'اليوم العالمي للصحة', emoji: '🏥', tags: ['صحة', 'خيري'] },
  { month: 4, day: 22, title: 'يوم الأرض العالمي', emoji: '🌍', tags: ['بيئة'] },
  { month: 4, day: 23, title: 'اليوم العالمي للكتاب وحقوق المؤلف', emoji: '📖', tags: ['تعليم', 'ثقافة'] },
  { month: 4, day: 25, title: 'اليوم العالمي للملاريا', emoji: '🦟', tags: ['صحة', 'خيري'] },

  // May
  { month: 5, day: 3,  title: 'اليوم العالمي لحرية الصحافة', emoji: '📰', tags: ['حقوق'] },
  { month: 5, day: 8,  title: 'اليوم العالمي للصليب الأحمر والهلال الأحمر', emoji: '🔴', tags: ['إنساني', 'خيري'] },
  { month: 5, day: 12, title: 'اليوم العالمي للتمريض', emoji: '👩‍⚕️', tags: ['صحة', 'خيري'] },
  { month: 5, day: 15, title: 'اليوم الدولي للأسرة', emoji: '👨‍👩‍👧', tags: ['مجتمع', 'خيري'] },
  { month: 5, day: 17, title: 'اليوم العالمي لمحاربة رهاب المثلية والنوع الاجتماعي', emoji: '🌈', tags: ['حقوق'] },
  { month: 5, day: 20, title: 'اليوم العالمي للنحل', emoji: '🐝', tags: ['بيئة'] },
  { month: 5, day: 21, title: 'اليوم العالمي للتنوع الثقافي', emoji: '🌐', tags: ['ثقافة'] },
  { month: 5, day: 31, title: 'اليوم العالمي للامتناع عن التدخين', emoji: '🚭', tags: ['صحة', 'خيري'] },

  // June
  { month: 6, day: 1,  title: 'اليوم العالمي للطفل', emoji: '👶', tags: ['أطفال', 'خيري'] },
  { month: 6, day: 5,  title: 'اليوم العالمي للبيئة', emoji: '🌱', tags: ['بيئة', 'خيري'] },
  { month: 6, day: 8,  title: 'اليوم العالمي للمحيطات', emoji: '🌊', tags: ['بيئة'] },
  { month: 6, day: 12, title: 'اليوم العالمي لمناهضة عمالة الأطفال', emoji: '⛔', tags: ['أطفال', 'حقوق', 'خيري'] },
  { month: 6, day: 14, title: 'اليوم العالمي للمتبرعين بالدم', emoji: '🩸', tags: ['صحة', 'خيري'] },
  { month: 6, day: 15, title: 'يوم التوعية بإساءة معاملة المسنين', emoji: '👴', tags: ['مجتمع', 'خيري'] },
  { month: 6, day: 17, title: 'اليوم العالمي لمكافحة التصحر والجفاف', emoji: '🏜️', tags: ['بيئة', 'خيري'] },
  { month: 6, day: 20, title: 'اليوم العالمي للاجئين', emoji: '🏕️', tags: ['إنساني', 'خيري'] },
  { month: 6, day: 23, title: 'اليوم العالمي للخدمة المدنية', emoji: '🏛️', tags: ['مجتمع'] },
  { month: 6, day: 26, title: 'اليوم الدولي لمكافحة المخدرات', emoji: '🚫', tags: ['صحة', 'مجتمع'] },

  // July
  { month: 7, day: 11, title: 'اليوم العالمي للسكان', emoji: '🌍', tags: ['مجتمع', 'خيري'] },
  { month: 7, day: 18, title: 'يوم نيلسون مانديلا الدولي', emoji: '✊', tags: ['حقوق', 'خيري'] },
  { month: 7, day: 28, title: 'اليوم العالمي لالتهاب الكبد الوبائي', emoji: '🎗️', tags: ['صحة', 'خيري'] },
  { month: 7, day: 30, title: 'اليوم الدولي لمناهضة الاتجار بالبشر', emoji: '🛑', tags: ['حقوق', 'خيري'] },
  { month: 7, day: 30, title: 'اليوم الدولي للصداقة', emoji: '🤝', tags: ['مجتمع'] },

  // August
  { month: 8, day: 9,  title: 'اليوم الدولي لشعوب العالم الأصلية', emoji: '🪶', tags: ['حقوق', 'خيري'] },
  { month: 8, day: 12, title: 'اليوم الدولي للشباب', emoji: '👩‍🎓', tags: ['شباب', 'خيري'] },
  { month: 8, day: 19, title: 'اليوم العالمي للعمل الإنساني', emoji: '🆘', tags: ['إنساني', 'خيري'] },
  { month: 8, day: 23, title: 'يوم إحياء ذكرى تجارة الرقيق', emoji: '🕯️', tags: ['تاريخ', 'حقوق'] },
  { month: 8, day: 29, title: 'اليوم الدولي ضد التجارب النووية', emoji: '☢️', tags: ['سلام'] },

  // September
  { month: 9, day: 5,  title: 'اليوم الدولي للأعمال الخيرية', emoji: '❤️', tags: ['خيري', 'تطوع'] },
  { month: 9, day: 7,  title: 'اليوم الدولي للهواء النظيف', emoji: '💨', tags: ['بيئة'] },
  { month: 9, day: 8,  title: 'اليوم الدولي للقضاء على الأمية', emoji: '📝', tags: ['تعليم', 'خيري'] },
  { month: 9, day: 10, title: 'اليوم العالمي لمنع الانتحار', emoji: '💚', tags: ['صحة', 'خيري'] },
  { month: 9, day: 12, title: 'اليوم العالمي للإسعافات الأولية', emoji: '🩹', tags: ['صحة', 'خيري'] },
  { month: 9, day: 15, title: 'اليوم الدولي للديمقراطية', emoji: '🗳️', tags: ['حقوق'] },
  { month: 9, day: 18, title: 'يوم المساواة في الأجر الدولي', emoji: '⚖️', tags: ['حقوق', 'خيري'] },
  { month: 9, day: 21, title: 'اليوم الدولي للسلام', emoji: '🕊️', tags: ['سلام', 'خيري'] },
  { month: 9, day: 23, title: 'اليوم الوطني السعودي', emoji: '🇸🇦', tags: ['وطني'] },
  { month: 9, day: 26, title: 'اليوم العالمي للقلب', emoji: '❤️', tags: ['صحة', 'خيري'] },
  { month: 9, day: 27, title: 'اليوم العالمي للسياحة', emoji: '✈️', tags: ['ثقافة'] },
  { month: 9, day: 28, title: 'اليوم العالمي لداء الكلب', emoji: '🐕', tags: ['صحة'] },
  { month: 9, day: 29, title: 'اليوم العالمي للقلب', emoji: '💓', tags: ['صحة', 'خيري'] },

  // October
  { month: 10, day: 1,  title: 'اليوم الدولي لكبار السن', emoji: '👴', tags: ['مجتمع', 'خيري'] },
  { month: 10, day: 2,  title: 'اليوم الدولي اللاعنف', emoji: '✌️', tags: ['سلام'] },
  { month: 10, day: 4,  title: 'اليوم العالمي للحيوان', emoji: '🐾', tags: ['بيئة'] },
  { month: 10, day: 5,  title: 'اليوم العالمي للمعلم', emoji: '🏫', tags: ['تعليم', 'خيري'] },
  { month: 10, day: 10, title: 'اليوم العالمي للصحة النفسية', emoji: '🧠', tags: ['صحة', 'خيري'] },
  { month: 10, day: 11, title: 'اليوم الدولي للفتاة', emoji: '👧', tags: ['أطفال', 'مرأة', 'خيري'] },
  { month: 10, day: 13, title: 'اليوم الدولي للحد من الكوارث', emoji: '⚠️', tags: ['إنساني', 'خيري'] },
  { month: 10, day: 15, title: 'اليوم الدولي للمرأة الريفية', emoji: '🌾', tags: ['مرأة', 'خيري'] },
  { month: 10, day: 15, title: 'اليوم العالمي لغسل اليدين', emoji: '🙌', tags: ['صحة', 'خيري'] },
  { month: 10, day: 16, title: 'اليوم العالمي للغذاء', emoji: '🌾', tags: ['غذاء', 'خيري'] },
  { month: 10, day: 17, title: 'اليوم الدولي للقضاء على الفقر', emoji: '🤝', tags: ['فقر', 'خيري'] },
  { month: 10, day: 24, title: 'يوم الأمم المتحدة', emoji: '🌐', tags: ['دولي'] },
  { month: 10, day: 24, title: 'اليوم العالمي للتوعية بشلل الأطفال', emoji: '💉', tags: ['صحة', 'أطفال', 'خيري'] },
  { month: 10, day: 31, title: 'اليوم العالمي للمدن', emoji: '🏙️', tags: ['مجتمع'] },

  // November
  { month: 11, day: 5,  title: 'اليوم العالمي للتوعية بالتسونامي', emoji: '🌊', tags: ['إنساني', 'خيري'] },
  { month: 11, day: 10, title: 'يوم العلوم للسلام والتنمية', emoji: '🔬', tags: ['تعليم'] },
  { month: 11, day: 14, title: 'اليوم العالمي للسكري', emoji: '💙', tags: ['صحة', 'خيري'] },
  { month: 11, day: 16, title: 'اليوم الدولي للتسامح', emoji: '🤝', tags: ['مجتمع', 'خيري'] },
  { month: 11, day: 17, title: 'يوم الطلاب الدوليين', emoji: '🎓', tags: ['تعليم', 'شباب'] },
  { month: 11, day: 19, title: 'اليوم العالمي للمراحيض', emoji: '🚽', tags: ['صحة', 'خيري'] },
  { month: 11, day: 20, title: 'اليوم العالمي للطفل', emoji: '🧒', tags: ['أطفال', 'خيري'] },
  { month: 11, day: 25, title: 'اليوم الدولي للقضاء على العنف ضد المرأة', emoji: '🟠', tags: ['مرأة', 'حقوق', 'خيري'] },
  { month: 11, day: 29, title: 'يوم التضامن مع الشعب الفلسطيني', emoji: '🤲', tags: ['إنساني', 'خيري'] },

  // December
  { month: 12, day: 1,  title: 'اليوم العالمي للإيدز', emoji: '🎗️', tags: ['صحة', 'خيري'] },
  { month: 12, day: 2,  title: 'اليوم الدولي لإلغاء الرق', emoji: '⛓️', tags: ['حقوق', 'خيري'] },
  { month: 12, day: 3,  title: 'اليوم الدولي للمعاقين', emoji: '♿', tags: ['إعاقة', 'خيري'] },
  { month: 12, day: 5,  title: 'اليوم الدولي للمتطوعين', emoji: '🙋', tags: ['تطوع', 'خيري'] },
  { month: 12, day: 9,  title: 'اليوم الدولي لمناهضة الفساد', emoji: '🛡️', tags: ['حقوق'] },
  { month: 12, day: 10, title: 'اليوم العالمي لحقوق الإنسان', emoji: '📜', tags: ['حقوق', 'خيري'] },
  { month: 12, day: 18, title: 'اليوم الدولي للمهاجرين', emoji: '🧳', tags: ['إنساني', 'خيري'] },
  { month: 12, day: 20, title: 'اليوم الدولي للتضامن الإنساني', emoji: '🌟', tags: ['خيري', 'تطوع'] },
]

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

const ALL_TAGS = Array.from(new Set(GLOBAL_EVENTS.flatMap((e) => e.tags))).sort()

interface Props {
  /** Current year shown in the content tab (for adding to the right month). */
  year: number
  /** 0-indexed current month. */
  month: number
  onAddToCalendar: (title: string, dateKey: string) => void
  onClose: () => void
}

export default function GlobalEventsSheet({ year, month, onAddToCalendar, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [viewMonth, setViewMonth] = useState<number | null>(null)  // null = all months

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return GLOBAL_EVENTS.filter((e) => {
      if (q && !e.title.toLowerCase().includes(q)) return false
      if (activeTag && !e.tags.includes(activeTag)) return false
      if (viewMonth !== null && e.month !== viewMonth + 1) return false
      return true
    })
  }, [search, activeTag, viewMonth])

  // Group by month
  const byMonth = useMemo(() => {
    const map = new Map<number, GlobalEvent[]>()
    for (const e of filtered) {
      if (!map.has(e.month)) map.set(e.month, [])
      map.get(e.month)!.push(e)
    }
    return map
  }, [filtered])

  const handleAdd = (event: GlobalEvent) => {
    const pad2 = (n: number) => String(n).padStart(2, '0')
    const key = `${year}-${pad2(event.month)}-${pad2(event.day)}`
    onAddToCalendar(event.title, key)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'oklch(0.10 0.01 260 / 0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-2xl flex flex-col animate-fade-up"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <Globe size={18} style={{ color: 'var(--iris-500)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>المناسبات العالمية</h2>
            <span className="axis-num text-xs px-2 h-5 rounded-full inline-flex items-center" style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-muted)', border: '1px solid var(--color-surface-border)' }}>
              {GLOBAL_EVENTS.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 pt-3 pb-2 space-y-2 shrink-0">
          <div className="relative">
            <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المناسبات…"
              className="w-full h-8 rounded-md ps-7 pe-2.5 text-sm outline-none"
              style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              autoFocus
            />
          </div>
          {/* Month pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <Pill active={viewMonth === null} onClick={() => setViewMonth(null)}>كل الأشهر</Pill>
            {AR_MONTHS.map((m, i) => (
              <Pill key={i} active={viewMonth === i} onClick={() => setViewMonth(viewMonth === i ? null : i)}>
                {m}
              </Pill>
            ))}
          </div>
          {/* Tag pills */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_TAGS.map((t) => (
              <Pill key={t} active={activeTag === t} onClick={() => setActiveTag(activeTag === t ? null : t)}>
                {t}
              </Pill>
            ))}
          </div>
        </div>

        {/* Event list */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {byMonth.size === 0 && (
            <p className="text-sm text-center py-10" style={{ color: 'var(--color-text-muted)' }}>لا نتائج</p>
          )}
          {Array.from(byMonth.entries())
            .sort(([a], [b]) => a - b)
            .map(([m, events]) => (
              <div key={m} className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={13} style={{ color: 'var(--iris-500)' }} />
                  <span className="text-xs font-bold" style={{ color: 'var(--color-text-secondary)' }}>
                    {AR_MONTHS[m - 1]}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {events.sort((a, b) => a.day - b.day).map((ev, idx) => (
                    <EventRow key={idx} event={ev} onAdd={() => handleAdd(ev)} />
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div
          className="px-5 py-3 shrink-0 text-xs"
          style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--color-text-muted)' }}
        >
          اضغط «+» بجانب أي مناسبة لإضافتها كمحتوى إلى التقويم في {AR_MONTHS[month]}
        </div>
      </div>
    </div>
  )
}

function EventRow({ event, onAdd }: { event: GlobalEvent; onAdd: () => void }) {
  const pad2 = (n: number) => String(n).padStart(2, '0')
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
    >
      <span className="text-base shrink-0">{event.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{event.title}</p>
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          <span className="axis-num text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {pad2(event.day)} / {pad2(event.month)}
          </span>
          {event.tags.map((t) => (
            <span key={t} className="text-xs px-1.5 h-4 rounded-full inline-flex items-center" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onAdd}
        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0 hover:bg-white/10"
        style={{ color: 'var(--iris-500)', border: '1px solid var(--iris-500)' }}
        title={`إضافة "${event.title}" إلى التقويم`}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-2.5 h-6 rounded-full text-xs font-medium transition-colors"
      style={{
        background: active ? 'var(--iris-500)' : 'var(--color-surface-muted)',
        color: active ? 'white' : 'var(--color-text-muted)',
        border: `1px solid ${active ? 'transparent' : 'var(--color-surface-border)'}`,
      }}
    >
      {children}
    </button>
  )
}
