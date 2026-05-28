'use client'

import { useEffect, useState } from 'react'
import WeatherCharacter from './_components/WeatherCharacter'
import BackgroundScene from './_components/BackgroundScene'

type RiskLevel = 'low' | 'medium' | 'high'

const riskConfig: Record<RiskLevel, { label: string; sub: string; color: string }> = {
  low: { label: '오늘은 안전해요', sub: '침수 위험 낮음', color: 'text-green-600' },
  medium: { label: '주의가 필요해요', sub: '침수 위험 보통', color: 'text-yellow-500' },
  high: { label: '위험해요!', sub: '침수 위험 높음', color: 'text-red-500' },
}

export default function HomePage() {
  const [risk, setRisk] = useState<RiskLevel>('low')
  const [sigun, setSigun] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [gpsError, setGpsError] = useState(false)
  const config = riskConfig[risk]

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(`/api/rainfall?lat=${latitude}&lng=${longitude}`)
          const data = await res.json()
          if (data.risk) {
            setRisk(data.risk)
            setSigun(data.sigun)
          }
        } catch {
          // API 실패 시 기본값(low) 유지
        } finally {
          setLoading(false)
        }
      },
      () => {
        setGpsError(true)
        setLoading(false)
      },
      { timeout: 8000 }
    )
  }, [])

  return (
    <div className="relative flex flex-col items-center px-4 pt-10 gap-6 overflow-hidden" style={{ minHeight: 'calc(100dvh - 92px)' }}>
      <BackgroundScene risk={risk} />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <WeatherCharacter risk={risk} />

        <div className="text-center">
          {loading ? (
            <p className="text-gray-400 text-sm">위치 확인 중...</p>
          ) : (
            <>
              <p className={`font-bold text-2xl ${config.color}`}>{config.label}</p>
              <p className="text-sm text-gray-500 mt-1">{config.sub}</p>
              {sigun && (
                <p className="text-xs text-gray-400 mt-1">
                  {sigun} · 침수 취약성 지수 기반
                </p>
              )}
              {gpsError && (
                <p className="text-xs text-gray-400 mt-1">위치 정보를 가져올 수 없어 기본값으로 표시됩니다</p>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  )
}
