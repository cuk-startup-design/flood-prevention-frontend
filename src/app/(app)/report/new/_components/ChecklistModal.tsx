'use client'

import { useState } from 'react'
import ReportCompleteModal from './ReportCompleteModal'

interface Props {
  photoUrl: string
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

export default function ChecklistModal({ photoUrl, onClose }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [showComplete, setShowComplete] = useState(false)

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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
        <button
          type="button"
          onClick={() => setShowComplete(true)}
          disabled={selected.size === 0}
          className="w-full bg-blue-500 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-600 transition-colors disabled:bg-gray-200 disabled:text-gray-400"
        >
          신고 완료 {selected.size > 0 && `(${selected.size}개 선택)`}
        </button>
      </div>

      {showComplete && <ReportCompleteModal onClose={onClose} />}
    </div>
  )
}
