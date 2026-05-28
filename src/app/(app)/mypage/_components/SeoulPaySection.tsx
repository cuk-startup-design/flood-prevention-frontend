'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'

interface CompletedReport {
  id: string
  created_at: string
}

const POINTS_PER_REPORT = 500

export default function SeoulPaySection() {
  const { user } = useUserStore()
  const [recent, setRecent] = useState<CompletedReport[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase
        .from('reports')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('status', '완료')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', '완료'),
    ]).then(([recentRes, countRes]) => {
      setRecent(recentRes.data ?? [])
      setTotalCount(countRes.count ?? 0)
      setLoading(false)
    })
  }, [user])

  const totalPoints = totalCount * POINTS_PER_REPORT

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold text-sm text-gray-700">최근 경기페이 적립 내역</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : recent.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">적립 내역이 없습니다</div>
        ) : (
          <>
            <ul className="divide-y divide-gray-50">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm text-gray-700">하수구 신고 완료</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString('ko-KR')} · #{r.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">+{POINTS_PER_REPORT.toLocaleString()}P</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">누적 합계</span>
              <span className="text-base font-bold text-blue-600">{totalPoints.toLocaleString()}P</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
