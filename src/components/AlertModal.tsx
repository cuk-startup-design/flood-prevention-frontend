'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Alert {
  id: number
  district: string
  from: string
  to: string
  date: string
  time: string
}

const dummyAlerts: Alert[] = [
  {
    id: 1,
    district: '강서구',
    from: '낮음',
    to: '높음',
    date: '2025.04.30',
    time: '14:32',
  },
  {
    id: 2,
    district: '마포구',
    from: '보통',
    to: '높음',
    date: '2025.04.30',
    time: '13:15',
  },
  {
    id: 3,
    district: '송파구',
    from: '낮음',
    to: '보통',
    date: '2025.04.30',
    time: '11:48',
  },
]

const riskColor: Record<string, string> = {
  낮음: 'text-green-600',
  보통: 'text-yellow-500',
  높음: 'text-red-500',
}

interface AlertModalProps {
  onClose: () => void
}

export default function AlertModal({ onClose }: AlertModalProps) {
  const router = useRouter()

  const handleMapLink = () => {
    onClose()
    router.push('/map')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* 모달 카드 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-base text-gray-900">실시간 알림</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 알림 목록 */}
        <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
          {dummyAlerts.map((alert) => (
            <li key={alert.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {alert.district}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    침수위험도{' '}
                    <span className={riskColor[alert.from]}>{alert.from}</span>
                    {' → '}
                    <span className={riskColor[alert.to]}>{alert.to}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {alert.date} {alert.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMapLink}
                  className="shrink-0 text-xs text-blue-600 font-medium border border-blue-200 rounded-lg px-2.5 py-1.5 hover:bg-blue-50 transition-colors"
                >
                  지도에서 확인
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* 하단 */}
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
