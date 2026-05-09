'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'

interface Report {
  id: string
  district: string | null
  checklist_items: string[]
  status: '대기' | '완료' | '반려'
  created_at: string
}

const statusStyle: Record<string, string> = {
  대기: 'bg-orange-100 text-orange-600',
  완료: 'bg-green-100 text-green-600',
  반려: 'bg-gray-100 text-gray-500',
}

export default function ReportListSection() {
  const { user } = useUserStore()
  const [reports, setReports] = useState<Report[]>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('reports')
      .select('id, district, checklist_items, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setReports(data ?? []))
  }, [user])

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold text-sm text-gray-700">내 신고 내역</p>
      {reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-8 text-center text-sm text-gray-400">
          신고 내역이 없습니다
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <ul className="divide-y divide-gray-50">
            {reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    📍 {r.district ?? '위치 정보 없음'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString('ko-KR')} · #{r.id.slice(0, 8).toUpperCase()}
                  </p>
                  {r.checklist_items?.[0] && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">
                      {r.checklist_items[0]}
                      {r.checklist_items.length > 1 && ` 외 ${r.checklist_items.length - 1}건`}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusStyle[r.status]}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
