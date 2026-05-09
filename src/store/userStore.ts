import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
  district: string | null
  created_at: string
}

export interface Notification {
  id: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

interface UserStore {
  user: User | null
  profile: Profile | null
  loading: boolean
  notifications: Notification[]
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAllRead: () => void
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  profile: null,
  loading: true,
  notifications: [],
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    })),
}))
