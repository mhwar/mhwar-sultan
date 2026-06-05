'use client'
import { useState } from 'react'
import { Plus, Trash2, Mail, Phone, Check, X, Users2 } from 'lucide-react'
import { useShallow } from 'zustand/shallow'
import type { Project, TeamMember, TeamStatus } from '@/types'
import { useTeamStore } from '@/store/store'

const STATUS_LABEL: Record<TeamStatus, string> = {
  active: 'نشط', invited: 'مدعو', inactive: 'غير نشط',
}
const STATUS_VAR: Record<TeamStatus, string> = {
  active: 'var(--success-500)', invited: 'var(--warning-500)', inactive: 'var(--fg-3)',
}

interface Props { project: Project }

export default function TeamTab({ project }: Props) {
  const pid = project.id
  const members = useTeamStore(useShallow((s) => s.members.filter((m) => m.projectId === pid).sort((a, b) => a.order - b.order)))
  const { addMember, updateMember, deleteMember } = useTeamStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="axis-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>الفريق</h2>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-semibold transition-colors"
          style={{ background: 'var(--color-surface-overlay)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
        >
          <Plus size={13} /> إضافة عضو
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {members.map((m) =>
          editingId === m.id
            ? <MemberForm key={m.id} initial={m} onSave={(d) => { updateMember(m.id, d); setEditingId(null) }} onCancel={() => setEditingId(null)} />
            : <MemberCard key={m.id} member={m} onEdit={() => setEditingId(m.id)} onDelete={() => deleteMember(m.id)} />
        )}
        {adding && (
          <MemberForm
            onSave={(d) => { addMember({ ...d, projectId: pid }); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      {members.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Users2 size={28} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا يوجد أعضاء في الفريق بعد</p>
        </div>
      )}
    </div>
  )
}

function MemberCard({ member: m, onEdit, onDelete }: { member: TeamMember; onEdit: () => void; onDelete: () => void }) {
  const initials = m.name.trim().slice(0, 2)
  return (
    <div
      className="group relative rounded-xl p-4 cursor-pointer transition-colors hover:bg-white/5"
      style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
      onClick={onEdit}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ background: 'color-mix(in oklch, var(--iris-500) 18%, transparent)', color: 'var(--iris-500)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{m.name}</p>
            <span
              className="shrink-0 flex items-center gap-1 px-2 h-5 rounded-full text-xs font-medium"
              style={{ background: `color-mix(in oklch, ${STATUS_VAR[m.status]} 15%, transparent)`, color: STATUS_VAR[m.status] }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_VAR[m.status] }} />
              {STATUS_LABEL[m.status]}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{m.role || '—'}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {m.email && <span className="inline-flex items-center gap-1"><Mail size={11} />{m.email}</span>}
            {m.phone && <span className="inline-flex items-center gap-1 num-tabular"><Phone size={11} />{m.phone}</span>}
          </div>
          {m.notes && <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{m.notes}</p>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center transition-all"
          style={{ color: 'var(--danger-500)' }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

const inputCls = 'w-full h-8 rounded-md px-2 text-sm outline-none'
const inputStyle = { background: 'var(--color-surface-muted)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' } as React.CSSProperties

function MemberForm({ initial, onSave, onCancel }: { initial?: TeamMember; onSave: (d: Omit<TeamMember, 'id' | 'order' | 'createdAt' | 'projectId'>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [status, setStatus] = useState<TeamStatus>(initial?.status ?? 'active')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const save = () => { if (!name.trim()) return; onSave({ name, role, email: email || undefined, phone: phone || undefined, status, notes: notes || undefined }) }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--iris-500)' }}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">الاسم</label>
          <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم العضو" autoFocus />
        </div>
        <div>
          <label className="axis-label mb-1 block">الدور</label>
          <input className={inputCls} style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} placeholder="مثال: منسق لوجستيات" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="axis-label mb-1 block">البريد</label>
          <input className={inputCls} style={inputStyle} dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="axis-label mb-1 block">الجوال</label>
          <input className={inputCls} style={inputStyle} dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
        </div>
      </div>
      <div>
        <label className="axis-label mb-1 block">الحالة</label>
        <select className={inputCls} style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value as TeamStatus)}>
          {(Object.keys(STATUS_LABEL) as TeamStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
        </select>
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
