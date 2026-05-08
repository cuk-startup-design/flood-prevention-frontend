'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import Link from 'next/link'

declare global {
  interface Window {
    kakao: any
  }
}

type RiskLevel = 'high' | 'medium' | 'low'

const districtCoords: { name: string; lat: number; lng: number }[] = [
  { name: '강남구', lat: 37.5172, lng: 127.0473 },
  { name: '강동구', lat: 37.5301, lng: 127.1238 },
  { name: '강북구', lat: 37.6396, lng: 127.0257 },
  { name: '강서구', lat: 37.5509, lng: 126.8495 },
  { name: '관악구', lat: 37.4784, lng: 126.9516 },
  { name: '광진구', lat: 37.5384, lng: 127.0823 },
  { name: '구로구', lat: 37.4955, lng: 126.8875 },
  { name: '금천구', lat: 37.4568, lng: 126.8955 },
  { name: '노원구', lat: 37.6544, lng: 127.0563 },
  { name: '도봉구', lat: 37.6688, lng: 127.0471 },
  { name: '동대문구', lat: 37.5744, lng: 127.0396 },
  { name: '동작구', lat: 37.5124, lng: 126.9393 },
  { name: '마포구', lat: 37.5637, lng: 126.9084 },
  { name: '서대문구', lat: 37.5791, lng: 126.9368 },
  { name: '서초구', lat: 37.4836, lng: 127.0327 },
  { name: '성동구', lat: 37.5633, lng: 127.0371 },
  { name: '성북구', lat: 37.5894, lng: 127.0167 },
  { name: '송파구', lat: 37.5145, lng: 127.1059 },
  { name: '양천구', lat: 37.517, lng: 126.8664 },
  { name: '영등포구', lat: 37.5264, lng: 126.8963 },
  { name: '용산구', lat: 37.5311, lng: 126.981 },
  { name: '은평구', lat: 37.6026, lng: 126.9291 },
  { name: '종로구', lat: 37.5735, lng: 126.979 },
  { name: '중구', lat: 37.564, lng: 126.9975 },
  { name: '중랑구', lat: 37.6063, lng: 127.0927 },
]

const RISK_CONFIG: Record<RiskLevel, { color: string; label: string }> = {
  high: { color: '#ef4444', label: '높음' },
  medium: { color: '#f59e0b', label: '보통' },
  low: { color: '#22c55e', label: '낮음' },
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const districtRisksRef = useRef<Record<string, RiskLevel>>({})

  const initMap = (lat = 37.5665, lng = 126.978) => {
    if (!window.kakao) return
    window.kakao.maps.load(() => {
      if (!mapRef.current) return

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 8,
      })

      districtCoords.forEach((district) => {
        const risk = districtRisksRef.current[district.name] ?? 'low'
        const config = RISK_CONFIG[risk]
        const position = new window.kakao.maps.LatLng(district.lat, district.lng)

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

      new window.kakao.maps.CustomOverlay({
        map,
        position: new window.kakao.maps.LatLng(lat, lng),
        content: '<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.3);"></div>',
        yAnchor: 0.5,
      })
    })
  }

  const loadWithData = async () => {
    try {
      const res = await fetch('/api/rainfall/districts')
      const data = await res.json()
      districtRisksRef.current = data
    } catch {
      // API 실패 시 모든 구 low로 표시
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
      () => initMap(),
      { timeout: 5000 }
    )
  }

  useEffect(() => {
    if (window.kakao?.maps) loadWithData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={loadWithData}
      />

      {/* 지도 */}
      <div className="relative">
        <div ref={mapRef} className="w-full h-[50vh] md:h-[420px]" />

        {/* 범례 */}
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2.5 text-xs">
          <p className="font-semibold text-gray-700 mb-1.5">침수위험도</p>
          {(['high', 'medium', 'low'] as RiskLevel[]).map((key) => (
            <div key={key} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_CONFIG[key].color }} />
              <span className="text-gray-600">{RISK_CONFIG[key].label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 정보 패널 */}
      <div className="flex flex-col gap-2 p-4 bg-white border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-800">
          📍 실시간 서울시 강우량 기준
        </p>
        <Link
          href="/report/new"
          className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold"
        >
          <span>⚠️</span>
          <span>하수구 문제를 발견하셨나요? 신고하기</span>
          <span>→</span>
        </Link>
        <p className="text-xs text-gray-500">
          서울시 강우량 관측소 데이터 · 10분 단위 갱신
        </p>
      </div>
    </div>
  )
}
