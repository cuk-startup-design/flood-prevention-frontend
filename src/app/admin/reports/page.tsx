'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Status = '전체' | '대기' | '완료' | '반려'

interface Report {
  id: string
  user_id: string
  district: string | null
  checklist_items: string[]
  status: '대기' | '완료' | '반려'
  created_at: string
  profiles: { name: string | null } | null
}

const statusStyle: Record<string, string> = {
  대기: 'bg-orange-100 text-orange-600',
  완료: 'bg-green-100 text-green-600',
  반려: 'bg-gray-100 text-gray-500',
}

const tabs: Status[] = ['전체', '대기', '완료', '반려']

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<Status>('전체')
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('reports')
      .select('id, user_id, district, checklist_items, status, created_at, profiles(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports((data as unknown as Report[]) ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = activeTab === '전체' ? reports : reports.filter((r) => r.status === activeTab)

  const updateStatus = async (report: Report, status: '완료' | '반려') => {
    await supabase.from('reports').update({ status }).eq('id', report.id)

    await supabase.from('notifications').insert({
      user_id: report.user_id,
      title: status === '완료' ? '신고가 처리 완료되었습니다' : '신고가 반려되었습니다',
      body: `${report.district ?? ''} 지역 신고 #${report.id.slice(0, 8).toUpperCase()}`,
    })

    setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status } : r))
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-900">신고 관리</h1>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
              activeTab === tab
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {tab}
            {tab !== '전체' && (
              <span className="ml-1.5 text-xs">{reports.filter((r) => r.status === tab).length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['신고번호', '신고자', '지역', '주요 증상', '일시', '상태', '조치'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">#{r.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.profiles?.name ?? '알 수 없음'}</td>
                  <td className="px-4 py-3 text-gray-600">{r.district ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                    {r.checklist_items?.[0]}{(r.checklist_items?.length ?? 0) > 1 && ` 외 ${r.checklist_items.length - 1}건`}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === '대기' ? (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateStatus(r, '완료')}
                          className="text-xs px-2.5 py-1 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(r, '반려')}
                          className="text-xs px-2.5 py-1 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                          반려
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">신고 내역이 없습니다</div>
        )}
      </div>
    </div>
  )
}
