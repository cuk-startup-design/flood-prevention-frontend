'use client'

import { useRef, useState } from 'react'

export default function ReportNewPage() {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* 배너 */}
      <div className="bg-blue-500 rounded-2xl p-5 text-white flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-3xl">📷</span>
          <p className="font-bold text-lg leading-snug">막힌 하수구, 지금 신고하세요</p>
          <p className="text-sm text-blue-100">사진 + 체크리스트로 3초 완료 · +500P</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-sm font-semibold"
          >
            <span>📷</span> 카메라로 촬영
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 transition-colors text-sm font-semibold"
          >
            <span>🖼️</span> 저장된 사진
          </button>
        </div>
      </div>

      {/* 위치 정보 */}
      <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex flex-col gap-1">
        <p className="text-sm text-gray-500">📍 강남구 역삼동</p>
        <p className="font-semibold text-sm text-gray-900">
          주변 미처리 하수구 12개 발견
        </p>
      </div>

      {/* 신고 절차 */}
      <div className="flex flex-col gap-3">
        <p className="font-semibold text-sm text-gray-700">신고 절차</p>
        {[
          { step: 1, title: '사진 촬영', desc: 'GPS + 타임스탬프 자동 기록' },
          {
            step: 2,
            title: '상태 체크리스트',
            desc: '막힘 / 이물질 / 악취 상태 선택',
          },
          {
            step: 3,
            title: '신고 완료 + 서울페이 적립',
            desc: '담당 공무원 즉시 배정',
          },
        ].map(({ step, title, desc }) => (
          <div
            key={step}
            className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3"
          >
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step}
            </span>
            <div>
              <p className="font-semibold text-sm text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 숨겨진 input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* 사진 미리보기 */}
      {preview && (
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-sm text-gray-700">선택된 사진</p>
          <div className="relative rounded-2xl overflow-hidden border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="미리보기"
              className="w-full object-cover max-h-64"
            />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <button
            type="button"
            className="w-full bg-blue-500 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-600 transition-colors"
          >
            다음 단계로
          </button>
        </div>
      )}
    </div>
  )
}
