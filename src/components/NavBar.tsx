'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { clsx } from 'clsx'

const allNavItems = [
  { href: '/map', icon: '🗺', label: '지도' },
  { href: '/alerts', icon: '🔔', label: '알림' },
  { href: '/home', icon: '📸', label: '신고홈' },
  { href: '/camera', icon: '📷', label: '카메라' },
  { href: '/checklist', icon: '✅', label: '체크리스트' },
  { href: '/report/new', icon: '📝', label: '신고작성' },
  { href: '/report/manage', icon: '🎉', label: '신고 관리' },
  { href: '/mypage', icon: '👤', label: '마이페이지' },
]

const bottomItems = ['/map', '/home', '/mypage']
const mainNavItems = allNavItems.filter((item) => bottomItems.includes(item.href))
const drawerNavItems = allNavItems.filter((item) => !bottomItems.includes(item.href))

export default function NavBar() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* 데스크탑 사이드바 */}
      <nav className="hidden md:flex flex-col w-48 min-h-screen bg-white border-r border-gray-200 py-6 px-3 gap-1 shrink-0">
        {allNavItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* 모바일 백드롭 */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* 모바일 하단 탭바 + 드로어 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* 드로어 - nav 내부에서 위로 펼쳐짐 */}
        {drawerOpen && (
          <div className="bg-white rounded-t-2xl shadow-xl p-4">
            <div className="grid grid-cols-2 gap-2">
              {drawerNavItems.map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  <span className="text-xl">{icon}</span>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 탭바 */}
        <div className="flex items-center bg-white border-t border-gray-200">
          {mainNavItems.map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs font-medium transition-colors',
                pathname === href ? 'text-blue-600' : 'text-gray-500'
              )}
            >
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}

          {/* 햄버거 버튼 */}
          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            className={clsx(
              'flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs font-medium transition-colors cursor-pointer touch-manipulation',
              drawerOpen ? 'text-blue-600' : 'text-gray-500'
            )}
          >
            <span className="text-xl leading-none">{drawerOpen ? '✕' : '☰'}</span>
            <span>메뉴</span>
          </button>
        </div>
      </nav>
    </>
  )
}
