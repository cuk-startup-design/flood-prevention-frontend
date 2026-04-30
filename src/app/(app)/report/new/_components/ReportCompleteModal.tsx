'use client'

import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
}

const reportNumber = `#${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9000) + 1000)}`

export default function ReportCompleteModal({ onClose }: Props) {
  const router = useRouter()

  const handleMapReturn = () => {
    onClose()
    router.push('/map')
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* 헤더 */}
        <div className="text-center pt-6 pb-2 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">신고 완료</p>
        </div>

        {/* 완료 아이콘 + 메시지 */}
        <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
          <div className="w-16 h-16 rounded-full border-2 border-green-400 flex items-center justify-center">
            <span className="text-green-500 text-3xl">✓</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg text-gray-900">
              신고가 접수되었습니다
            </p>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              담당 공무원이 배정되어
              <br />
              즉시 처리를 시작합니다
            </p>
          </div>
        </div>

        {/* 적립 내역 */}
        <div className="mx-4 mb-5 rounded-xl bg-gray-50 px-4 py-3 flex flex-col gap-2.5">
          <p className="text-xs font-semibold text-gray-500">
            서울페이 적립 내역
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">신고 기본</span>
            <span className="font-bold text-blue-600">+500P</span>
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">담당 공무원</span>
            <span className="text-green-600 font-medium">배정 완료 ✓</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">예상 처리</span>
            <span className="text-gray-700">24시간 이내</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">신고 번호</span>
            <span className="text-gray-700">{reportNumber}</span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="px-4 pb-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleMapReturn}
            className="w-full bg-blue-500 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-600 transition-colors"
          >
            지도로 돌아가기
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              router.push('/mypage')
            }}
            className="w-full text-sm text-blue-600 font-medium py-1"
          >
            마이페이지에서 확인
          </button>
        </div>
      </div>
    </div>
  )
}
