'use client'

import { useEffect, useState } from 'react'
import ChecklistModal from './ChecklistModal'

interface Props {
  file: File
  onClose: () => void
}

export default function PhotoPreviewModal({ file, onClose }: Props) {
  const [url] = useState(() => URL.createObjectURL(file))
  const [timestamp] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  })
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [gpsLoading, setGpsLoading] = useState(true)
  const [showChecklist, setShowChecklist] = useState(false)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    )
    return () => URL.revokeObjectURL(url)
  }, [url])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <button type="button" onClick={onClose} className="text-white text-sm font-medium">
          ← 다시 선택
        </button>
        <span className="text-white text-sm font-semibold">사진 확인</span>
        <div className="w-16" />
      </div>

      {/* 사진 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="촬영된 사진" className="w-full h-full object-contain" />
      </div>

      {/* 하단 정보 + 버튼 */}
      <div className="shrink-0 bg-black/80 px-4 pt-4 pb-8 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <span>🕐</span>
            <span>{timestamp}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span>📍</span>
            {gpsLoading ? (
              <span className="text-gray-400">GPS 수신 중...</span>
            ) : lat !== null ? (
              <span>{lat.toFixed(6)}, {lng!.toFixed(6)}</span>
            ) : (
              <span className="text-gray-400">위치 정보 없음</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowChecklist(true)}
          className="w-full bg-blue-500 text-white font-semibold py-3.5 rounded-2xl hover:bg-blue-600 transition-colors"
        >
          다음 단계로
        </button>
      </div>

      {showChecklist && (
        <ChecklistModal photoUrl={url} onClose={onClose} />
      )}
    </div>
  )
}
