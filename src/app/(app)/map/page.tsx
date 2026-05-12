'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'

declare global {
  interface Window { kakao: any } // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Kakao Maps SDK has no official TypeScript types
type KakaoAny = any // eslint-disable-line @typescript-eslint/no-explicit-any

type RiskLevel = 'high' | 'medium' | 'low'

const RISK_CONFIG: Record<RiskLevel, { color: string; label: string }> = {
  high:   { color: '#ef4444', label: '높음' },
  medium: { color: '#f59e0b', label: '보통' },
  low:    { color: '#22c55e', label: '낮음' },
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<KakaoAny>(null)
  const locationOverlayRef = useRef<KakaoAny>(null)
  const districtRisksRef = useRef<Record<string, RiskLevel>>({})
  const geoDataRef = useRef<KakaoAny>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [locating, setLocating] = useState(false)

  const placeLocationMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return
    locationOverlayRef.current?.setMap(null)
    locationOverlayRef.current = new window.kakao.maps.CustomOverlay({
      map: mapInstanceRef.current,
      position: new window.kakao.maps.LatLng(lat, lng),
      content: '<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.3);"></div>',
      yAnchor: 0.5,
    })
  }

  const initMap = (lat = 37.5665, lng = 126.978) => {
    if (!window.kakao || !geoDataRef.current) return
    window.kakao.maps.load(() => {
      if (!mapRef.current) return

      const map = new window.kakao.maps.Map(mapRef.current, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 6,
        maxLevel: 8,
      })
      mapInstanceRef.current = map

      // 서울 경계 이탈 시 가장 가까운 경계 안쪽으로 snap back
      const SEOUL = { north: 37.715, south: 37.413, west: 126.734, east: 127.185 }
      window.kakao.maps.event.addListener(map, 'dragend', () => {
        const center = map.getCenter()
        const clampedLat = Math.min(SEOUL.north, Math.max(SEOUL.south, center.getLat()))
        const clampedLng = Math.min(SEOUL.east, Math.max(SEOUL.west, center.getLng()))
        if (clampedLat !== center.getLat() || clampedLng !== center.getLng()) {
          map.panTo(new window.kakao.maps.LatLng(clampedLat, clampedLng))
        }
      })

      // 서울 외부 마스킹: 서울 주변 영역을 반투명 회색으로 덮어 서울만 강조
      new window.kakao.maps.Polygon({
        map,
        path: [
          new window.kakao.maps.LatLng(38.8, 124.5),
          new window.kakao.maps.LatLng(38.8, 129.5),
          new window.kakao.maps.LatLng(35.5, 129.5),
          new window.kakao.maps.LatLng(35.5, 124.5),
        ],
        strokeWeight: 0,
        fillColor: '#64748b',
        fillOpacity: 0.35,
      })

      geoDataRef.current.features.forEach((feature: KakaoAny) => {
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

      placeLocationMarker(lat, lng)
    })
  }

  // 데이터 로딩 + 지도 초기화 (setState 호출 없음)
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
      { timeout: 10000 }
    )
  }

  // Effect 1: 위치 권한 상태 구독 (외부 시스템 구독 패턴)
  useEffect(() => {
    if (!navigator.permissions) return
    let permStatus: PermissionStatus

    navigator.permissions.query({ name: 'geolocation' }).then((status) => {
      permStatus = status
      setPermissionDenied(status.state === 'denied')
      status.onchange = () => setPermissionDenied(status.state === 'denied')
    })

    return () => {
      if (permStatus) permStatus.onchange = null
    }
  }, [])

  // Effect 2: 지도 초기화 (setState 호출 없음)
  useEffect(() => {
    if (window.kakao?.maps) void loadWithData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moveToCurrentLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude, longitude } = pos.coords
        mapInstanceRef.current?.setCenter(new window.kakao.maps.LatLng(latitude, longitude))
        mapInstanceRef.current?.setLevel(4)
        placeLocationMarker(latitude, longitude)
      },
      () => {
        setLocating(false)
        setPermissionDenied(true)
      },
      { timeout: 10000 }
    )
  }

  return (
    <div className="flex flex-col">
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false`}
        strategy="afterInteractive"
        onLoad={loadWithData}
      />

      <div className="relative">
        <div ref={mapRef} className="w-full h-[50vh] md:h-[420px]" />

        {/* 위험도 범례 */}
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2.5 text-xs">
          <p className="font-semibold text-gray-700 mb-1.5">침수위험도</p>
          {(['high', 'medium', 'low'] as RiskLevel[]).map((key) => (
            <div key={key} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_CONFIG[key].color }} />
              <span className="text-gray-600">{RISK_CONFIG[key].label}</span>
            </div>
          ))}
        </div>

        {/* 현재 위치 버튼 */}
        <button
          type="button"
          onClick={moveToCurrentLocation}
          className="absolute bottom-4 right-3 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          {locating ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
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

      {/* 위치 권한 거부 모달 */}
      {permissionDenied && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl mx-4 max-w-sm w-full p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-2">위치 권한이 필요합니다</h2>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              현재 위치 기반 침수 위험도를 확인하려면 위치 접근 권한이 필요합니다.
            </p>
            <div className="w-full bg-gray-50 rounded-xl px-4 py-3 mb-5 text-left">
              <p className="text-xs font-semibold text-gray-700 mb-1.5">권한 허용 방법</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                주소창 왼쪽 🔒 아이콘 탭<br />
                → <span className="font-medium text-gray-700">위치</span> → <span className="font-medium text-blue-500">허용</span>으로 변경<br />
                → 아래 버튼으로 새로고침
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
