'use client'

import { useRef } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    kakao: any
  }
}

type RiskLevel = 'high' | 'medium' | 'low'

const districts: { name: string; lat: number; lng: number; risk: RiskLevel }[] =
  [
    { name: '강남구', lat: 37.5172, lng: 127.0473, risk: 'medium' },
    { name: '강동구', lat: 37.5301, lng: 127.1238, risk: 'high' },
    { name: '강북구', lat: 37.6396, lng: 127.0257, risk: 'low' },
    { name: '강서구', lat: 37.5509, lng: 126.8495, risk: 'high' },
    { name: '관악구', lat: 37.4784, lng: 126.9516, risk: 'medium' },
    { name: '광진구', lat: 37.5384, lng: 127.0823, risk: 'high' },
    { name: '구로구', lat: 37.4955, lng: 126.8875, risk: 'medium' },
    { name: '금천구', lat: 37.4568, lng: 126.8955, risk: 'low' },
    { name: '노원구', lat: 37.6544, lng: 127.0563, risk: 'low' },
    { name: '도봉구', lat: 37.6688, lng: 127.0471, risk: 'low' },
    { name: '동대문구', lat: 37.5744, lng: 127.0396, risk: 'medium' },
    { name: '동작구', lat: 37.5124, lng: 126.9393, risk: 'medium' },
    { name: '마포구', lat: 37.5637, lng: 126.9084, risk: 'high' },
    { name: '서대문구', lat: 37.5791, lng: 126.9368, risk: 'low' },
    { name: '서초구', lat: 37.4836, lng: 127.0327, risk: 'medium' },
    { name: '성동구', lat: 37.5633, lng: 127.0371, risk: 'high' },
    { name: '성북구', lat: 37.5894, lng: 127.0167, risk: 'low' },
    { name: '송파구', lat: 37.5145, lng: 127.1059, risk: 'high' },
    { name: '양천구', lat: 37.517, lng: 126.8664, risk: 'high' },
    { name: '영등포구', lat: 37.5264, lng: 126.8963, risk: 'high' },
    { name: '용산구', lat: 37.5311, lng: 126.981, risk: 'medium' },
    { name: '은평구', lat: 37.6026, lng: 126.9291, risk: 'low' },
    { name: '종로구', lat: 37.5735, lng: 126.979, risk: 'low' },
    { name: '중구', lat: 37.564, lng: 126.9975, risk: 'medium' },
    { name: '중랑구', lat: 37.6063, lng: 127.0927, risk: 'high' },
  ]

const RISK_CONFIG: Record<RiskLevel, { color: string; label: string }> = {
  high: { color: '#ef4444', label: '높음' },
  medium: { color: '#f59e0b', label: '보통' },
  low: { color: '#22c55e', label: '낮음' },
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)

  const initMap = () => {
    if (!window.kakao) return
    window.kakao.maps.load(() => {
      if (!mapRef.current) return

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 8,
      })

      districts.forEach((district) => {
        const config = RISK_CONFIG[district.risk]
        const position = new window.kakao.maps.LatLng(
          district.lat,
          district.lng
        )

        new window.kakao.maps.Circle({
          map,
          center: position,
          radius: 1800,
          strokeWeight: 1,
          strokeColor: config.color,
          strokeOpacity: 0.6,
          fillColor: config.color,
          fillOpacity: 0.35,
        })

        new window.kakao.maps.CustomOverlay({
          map,
          position,
          content: `<span style="font-size:10px;font-weight:700;color:#111827;text-shadow:0 0 3px white,0 0 3px white;pointer-events:none;">${district.name}</span>`,
          yAnchor: 0.5,
        })
      })
    })
  }

  return (
    <div className="relative flex flex-col">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={initMap}
      />

      {/* 범례 */}
      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2.5 text-xs">
        <p className="font-semibold text-gray-700 mb-1.5">침수위험도</p>
        {(['high', 'medium', 'low'] as RiskLevel[]).map((key) => (
          <div key={key} className="flex items-center gap-2 mb-1 last:mb-0">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: RISK_CONFIG[key].color }}
            />
            <span className="text-gray-600">{RISK_CONFIG[key].label}</span>
          </div>
        ))}
      </div>

      <div
        ref={mapRef}
        className="w-full"
        style={{ height: 'calc(100dvh - 148px)' }}
      />
    </div>
  )
}
