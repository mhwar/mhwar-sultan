'use client'
import { useState } from 'react'
import { X, ShieldOff, Mail, Check, Send, Settings2, UserPlus } from 'lucide-react'
import type { Project, AppUser, ProjectPermission } from '@/types'
import { usePermissionStore } from '@/store/permissionStore'
import { getTool } from '@/lib/tool-registry'
import { FALLBACK_TOOL_IDS } from '@/lib/project-types'
import { sendInvite } from '@/lib/api'
import IconButton from '@/components/ui/IconButton'

interface Props {
  project: Project
  onClose: () => void
}

/**
 * In-project access control. Lets an admin grant each user access to *this*
 * project, pick which tabs they see, and email them an invitation — without
 * leaving the project.
 */
export default function ProjectAccessSheet({ project, onClose }: Props) {
  const { users, permissions, setPermission, getSignedInUser } = usePermissionStore()
  const projectTools = (project.tools?.length ? project.tools : FALLBACK_TOOL_IDS).filter((t) => getTool(t))
  const inviterName = getSignedInUser()?.name

  const members = users.filter((u) => u.systemRole === 'member')
  const admins = users.filter((u) => u.systemRole === 'admin')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0.10 0.01 260 / 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-1)' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--fg-1)' }}>صلاحيات المشروع</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              حدّد من يصل لهذا المشروع وأي تبويبات يراها
            </p>
          </div>
          <IconButton onClick={onClose} aria-label="إغلاق">
            <X size={16} />
          </IconButton>
        </div>

        <div className="p-5 space-y-5">
          {/* Admins — always full access */}
          {admins.length > 0 && (
            <div className="space-y-2">
              <h3 className="axis-label">المدراء</h3>
              {admins.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--color-surface-overlay)', border: '1px solid var(--color-surface-border)' }}
                >
                  <UserBadge user={u} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{u.name}</p>
                    {u.email && <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }} dir="ltr">{u.email}</p>}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--success-500)' }}>وصول كامل</span>
                </div>
              ))}
            </div>
          )}

          {/* Members — granular control */}
          <div className="space-y-2">
            <h3 className="axis-label">الأعضاء</h3>
            {members.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-8 text-center rounded-xl"
                style={{ background: 'var(--color-surface-overlay)', border: '1px dashed var(--color-surface-border)' }}
              >
                <UserPlus size={22} style={{ color: 'var(--color-text-muted)' }} strokeWidth={1.5} />
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا يوجد أعضاء بعد</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  أضف مستخدمين من الإعدادات ← الصلاحيات
                </p>
              </div>
            ) : (
              members.map((u) => (
                <MemberAccessRow
                  key={u.id}
                  user={u}
                  project={project}
                  projectTools={projectTools}
                  inviterName={inviterName}
                  perm={permissions.find((p) => p.userId === u.id && p.projectId === project.id)}
                  onSet={(update) => setPermission(u.id, project.id, update)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserBadge({ user }: { user: Pick<AppUser, 'name' | 'avatar'> }) {
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
      style={{ background: 'var(--iris-500)', color: '#fff' }}
    >
      {user.name.charAt(0)}
    </div>
  )
}

interface MemberRowProps {
  user: AppUser
  project: Project
  projectTools: string[]
  inviterName?: string
  perm: ProjectPermission | undefined
  onSet: (perm: Partial<Pick<ProjectPermission, 'access' | 'deniedTools'>>) => void
}

function MemberAccessRow({ user, project, projectTools, inviterName, perm, onSet }: MemberRowProps) {
  const access = perm?.access ?? 'all'
  const [expanded, setExpanded] = useState(access === 'custom')
  const [inviteState, setInviteState] = useState<'idle' | 'sending' | 'sent' | 'mailto'>('idle')

  const handleAccess = (val: ProjectPermission['access']) => {
    onSet({ access: val, deniedTools: perm?.deniedTools ?? [] })
    if (val === 'custom') setExpanded(true)
  }

  const toggleTool = (toolId: string, denied: boolean) => {
    const current = perm?.deniedTools ?? []
    const next = denied ? [...current, toolId] : current.filter((t) => t !== toolId)
    onSet({ access: 'custom', deniedTools: next })
  }

  // Tools this member would effectively see (respecting global finance/content gates).
  const effectiveLabels = projectTools
    .filter((t) => {
      if (t === 'finance' && !user.isFinance) return false
      if ((t === 'content' || t === 'clients') && !user.isContent) return false
      if (access === 'custom' && (perm?.deniedTools ?? []).includes(t)) return false
      return true
    })
    .map((t) => getTool(t)?.label ?? t)

  const invite = async () => {
    if (!user.email) return
    setInviteState('sending')
    const result = await sendInvite({
      email: user.email,
      name: user.name,
      projectName: project.name,
      toolLabels: effectiveLabels,
      inviterName,
    })
    setInviteState(result === 'sent' ? 'sent' : result === 'mailto' ? 'mailto' : 'idle')
    if (result !== 'failed') setTimeout(() => setInviteState('idle'), 3000)
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-surface-border)' }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--color-surface-overlay)' }}>
        <UserBadge user={user} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{user.name}</p>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {user.email && <span className="truncate" dir="ltr">{user.email}</span>}
            <span>· {user.isFinance ? 'مالي' : 'غير مالي'}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center gap-1 flex-wrap" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
        {(['all', 'custom', 'none'] as const).map((opt) => {
          const on = access === opt
          const tint = opt === 'none' ? 'var(--danger-500)' : opt === 'all' ? 'var(--success-500)' : 'var(--iris-500)'
          return (
            <button
              key={opt}
              onClick={() => handleAccess(opt)}
              className="text-xs px-2.5 py-1 rounded-md transition-colors font-medium"
              style={{
                background: on ? `color-mix(in srgb, ${tint} 18%, transparent)` : 'color-mix(in srgb, var(--fg-3) 10%, transparent)',
                color: on ? tint : 'var(--fg-3)',
              }}
            >
              {opt === 'all' ? 'كامل' : opt === 'custom' ? 'مخصص' : 'مخفي'}
            </button>
          )
        })}
        {access === 'custom' && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-white/10 transition-colors"
            aria-label="تخصيص التبويبات"
          >
            <Settings2 size={13} style={{ color: 'var(--fg-3)' }} />
          </button>
        )}

        {/* Invite */}
        <button
          onClick={invite}
          disabled={!user.email || inviteState === 'sending' || access === 'none'}
          className="ms-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
          style={{ background: 'color-mix(in srgb, var(--iris-500) 14%, transparent)', color: 'var(--iris-500)' }}
          title={user.email ? 'إرسال دعوة بالبريد' : 'لا يوجد بريد لهذا العضو'}
        >
          {inviteState === 'sent' ? <><Check size={12} /> أُرسلت</>
            : inviteState === 'mailto' ? <><Mail size={12} /> فتح البريد</>
            : inviteState === 'sending' ? <>جارٍ…</>
            : <><Send size={12} /> دعوة</>}
        </button>
      </div>

      {access === 'custom' && expanded && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--fg-3)' }}>التبويبات المسموحة:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {projectTools.map((toolId) => {
              const def = getTool(toolId)
              if (!def) return null
              const isFinanceTool = toolId === 'finance'
              const isContentTool = toolId === 'content' || toolId === 'clients'
              const blockedByGlobal = (isFinanceTool && !user.isFinance) || (isContentTool && !user.isContent)
              const isCore = def.core
              const isDenied = blockedByGlobal || (perm?.deniedTools ?? []).includes(toolId)
              return (
                <label
                  key={toolId}
                  title={blockedByGlobal ? (isFinanceTool ? 'محجوب — العضو غير مالي' : 'محجوب — العضو غير محتوى') : isCore ? 'تبويب أساسي' : undefined}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${blockedByGlobal || isCore ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}`}
                >
                  <input
                    type="checkbox"
                    checked={!isDenied}
                    disabled={blockedByGlobal || isCore}
                    onChange={(e) => { if (!blockedByGlobal && !isCore) toggleTool(toolId, !e.target.checked) }}
                    className="rounded"
                  />
                  <span className="text-xs" style={{ color: 'var(--fg-2)' }}>{def.label}</span>
                  {blockedByGlobal && <ShieldOff size={11} style={{ color: 'var(--danger-500)' }} />}
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
