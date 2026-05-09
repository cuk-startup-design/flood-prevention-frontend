'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import AlertModal from './AlertModal'
import { useUserStore } from '@/store/userStore'
import { supabase } from '@/lib/supabase'

const pageTitles: Record<string, string> = {
  '/home': '홈',
  '/map': '지도',
  '/alerts': '알림',
  '/report/new': '신고하기',
  '/report/manage': '신고 관리',
  '/mypage': '마이페이지',
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] ?? ''
  const [alertOpen, setAlertOpen] = useState(false)
  const { notifications, markAllRead } = useUserStore()
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleBellClick = () => {
    setAlertOpen(true)
    if (unreadCount > 0) {
      markAllRead()
      // DB에도 읽음 처리
      const ids = notifications.filter((n) => !n.is_read).map((n) => n.id)
      supabase.from('notifications').update({ is_read: true }).in('id', ids).then(() => {})
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {alertOpen && <AlertModal onClose={() => setAlertOpen(false)} />}
      <header className="sticky top-0 z-40 bg-white">
        <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100">
          <span className="font-bold text-blue-600 text-sm">
            🌊 홍수 예방 시스템
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBellClick}
              className="relative text-xl text-gray-500"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <Link href="/mypage" className="text-xl text-gray-500">👤</Link>
            <button type="button" onClick={handleLogout} className="text-xl text-red-400">🚪</button>
          </div>
        </div>
        <div className="flex items-center px-4 h-11 border-b border-gray-100">
          <span className="font-semibold text-base">{title}</span>
        </div>
      </header>
    </>
  )
}
