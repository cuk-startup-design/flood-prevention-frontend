'use client'

import { useState } from 'react'
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
  const config = riskConfig[risk]

  return (
    <div className="relative flex flex-col items-center px-4 pt-10 gap-6 overflow-hidden" style={{ minHeight: 'calc(100dvh - 92px)' }}>
      <BackgroundScene risk={risk} />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <WeatherCharacter risk={risk} />

        <div className="text-center">
          <p className={`font-bold text-2xl ${config.color}`}>{config.label}</p>
          <p className="text-sm text-gray-500 mt-1">{config.sub}</p>
        </div>

        {/* 위험도 전환 (테스트용) */}
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as RiskLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setRisk(level)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                risk === level
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white/70 text-gray-600 border-gray-200'
              }`}
            >
              {level === 'low' ? '낮음' : level === 'medium' ? '보통' : '높음'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
