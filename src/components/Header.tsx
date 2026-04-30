'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import AlertModal from './AlertModal'

const pageTitles: Record<string, string> = {
  '/home': '신고홈',
  '/map': '지도',
  '/alerts': '알림',
  '/camera': '카메라',
  '/checklist': '체크리스트',
  '/report/new': '신고하기',
  '/report/manage': '신고 관리',
  '/mypage': '마이페이지',
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] ?? ''
  const [alertOpen, setAlertOpen] = useState(false)

  return (
    <>
      {alertOpen && <AlertModal onClose={() => setAlertOpen(false)} />}
      <header className="sticky top-0 z-40 bg-white">
        {/* 고정 탑바 */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-gray-100">
          <span className="font-bold text-blue-600 text-sm">
            🌊 홍수 예방 시스템
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAlertOpen(true)}
              className="text-xl text-gray-500"
            >
              🔔
            </button>
            <Link href="/mypage" className="text-xl text-gray-500">
              👤
            </Link>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-xl text-red-400"
            >
              🚪
            </button>
          </div>
        </div>

        {/* 동적 서브바 */}
        <div className="flex items-center px-4 h-11 border-b border-gray-100">
          <span className="font-semibold text-base">{title}</span>
        </div>
      </header>
    </>
  )
}
