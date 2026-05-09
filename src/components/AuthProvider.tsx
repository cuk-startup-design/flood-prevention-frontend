'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, setNotifications, addNotification } = useUserStore()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
  }

  const subscribeNotifications = (userId: string) => {
    return supabase
      .channel(`notifications:${userId}:${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => addNotification(payload.new as any)
      )
      .subscribe()
  }

  const removeChannel = (channel: ReturnType<typeof subscribeNotifications> | null) => {
    if (channel) supabase.removeChannel(channel)
  }

  useEffect(() => {
    let notificationChannel: ReturnType<typeof subscribeNotifications> | null = null

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchNotifications(session.user.id),
        ]).finally(() => setLoading(false))
        notificationChannel = subscribeNotifications(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchNotifications(session.user.id)
        removeChannel(notificationChannel)
        notificationChannel = subscribeNotifications(session.user.id)
      } else {
        setProfile(null)
        setNotifications([])
        removeChannel(notificationChannel)
        notificationChannel = null
      }
    })

    return () => {
      subscription.unsubscribe()
      removeChannel(notificationChannel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
