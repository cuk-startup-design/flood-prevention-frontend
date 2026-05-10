'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

function notificationStyle(title: string) {
  if (title.includes('완료')) return { bg: 'bg-green-50', icon: '✅', dot: 'bg-green-400' }
  if (title.includes('반려')) return { bg: 'bg-gray-50', icon: '❌', dot: 'bg-gray-400' }
  return { bg: 'bg-blue-50', icon: '📋', dot: 'bg-blue-400' }
}

export default function AlertsPage() {
  const { user, notifications, markAllRead } = useUserStore()

  useEffect(() => {
    if (!user || notifications.every((n) => n.is_read)) return
    markAllRead()
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
  }, [user, notifications, markAllRead])

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-lg font-bold text-gray-900">알림</h1>
        <p className="text-xs text-gray-400 mt-0.5">총 {notifications.length}개</p>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
          <span className="text-4xl">🔔</span>
          <p className="text-sm">알림이 없습니다</p>
        </div>
      ) : (
        <ul className="flex flex-col px-4 gap-2 pb-6">
          {notifications.map((n) => {
            const style = notificationStyle(n.title)
            return (
              <li
                key={n.id}
                className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 ${!n.is_read ? style.bg : 'bg-white border border-gray-100'}`}
              >
                <span className="text-xl shrink-0 mt-0.5">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    {!n.is_read && (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                    )}
                  </div>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1.5">{timeAgo(n.created_at)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
