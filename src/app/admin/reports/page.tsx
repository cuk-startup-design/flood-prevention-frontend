'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { supabase } from '@/lib/supabase'

type Status = '전체' | '대기' | '완료' | '반려'

interface Report {
  id: string
  user_id: string
  district: string | null
  lat: number | null
  lng: number | null
  checklist_items: string[]
  photo_url: string | null
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
  const [selected, setSelected] = useState<Report | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [highRiskDistricts, setHighRiskDistricts] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/rainfall/districts')
      .then((r) => r.json())
      .then((data: Record<string, { risk: string }>) => {
        const high = new Set(Object.entries(data).filter(([, d]) => d.risk === 'high').map(([name]) => name))
        setHighRiskDistricts(high)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    supabase
      .from('reports')
      .select('id, user_id, district, lat, lng, checklist_items, photo_url, status, created_at, profiles(name)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports((data as unknown as Report[]) ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    setSelectedAddress(null)
    if (!selected?.lat || !selected?.lng) return
    const { lat, lng } = selected

    const geocode = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geocoder = new (window as any).kakao.maps.services.Geocoder()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      geocoder.coord2Address(lng, lat, (result: any, status: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (status === (window as any).kakao.maps.services.Status.OK) {
          const addr = result[0].address
          setSelectedAddress(`${addr.region_2depth_name} ${addr.region_3depth_name}`)
        }
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const kakao = (window as any).kakao
    if (kakao?.maps?.services) geocode()
    else if (kakao?.maps) kakao.maps.load(geocode)
  }, [selected])

  const filtered = activeTab === '전체' ? reports : reports.filter((r) => r.status === activeTab)

  const updateStatus = async (report: Report, status: '완료' | '반려') => {
    await supabase.from('reports').update({ status }).eq('id', report.id)

    await supabase.from('notifications').insert({
      user_id: report.user_id,
      title: status === '완료' ? '신고가 처리 완료되었습니다' : '신고가 반려되었습니다',
      body: `${report.district ?? ''} 지역 신고 #${report.id.slice(0, 8).toUpperCase()}`,
    })

    setReports((prev) => prev.map((r) => r.id === report.id ? { ...r, status } : r))
    setSelected((prev) => prev?.id === report.id ? { ...prev, status } : prev)
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=services`}
        strategy="afterInteractive"
      />
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
                {['사진', '신고번호', '신고자', '지역', '주요 증상', '일시', '상태', '조치'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {r.photo_url ? (
                      <a href={r.photo_url} target="_blank" rel="noreferrer">
                        <img src={r.photo_url} alt="신고 사진" className="w-10 h-10 rounded-lg object-cover hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 text-xs">없음</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">#{r.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{r.profiles?.name ?? '알 수 없음'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-600 text-sm">{r.district ?? '-'}</span>
                      {r.district && highRiskDistricts.has(r.district) && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold shrink-0">긴급</span>
                      )}
                    </div>
                  </td>
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
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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

      {/* 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-base text-gray-900">신고 상세</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">#{selected.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {selected.photo_url ? (
                <a href={selected.photo_url} target="_blank" rel="noreferrer">
                  <img
                    src={selected.photo_url}
                    alt="신고 사진"
                    className="w-full h-48 object-cover rounded-xl hover:opacity-90 transition-opacity"
                  />
                </a>
              ) : (
                <div className="w-full h-32 rounded-xl bg-gray-100 flex items-center justify-center text-sm text-gray-400">사진 없음</div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">신고자</p>
                  <p className="font-medium text-gray-800">{selected.profiles?.name ?? '알 수 없음'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">위치</p>
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-gray-800">
                      {selectedAddress ?? selected.district ?? '-'}
                    </p>
                    {selected.district && highRiskDistricts.has(selected.district) && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">긴급</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">신고 일시</p>
                  <p className="font-medium text-gray-800 text-xs">
                    {new Date(selected.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">상태</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">신고 항목</p>
                <ul className="flex flex-col gap-1">
                  {selected.checklist_items?.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {selected.status === '대기' && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => updateStatus(selected, '완료')}
                    className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(selected, '반려')}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                  >
                    반려
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
