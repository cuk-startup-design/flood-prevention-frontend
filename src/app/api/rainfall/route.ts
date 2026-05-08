import { NextRequest, NextResponse } from 'next/server'

interface StationRaw {
  RF_NM: string
  GU_NM: string
  RN_10M: string
  DATA_CLCT_TM: string
}

interface SeoulApiResponse {
  ListRainfallService: {
    RESULT: { CODE: string; MESSAGE: string }
    row: StationRaw[]
  }
}

const DISTRICT_CENTERS: { name: string; lat: number; lng: number }[] = [
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

function toRisk(mm: number): 'low' | 'medium' | 'high' {
  if (mm <= 0) return 'low'
  if (mm < 2) return 'medium'
  return 'high'
}

function nearestDistrict(lat: number, lng: number) {
  let nearest = DISTRICT_CENTERS[0]
  let minDist = Infinity
  for (const d of DISTRICT_CENTERS) {
    const dist = (d.lat - lat) ** 2 + (d.lng - lng) ** 2
    if (dist < minDist) { minDist = dist; nearest = d }
  }
  return nearest
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: 'lat/lng required' }, { status: 400 })
  }

  const district = nearestDistrict(lat, lng)
  const key = process.env.SEOUL_API_KEY
  const url = `http://openAPI.seoul.go.kr:8088/${key}/json/ListRainfallService/1/100/`

  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    const data: SeoulApiResponse = await res.json()
    const rows = data.ListRainfallService?.row ?? []

    const stationsInDistrict = rows.filter((r) => r.GU_NM === district.name)
    const maxRainfall = stationsInDistrict.reduce(
      (max, r) => Math.max(max, parseFloat(r.RN_10M) || 0),
      0
    )

    const representativeStation = stationsInDistrict[0]

    return NextResponse.json({
      risk: toRisk(maxRainfall),
      rainfall: maxRainfall,
      stationName: representativeStation?.RF_NM ?? null,
      guName: district.name,
      receivedAt: representativeStation?.DATA_CLCT_TM ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'API fetch failed' }, { status: 502 })
  }
}
