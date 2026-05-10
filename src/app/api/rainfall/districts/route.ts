import { NextResponse } from 'next/server'

const SEOUL_GU = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구',
  '종로구', '중구', '중랑구',
]

// 구별 역사적 침수 취약성 점수 (논문 기반 AHP 가중치 적용)
// 근거: 한강 저지대 + 과거 침수 이력 + 불투수면적 비율
const VULNERABILITY: Record<string, number> = {
  강남구: 0.90, 서초구: 0.85, 동작구: 0.80,
  영등포구: 0.75, 관악구: 0.70, 강서구: 0.65,
  마포구: 0.55, 성동구: 0.52, 광진구: 0.50,
  송파구: 0.50, 양천구: 0.47, 중랑구: 0.43,
  노원구: 0.40, 구로구: 0.38, 강동구: 0.38,
  용산구: 0.36, 금천구: 0.35, 은평구: 0.33,
  동대문구: 0.33, 도봉구: 0.30, 강북구: 0.30,
  성북구: 0.30, 서대문구: 0.30, 종로구: 0.30,
  중구: 0.30,
}

const SEWER_CODES = Array.from({ length: 25 }, (_, i) => String(i + 1).padStart(2, '0'))

function toGuName(seName: string): string {
  return seName.endsWith('구') ? seName : seName + '구'
}

function formatSeoulDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  return `${y}${m}${d}${h}`
}

async function fetchSewerScores(key: string): Promise<Record<string, number>> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const ymStart = formatSeoulDate(oneHourAgo)
  const ymEnd = formatSeoulDate(now)

  const results = await Promise.allSettled(
    SEWER_CODES.map((cd) =>
      fetch(
        `http://openAPI.seoul.go.kr:8088/${key}/json/DrainpipeMonitoringInfo/1/50/${cd}/${ymStart}/${ymEnd}`,
        { next: { revalidate: 600 } }
      ).then((r) => r.json())
    )
  )

  const sums: Record<string, { total: number; count: number }> = {}

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    const rows: Array<{ SE_NM: string; MSRMT_WATL: string; MSRMT_YMD: string }> =
      result.value?.DrainpipeMonitoringInfo?.row ?? []

    for (const row of rows) {
      // 24시간 이내 데이터만 사용
      const measured = new Date(row.MSRMT_YMD)
      if (now.getTime() - measured.getTime() > 24 * 60 * 60 * 1000) continue

      const gu = toGuName(row.SE_NM)
      const level = parseFloat(row.MSRMT_WATL) || 0
      if (!sums[gu]) sums[gu] = { total: 0, count: 0 }
      sums[gu].total += level
      sums[gu].count++
    }
  }

  const scores: Record<string, number> = {}
  for (const [gu, { total, count }] of Object.entries(sums)) {
    const avg = total / count
    scores[gu] = Math.min(avg / 1.5, 1.0)
  }
  return scores
}

interface StationRaw {
  GU_NM: string
  RN_10M: string
}

interface SeoulApiResponse {
  ListRainfallService: {
    RESULT: { CODE: string; MESSAGE: string }
    row: StationRaw[]
  }
}

function rainfallScore(mm: number): number {
  if (mm <= 0) return 0
  if (mm >= 10) return 1.0
  return mm / 10
}

function compositeToRisk(score: number): 'low' | 'medium' | 'high' {
  if (score >= 0.55) return 'high'
  if (score >= 0.28) return 'medium'
  return 'low'
}

export async function GET() {
  const key = process.env.SEOUL_API_KEY
  const rainfallUrl = `http://openAPI.seoul.go.kr:8088/${key}/json/ListRainfallService/1/100/`

  try {
    const [rainfallData, sewerScores] = await Promise.all([
      fetch(rainfallUrl, { next: { revalidate: 60 } }).then((r) => r.json() as Promise<SeoulApiResponse>),
      fetchSewerScores(key!).catch(() => ({} as Record<string, number>)),
    ])

    const rows = rainfallData.ListRainfallService?.row ?? []
    const guMaxRain: Record<string, number> = {}
    for (const row of rows) {
      const gu = row.GU_NM
      const mm = parseFloat(row.RN_10M) || 0
      if (!gu) continue
      if (guMaxRain[gu] === undefined || mm > guMaxRain[gu]) guMaxRain[gu] = mm
    }

    const result: Record<string, 'low' | 'medium' | 'high'> = {}
    for (const gu of SEOUL_GU) {
      const rain = rainfallScore(guMaxRain[gu] ?? 0)
      const sewer = sewerScores[gu] ?? 0.15
      const vuln = VULNERABILITY[gu] ?? 0.30

      const composite = 0.5 * rain + 0.3 * sewer + 0.2 * vuln
      result[gu] = compositeToRisk(composite)
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({}, { status: 502 })
  }
}
