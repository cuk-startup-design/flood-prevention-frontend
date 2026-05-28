import { NextRequest, NextResponse } from 'next/server'

// 경기도 31개 시·군 중심 좌표 (국토교통부 공간정보 오픈플랫폼 기준)
const GYEONGGI_CENTERS: { name: string; lat: number; lng: number }[] = [
  { name: '수원시',  lat: 37.2636, lng: 127.0286 },
  { name: '성남시',  lat: 37.4449, lng: 127.1389 },
  { name: '의정부시', lat: 37.7381, lng: 127.0339 },
  { name: '안양시',  lat: 37.3943, lng: 126.9568 },
  { name: '부천시',  lat: 37.5035, lng: 126.7660 },
  { name: '광명시',  lat: 37.4786, lng: 126.8643 },
  { name: '평택시',  lat: 36.9921, lng: 127.1128 },
  { name: '동두천시', lat: 37.9035, lng: 127.0600 },
  { name: '안산시',  lat: 37.3236, lng: 126.8219 },
  { name: '고양시',  lat: 37.6584, lng: 126.8320 },
  { name: '과천시',  lat: 37.4292, lng: 126.9874 },
  { name: '구리시',  lat: 37.5943, lng: 127.1298 },
  { name: '남양주시', lat: 37.6358, lng: 127.2165 },
  { name: '오산시',  lat: 37.1498, lng: 127.0772 },
  { name: '시흥시',  lat: 37.3800, lng: 126.8029 },
  { name: '군포시',  lat: 37.3613, lng: 126.9350 },
  { name: '의왕시',  lat: 37.3449, lng: 126.9681 },
  { name: '하남시',  lat: 37.5397, lng: 127.2148 },
  { name: '용인시',  lat: 37.2410, lng: 127.1775 },
  { name: '파주시',  lat: 37.7599, lng: 126.7800 },
  { name: '이천시',  lat: 37.2723, lng: 127.4353 },
  { name: '안성시',  lat: 37.0079, lng: 127.2797 },
  { name: '김포시',  lat: 37.6148, lng: 126.7157 },
  { name: '화성시',  lat: 37.1996, lng: 126.8314 },
  { name: '광주시',  lat: 37.4295, lng: 127.2554 },
  { name: '양주시',  lat: 37.7852, lng: 127.0456 },
  { name: '포천시',  lat: 37.8946, lng: 127.2003 },
  { name: '여주시',  lat: 37.2983, lng: 127.6376 },
  { name: '연천군',  lat: 38.0969, lng: 127.0750 },
  { name: '가평군',  lat: 37.8311, lng: 127.5097 },
  { name: '양평군',  lat: 37.4919, lng: 127.4875 },
]

// 취약성 지수 (행정안전부 재해연보 + 국토교통부 WAMIS 기반)
const VULN_SCORE: Record<string, number> = {
  연천군: 0.94, 이천시: 0.86, 평택시: 0.87, 파주시: 0.86, 안성시: 0.81,
  화성시: 0.78, 여주시: 0.78, 양평군: 0.77, 가평군: 0.70, 포천시: 0.64,
  광주시: 0.63, 김포시: 0.66, 고양시: 0.60, 오산시: 0.57, 시흥시: 0.57,
  남양주시: 0.54, 하남시: 0.54, 안산시: 0.52, 용인시: 0.49, 부천시: 0.47,
  수원시: 0.45, 광명시: 0.43, 양주시: 0.42, 동두천시: 0.41, 군포시: 0.39,
  안양시: 0.38, 구리시: 0.37, 의정부시: 0.37, 성남시: 0.33,
  의왕시: 0.29, 과천시: 0.24,
}

function nearestSigun(lat: number, lng: number) {
  let nearest = GYEONGGI_CENTERS[0]
  let minDist = Infinity
  for (const d of GYEONGGI_CENTERS) {
    const dist = (d.lat - lat) ** 2 + (d.lng - lng) ** 2
    if (dist < minDist) { minDist = dist; nearest = d }
  }
  return nearest
}

function compositeToRisk(score: number): 'low' | 'medium' | 'high' {
  if (score >= 0.70) return 'high'
  if (score >= 0.40) return 'medium'
  return 'low'
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat/lng required' }, { status: 400 })
  }

  const sigun = nearestSigun(lat, lng)
  const vuln = VULN_SCORE[sigun.name] ?? 0.30

  let rainfallScore = 0
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${sigun.lat}&longitude=${sigun.lng}&current=precipitation&timezone=Asia%2FSeoul`,
      { next: { revalidate: 600 } }
    )
    const data = await res.json()
    const mm = parseFloat(data?.current?.precipitation ?? 0)
    rainfallScore = Math.min(mm / 10, 1.0)
  } catch {
    // 강수량 조회 실패 시 0으로 유지
  }

  const composite = 0.55 * rainfallScore + 0.30 * vuln
  const risk = compositeToRisk(composite)

  return NextResponse.json({ risk, sigun: sigun.name })
}
