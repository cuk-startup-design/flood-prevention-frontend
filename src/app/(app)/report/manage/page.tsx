'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'

const tabs = ['진행중', '완료'] as const
type Tab = (typeof tabs)[number]

interface Report {
  id: string
  district: string | null
  checklist_items: string[]
  status: '대기' | '완료' | '반려'
  photo_url: string | null
  created_at: string
}

const statusStyle: Record<string, string> = {
  대기: 'bg-orange-100 text-orange-600',
  완료: 'bg-green-100 text-green-600',
  반려: 'bg-gray-100 text-gray-500',
}

export default function ReportManagePage() {
  const [activeTab, setActiveTab] = useState<Tab>('진행중')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUserStore()

  useEffect(() => {
    if (!user) return
    supabase
      .from('reports')
      .select('id, district, checklist_items, status, photo_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data ?? [])
        setLoading(false)
      })
  }, [user])

  const inProgress = reports.filter((r) => r.status === '대기')
  const done = reports.filter((r) => r.status === '완료' || r.status === '반려')
  const filtered = activeTab === '진행중' ? inProgress : done

  return (
    <div className="flex flex-col">
      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => {
          const count = tab === '진행중' ? inProgress.length : done.length
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              )}
            >
              {tab}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="p-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <span className="text-sm text-gray-400">불러오는 중...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm gap-2">
            <span className="text-3xl">📋</span>
            <span>{activeTab === '진행중' ? '진행중인' : '완료된'} 신고가 없습니다</span>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex gap-3 p-4">
                {r.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.photo_url}
                    alt="신고 사진"
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center text-gray-400 text-xl">
                    📷
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      #{r.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    📍 {r.district ?? '위치 정보 없음'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {r.checklist_items?.[0] ?? ''}
                    {(r.checklist_items?.length ?? 0) > 1 && ` 외 ${r.checklist_items.length - 1}건`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
