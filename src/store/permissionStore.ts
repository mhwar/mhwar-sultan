'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppUser, ProjectPermission } from '@/types'

interface PermissionStore {
  users: AppUser[]
  activeUserId: string | null
  permissions: ProjectPermission[]

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

  getActiveUser(): AppUser | null
  canAccessProject(projectId: string): boolean
  getEffectiveTools(projectId: string, allTools: string[]): string[]
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
    }),
    {
      name: 'mhwar-permissions',
      version: 1,
      skipHydration: true,
    }
  )
)
