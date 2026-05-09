'use client'

import Link from 'next/link'
import { useUserStore } from '@/store/userStore'

interface AlertModalProps {
  onClose: () => void
}

export default function AlertModal({ onClose }: AlertModalProps) {
  const { notifications } = useUserStore()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-base text-gray-900">알림</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ✕
          </button>
        </div>

        <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-gray-400">
              알림이 없습니다
            </li>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <li key={n.id} className={`px-5 py-4 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg shrink-0">
                    {n.title.includes('완료') ? '✅' : n.title.includes('반려') ? '❌' : '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{n.title}</p>
                    {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString('ko-KR', {
                        month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="px-5 py-3 border-t border-gray-100">
          <Link
            href="/alerts"
            onClick={onClose}
            className="block text-center text-sm text-blue-600 font-medium hover:underline"
          >
            전체 알림 보기
          </Link>
        </div>
      </div>
    </div>
  )
}
