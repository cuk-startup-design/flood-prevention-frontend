'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'
import ReportCompleteModal from './ReportCompleteModal'

interface Props {
  photoUrl: string
  file: File
  lat: number | null
  lng: number | null
  onClose: () => void
}

type Category = '위험 징후' | '주의 징후' | '기타'

interface CheckItem {
  id: number
  title: string
  desc: string
  category: Category
}

const items: CheckItem[] = [
  { id: 1, title: '악취가 심하게 난다', desc: '하수가 역류하거나 내부 막힘 가능성', category: '위험 징후' },
  { id: 2, title: '물이 고여 빠지지 않는다', desc: '빗물이 배수되지 않고 웅덩이 형성', category: '위험 징후' },
  { id: 3, title: '오물·쓰레기가 쌓여있다', desc: '담배꽁초, 비닐 등 이물질로 입구 막힘', category: '위험 징후' },
  { id: 4, title: '낙엽·흙으로 덮여있다', desc: '계절성 이물질 퇴적으로 부분 차단', category: '주의 징후' },
  { id: 5, title: '격자 덮개가 파손·변형됐다', desc: '뚜껑 손상으로 이물질 유입 증가 우려', category: '주의 징후' },
  { id: 6, title: '배수 속도가 느리다', desc: '완전 막힘 전 단계, 청소 필요', category: '주의 징후' },
  { id: 7, title: '하수구 주변이 침하됐다', desc: '지반 꺼짐으로 구조적 점검 필요', category: '기타' },
  { id: 8, title: '위치 식별이 어렵다', desc: '도로 표면과 동화되어 하수구 찾기 어려움', category: '기타' },
]

const categoryStyle: Record<Category, string> = {
  '위험 징후': 'bg-red-100 text-red-600',
  '주의 징후': 'bg-yellow-100 text-yellow-600',
  '기타': 'bg-gray-100 text-gray-500',
}

const categories: Category[] = ['위험 징후', '주의 징후', '기타']

const GYEONGGI_SIGUN = [
  { name: '수원시',  lat: 37.2636, lng: 127.0286 }, { name: '성남시',  lat: 37.4449, lng: 127.1389 },
  { name: '의정부시', lat: 37.7381, lng: 127.0339 }, { name: '안양시',  lat: 37.3943, lng: 126.9568 },
  { name: '부천시',  lat: 37.5035, lng: 126.7660 }, { name: '광명시',  lat: 37.4786, lng: 126.8643 },
  { name: '평택시',  lat: 36.9921, lng: 127.1128 }, { name: '동두천시', lat: 37.9035, lng: 127.0600 },
  { name: '안산시',  lat: 37.3236, lng: 126.8219 }, { name: '고양시',  lat: 37.6584, lng: 126.8320 },
  { name: '과천시',  lat: 37.4292, lng: 126.9874 }, { name: '구리시',  lat: 37.5943, lng: 127.1298 },
  { name: '남양주시', lat: 37.6358, lng: 127.2165 }, { name: '오산시',  lat: 37.1498, lng: 127.0772 },
  { name: '시흥시',  lat: 37.3800, lng: 126.8029 }, { name: '군포시',  lat: 37.3613, lng: 126.9350 },
  { name: '의왕시',  lat: 37.3449, lng: 126.9681 }, { name: '하남시',  lat: 37.5397, lng: 127.2148 },
  { name: '용인시',  lat: 37.2410, lng: 127.1775 }, { name: '파주시',  lat: 37.7599, lng: 126.7800 },
  { name: '이천시',  lat: 37.2723, lng: 127.4353 }, { name: '안성시',  lat: 37.0079, lng: 127.2797 },
  { name: '김포시',  lat: 37.6148, lng: 126.7157 }, { name: '화성시',  lat: 37.1996, lng: 126.8314 },
  { name: '광주시',  lat: 37.4295, lng: 127.2554 }, { name: '양주시',  lat: 37.7852, lng: 127.0456 },
  { name: '포천시',  lat: 37.8946, lng: 127.2003 }, { name: '여주시',  lat: 37.2983, lng: 127.6376 },
  { name: '연천군',  lat: 38.0969, lng: 127.0750 }, { name: '가평군',  lat: 37.8311, lng: 127.5097 },
  { name: '양평군',  lat: 37.4919, lng: 127.4875 },
]

function nearestSigun(lat: number, lng: number) {
  let nearest = GYEONGGI_SIGUN[0]
  let minDist = Infinity
  for (const d of GYEONGGI_SIGUN) {
    const dist = (d.lat - lat) ** 2 + (d.lng - lng) ** 2
    if (dist < minDist) { minDist = dist; nearest = d }
  }
  return nearest.name
}

