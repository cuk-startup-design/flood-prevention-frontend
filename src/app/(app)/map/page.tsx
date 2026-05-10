'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import Link from 'next/link'

declare global {
  interface Window { kakao: any }
}

type RiskLevel = 'high' | 'medium' | 'low'

const RISK_CONFIG: Record<RiskLevel, { color: string; label: string }> = {
  high:   { color: '#ef4444', label: '높음' },
  medium: { color: '#f59e0b', label: '보통' },
  low:    { color: '#22c55e', label: '낮음' },
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const districtRisksRef = useRef<Record<string, RiskLevel>>({})
  const geoDataRef = useRef<any>(null)

  const initMap = (lat = 37.5665, lng = 126.978) => {
    if (!window.kakao || !geoDataRef.current) return
    window.kakao.maps.load(() => {
      if (!mapRef.current) return

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 8,
      })

      geoDataRef.current.features.forEach((feature: any) => {
        const name: string = feature.properties.name
        const risk: RiskLevel = districtRisksRef.current[name] ?? 'low'
        const config = RISK_CONFIG[risk]
        const { type, coordinates } = feature.geometry

        const toLatLng = (ring: number[][]) =>
          ring.map(([lng, lat]) => new window.kakao.maps.LatLng(lat, lng))

        const rings: number[][][] =
          type === 'MultiPolygon' ? coordinates.flat(1) : coordinates

        rings.forEach((ring: number[][], idx: number) => {
          const polygon = new window.kakao.maps.Polygon({
            map,
            path: toLatLng(ring),
            strokeWeight: 1.5,
            strokeColor: '#ffffff',
            strokeOpacity: 0.8,
            fillColor: config.color,
            fillOpacity: 0.45,
          })

          if (idx === 0) {
            const bounds = ring.reduce(
              (acc, [lng, lat]) => ({
                minLat: Math.min(acc.minLat, lat),
                maxLat: Math.max(acc.maxLat, lat),
                minLng: Math.min(acc.minLng, lng),
                maxLng: Math.max(acc.maxLng, lng),
              }),
              { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
            )
            const centerLat = (bounds.minLat + bounds.maxLat) / 2
            const centerLng = (bounds.minLng + bounds.maxLng) / 2

            new window.kakao.maps.CustomOverlay({
              map,
              position: new window.kakao.maps.LatLng(centerLat, centerLng),
              content: `<span style="font-size:10px;font-weight:700;color:#111827;text-shadow:0 0 3px white,0 0 3px white;pointer-events:none;">${name}</span>`,
              yAnchor: 0.5,
            })

            window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
              polygon.setOptions({ fillOpacity: 0.65 })
            })
            window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
              polygon.setOptions({ fillOpacity: 0.45 })
            })
          }
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
      const [rainfallRes, geoRes] = await Promise.all([
        fetch('/api/rainfall/districts'),
        fetch('/seoul-districts.json'),
      ])
      districtRisksRef.current = await rainfallRes.json()
      geoDataRef.current = await geoRes.json()
    } catch {
      if (!geoDataRef.current) {
        const geoRes = await fetch('/seoul-districts.json').catch(() => null)
        if (geoRes) geoDataRef.current = await geoRes.json()
      }
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

      <div className="relative">
        <div ref={mapRef} className="w-full h-[50vh] md:h-[420px]" />

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

      <div className="flex flex-col gap-2 p-4 bg-white border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-800">📍 실시간 서울시 강우량 기준</p>
        <Link href="/report/new" className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold">
          <span>⚠️</span>
          <span>하수구 문제를 발견하셨나요? 신고하기</span>
          <span>→</span>
        </Link>
        <p className="text-xs text-gray-500">서울시 강우량 관측소 데이터 · 10분 단위 갱신</p>
      </div>
    </div>
  )
}
