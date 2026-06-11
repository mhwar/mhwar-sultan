'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppUser, ProjectPermission } from '@/types'

/** Outcome of binding the Cloudflare-authenticated identity to a user profile. */
export type BindResult = 'matched' | 'claimed' | 'unprovisioned'

interface PermissionStore {
  users: AppUser[]
  activeUserId: string | null
  permissions: ProjectPermission[]
  /** Email of the Cloudflare Access-authenticated visitor (runtime, not persisted). */
  signedInEmail: string | null

  addUser(data: Omit<AppUser, 'id' | 'createdAt'>): string
  updateUser(id: string, data: Partial<AppUser>): void
  deleteUser(id: string): void
  setActiveUser(id: string | null): void
  setPermission(
    userId: string,
    projectId: string,
    perm: Partial<Pick<ProjectPermission, 'access' | 'deniedTools'>>
  ): void
  removePermission(userId: string, projectId: string): void

  /** Map a verified Cloudflare Access email onto an in-app user + permissions. */
  bindIdentity(email: string, name?: string): BindResult

  getActiveUser(): AppUser | null
  getSignedInUser(): AppUser | null
  canAccessProject(projectId: string): boolean
  getEffectiveTools(projectId: string, allTools: string[]): string[]
  /** Whether the active user may see monetary figures (contract values, finance). */
  canSeeFinancials(): boolean
}

export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set, get) => ({
      users: [
        {
          id: 'admin-default',
          name: 'المسؤول',
          systemRole: 'admin',
          isFinance: true,
          isContent: true,
          createdAt: new Date().toISOString(),
        },
      ],
      activeUserId: null,
      permissions: [],
      signedInEmail: null,

      addUser(data) {
        const id = `user-${Date.now()}`
        set((s) => ({
          users: [...s.users, { ...data, id, createdAt: new Date().toISOString() }],
        }))
        return id
      },

      updateUser(id, data) {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
        }))
      },

      deleteUser(id) {
        set((s) => ({
          users: s.users.filter((u) => u.id !== id),
          permissions: s.permissions.filter((p) => p.userId !== id),
          activeUserId: s.activeUserId === id ? null : s.activeUserId,
        }))
      },

      setActiveUser(id) {
        set({ activeUserId: id })
      },

      bindIdentity(email, name) {
        const normalized = email.toLowerCase()
        const { users } = get()

        // 1) Exact match on a provisioned user's email → adopt their identity.
        const match = users.find((u) => u.email?.toLowerCase() === normalized)
        if (match) {
          set({ signedInEmail: normalized, activeUserId: match.id })
          return 'matched'
        }

        // 2) Bootstrap: the first authenticated visitor claims the unclaimed
        //    default admin, so the owner becomes admin on first sign-in.
        const admin = users.find((u) => u.id === 'admin-default')
        if (admin && !admin.email) {
          set((s) => ({
            users: s.users.map((u) =>
              u.id === 'admin-default'
                ? { ...u, email: normalized, name: name?.trim() || u.name }
                : u
            ),
            signedInEmail: normalized,
            activeUserId: 'admin-default',
          }))
          return 'claimed'
        }

        // 3) Authenticated at the edge but not provisioned in-app yet.
        set({ signedInEmail: normalized, activeUserId: null })
        return 'unprovisioned'
      },

      setPermission(userId, projectId, perm) {
        set((s) => {
          const existing = s.permissions.find(
            (p) => p.userId === userId && p.projectId === projectId
          )
          if (existing) {
            return {
              permissions: s.permissions.map((p) =>
                p.userId === userId && p.projectId === projectId ? { ...p, ...perm } : p
              ),
            }
          }
          return {
            permissions: [
              ...s.permissions,
              { userId, projectId, access: 'all', deniedTools: [], ...perm },
            ],
          }
        })
      },

      removePermission(userId, projectId) {
        set((s) => ({
          permissions: s.permissions.filter(
            (p) => !(p.userId === userId && p.projectId === projectId)
          ),
        }))
      },

      getActiveUser() {
        const { users, activeUserId } = get()
        if (!activeUserId) return null
        return users.find((u) => u.id === activeUserId) ?? null
      },

      getSignedInUser() {
        const { users, signedInEmail } = get()
        if (!signedInEmail) return null
        return users.find((u) => u.email?.toLowerCase() === signedInEmail) ?? null
      },

      canAccessProject(projectId) {
        const { activeUserId, permissions } = get()
        const user = get().getActiveUser()
        if (!activeUserId || !user) return true
        if (user.systemRole === 'admin') return true
        const perm = permissions.find(
          (p) => p.userId === activeUserId && p.projectId === projectId
        )
        if (!perm) return true
        return perm.access !== 'none'
      },

      getEffectiveTools(projectId, allTools) {
        const { activeUserId, permissions } = get()
        const user = get().getActiveUser()
        if (!activeUserId || !user) return allTools
        if (user.systemRole === 'admin') return allTools

        let tools = [...allTools]

        if (!user.isFinance) {
          tools = tools.filter((t) => t !== 'finance')
        }
        if (!user.isContent) {
          tools = tools.filter((t) => t !== 'content' && t !== 'clients')
        }

        const perm = permissions.find(
          (p) => p.userId === activeUserId && p.projectId === projectId
        )
        if (perm?.access === 'custom' && perm.deniedTools.length > 0) {
          tools = tools.filter((t) => !perm.deniedTools.includes(t))
        }

        return tools
      },

      canSeeFinancials() {
        const user = get().getActiveUser()
        if (!user) return true // unrestricted local mode / admin preview off
        if (user.systemRole === 'admin') return true
        return user.isFinance
      },
    }),
    {
      name: 'mhwar-permissions',
      version: 1,
      skipHydration: true,
      // `signedInEmail` is resolved fresh from Cloudflare Access on each load.
      partialize: (s) => ({
        users: s.users,
        activeUserId: s.activeUserId,
        permissions: s.permissions,
      }),
    }
  )
)

/**
 * Reactive hook: whether the active user may see monetary figures
 * (client contract values, the billing tab, finance entries). Re-renders the
 * caller when the active user or their finance flag changes. Unrestricted local
 * mode (no active user) and admins always see financials.
 */
export function useCanSeeFinancials(): boolean {
  return usePermissionStore((s) => {
    const user = s.activeUserId ? s.users.find((u) => u.id === s.activeUserId) : null
    if (!user) return true
    if (user.systemRole === 'admin') return true
    return user.isFinance
  })
}