export default function ChecklistModal({ photoUrl, file, lat, lng, onClose }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [reportId, setReportId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [areaRisk, setAreaRisk] = useState<'low' | 'medium' | 'high' | null>(null)
  const [areaSigun, setAreaSigun] = useState<string | null>(null)
  const [photoAnalysis, setPhotoAnalysis] = useState<{ risk: string; label: string; reason: string; suggestedIds: number[] } | null>(null)
  const [analyzing, setAnalyzing] = useState(true)
  const { user } = useUserStore()

  useEffect(() => {
    if (!lat || !lng) return
    fetch(`/api/rainfall?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.risk) setAreaRisk(data.risk)
        if (data.sigun) setAreaSigun(data.sigun)
      })
      .catch(() => {})
  }, [lat, lng])

  useEffect(() => {
    const form = new FormData()
    form.append('image', file)
    fetch('/api/analyze-photo', { method: 'POST', body: form })
      .then((r) => r.json())
      .then((data) => {
        setPhotoAnalysis(data)
        if (data.suggestedIds?.length > 0) {
          setSelected(new Set(data.suggestedIds))
        }
      })
      .catch(() => {})
      .finally(() => setAnalyzing(false))
  }, [file])

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!user) { setError('로그인이 필요합니다.'); return }
    setLoading(true)
    setError('')

    // 사진 업로드
    let photoStorageUrl: string | null = null
    const ext = file.type.split('/')[1] ?? 'jpg'
    const filePath = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('report-photos')
      .upload(filePath, file, { contentType: file.type })
    if (uploadError) {
      setLoading(false)
      setError(`사진 업로드 실패: ${uploadError.message}`)
      return
    }
    const { data: { publicUrl } } = supabase.storage
      .from('report-photos')
      .getPublicUrl(filePath)
    photoStorageUrl = publicUrl

    // 신고 저장
    const district = lat && lng ? nearestSigun(lat, lng) : null
    const checklistItems = Array.from(selected).map((id) => items.find((i) => i.id === id)!.title)
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        photo_url: photoStorageUrl,
        lat,
        lng,
        district,
        checklist_items: checklistItems,
        status: '대기',
      })

    setLoading(false)

    if (insertError) {
      setError('신고 저장에 실패했습니다. 다시 시도해주세요.')
      return
    }

    setReportId(crypto.randomUUID())
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <button type="button" onClick={onClose} className="text-gray-500 text-sm font-medium">
          ← 뒤로
        </button>
        <span className="font-semibold text-sm text-gray-900">상태 체크리스트</span>
        <div className="w-12" />
      </div>

      {/* 사진 썸네일 + 선택 카운트 */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt="신고 사진" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
        <div>
          <p className="font-bold text-sm text-gray-900">
            <span className="text-blue-600">{selected.size}개</span> 선택된 항목
          </p>
          <p className="text-xs text-gray-400 mt-0.5">해당하는 항목을 모두 선택해주세요</p>
        </div>
      </div>

      {/* AI 사진 분석 결과 */}
      {analyzing ? (
        <div className="px-4 py-3 flex items-center gap-2.5 bg-blue-50 border-b border-blue-100 shrink-0">
          <span className="text-base">🤖</span>
          <p className="text-xs text-blue-600 font-medium">AI가 사진을 분석하고 있어요...</p>
        </div>
      ) : photoAnalysis && photoAnalysis.risk !== 'none' && photoAnalysis.risk !== 'low' && (
        <div className={`px-4 py-3 flex items-start gap-2.5 shrink-0 border-b ${
          photoAnalysis.risk === 'high' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'
        }`}>
          <span className="text-base mt-0.5">🤖</span>
          <div className="flex-1">
            <p className={`text-xs font-bold mb-0.5 ${photoAnalysis.risk === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>
              AI 사진 분석 — {photoAnalysis.label}
            </p>
            <p className={`text-xs ${photoAnalysis.risk === 'high' ? 'text-red-600' : 'text-yellow-600'}`}>
              {photoAnalysis.reason}
            </p>
            {photoAnalysis.suggestedIds?.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">관련 항목 {photoAnalysis.suggestedIds.length}개를 자동으로 선택했어요</p>
            )}
          </div>
        </div>
      )}

      {/* AI 위험도 기반 추천 배너 */}
      {areaRisk && areaRisk !== 'low' && (
        <div className={`px-4 py-3 flex items-start gap-2.5 shrink-0 border-b ${
          areaRisk === 'high' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'
        }`}>
          <span className="text-base mt-0.5">📍</span>
          <div>
            <p className={`text-xs font-bold mb-0.5 ${areaRisk === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>
              현재 위치 위험도 — {areaSigun} {areaRisk === 'high' ? '높음' : '보통'}
            </p>
            <p className={`text-xs ${areaRisk === 'high' ? 'text-red-600' : 'text-yellow-600'}`}>
              {areaRisk === 'high'
                ? '위험 징후 항목을 우선 확인하고 즉시 신고해주세요.'
                : '주의 징후 항목을 확인해 조기 대응해주세요.'}
            </p>
          </div>
        </div>
      )}

      {/* 체크리스트 */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="px-4 py-2 bg-gray-50 border-y border-gray-100">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryStyle[cat]}`}>
                {cat}
              </span>
            </div>
            <ul>
              {items.filter((item) => item.category === cat).map((item) => {
                const checked = selected.has(item.id)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 text-left"
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}>
                        {checked && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${checked ? 'text-blue-600' : 'text-gray-900'}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="px-4 py-4 border-t border-gray-100 shrink-0">
        {error && <p className="text-red-500 text-xs text-center mb-2">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selected.size === 0 || loading}
          className="w-full bg-blue-500 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
        >
          {loading ? '신고 접수 중...' : `신고 완료 ${selected.size > 0 ? `(${selected.size}개 선택)` : ''}`}
        </button>
      </div>

      {reportId && <ReportCompleteModal reportId={reportId} onClose={onClose} />}
    </div>
  )
}
