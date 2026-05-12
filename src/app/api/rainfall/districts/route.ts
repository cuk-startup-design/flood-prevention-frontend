import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SEOUL_GU = [
  '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구',
  '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구',
  '종로구', '중구', '중랑구',
]

// ─────────────────────────────────────────────────────────────────────────────
// 취약성 = 침수위험지구(40%) + 불투수면적(35%) + 하천유역특성(25%)
//
// [A] 침수위험지구: 서울시 자연재해위험개선지구(침수지구) 현황 API (tbNatureDangerLocal)
//     서울시 물순환안전국 치수안전과 제공, 갱신주기 비정기
//     → 구별 침수위험지구 지정 개수 집계 후 max 정규화 (0~1)
//
// [B] 불투수면적: 서울시 환경백서 구별 불투수면 비율 (%)
//     정규화: (실제% - 최소55) / (최대91 - 55) → 0~1
//
// [C] 하천유역 특성: 한강·지류 근접도 + 저지대 여부 (AHP 논문 기반 정성 지표)
// ─────────────────────────────────────────────────────────────────────────────

// [B] 불투수면적 정규화값 (서울시 환경백서)
const IMPERV: Record<string, number> = {
  중구: 1.00, 영등포구: 0.89, 양천구: 0.86, 강남구: 0.75, 구로구: 0.75,
  용산구: 0.69, 마포구: 0.69, 종로구: 0.67, 송파구: 0.58, 금천구: 0.58,
  광진구: 0.56, 동작구: 0.61, 성동구: 0.61, 동대문구: 0.50, 강동구: 0.47,
  중랑구: 0.47, 관악구: 0.44, 강서구: 0.42, 서대문구: 0.36, 서초구: 0.31,
  성북구: 0.28, 은평구: 0.25, 강북구: 0.14, 노원구: 0.08, 도봉구: 0.00,
}

// [C] 하천유역 특성 (한국수자원학회 2018 AHP 논문 기반)
const BASIN: Record<string, number> = {
  영등포구: 0.90, 강서구: 0.85, 마포구: 0.80, 동작구: 0.75, 용산구: 0.75,
  구로구: 0.75, 강남구: 0.70, 서초구: 0.70, 광진구: 0.70, 금천구: 0.70,
  양천구: 0.70, 성동구: 0.65, 송파구: 0.65, 관악구: 0.55, 중랑구: 0.55,
  강동구: 0.55, 중구: 0.55, 동대문구: 0.50, 종로구: 0.45, 성북구: 0.40,
  서대문구: 0.40, 노원구: 0.35, 은평구: 0.35, 강북구: 0.30, 도봉구: 0.25,
}

// 최근 7일 구별 신고 건수 → 정규화 (Supabase reports 테이블)
async function fetchReportScores(): Promise<Record<string, number>> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('reports')
    .select('district')
    .gte('created_at', since)
    .not('district', 'is', null)

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    if (row.district) counts[row.district] = (counts[row.district] ?? 0) + 1
  }

  const max = Math.max(...Object.values(counts), 1)
  return Object.fromEntries(
    Object.entries(counts).map(([gu, count]) => [gu, count / max])
  )
}

// [A] 서울시 자연재해위험개선지구(침수지구) 현황 API
async function fetchFloodZoneScores(key: string): Promise<Record<string, number>> {
  const res = await fetch(
    `http://openapi.seoul.go.kr:8088/${key}/json/tbNatureDangerLocal/1/1000/`,
    { next: { revalidate: 86400 } } // 비정기 갱신 데이터 → 24시간 캐시
  )
  const data = await res.json()
  const rows: Record<string, string>[] = data?.tbNatureDangerLocal?.row ?? []

  const counts: Record<string, number> = {}
  for (const row of rows) {
    const rowStr = JSON.stringify(row)
    if (!rowStr.includes('침수')) continue
    const gu = SEOUL_GU.find((g) => rowStr.includes(g))
    if (gu) counts[gu] = (counts[gu] ?? 0) + 1
  }

  const max = Math.max(...Object.values(counts), 1)
  return Object.fromEntries(
    Object.entries(counts).map(([gu, count]) => [gu, count / max])
  )
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
    const [rainfallData, sewerScores, floodZoneScores, reportScores] = await Promise.all([
      fetch(rainfallUrl, { next: { revalidate: 60 } }).then((r) => r.json() as Promise<SeoulApiResponse>),
      fetchSewerScores(key!).catch(() => ({} as Record<string, number>)),
      fetchFloodZoneScores(key!).catch(() => ({} as Record<string, number>)),
      fetchReportScores().catch(() => ({} as Record<string, number>)),
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

      // 취약성 = 침수위험지구[A](40%) + 불투수면적[B](35%) + 하천유역[C](25%)
      const vuln =
        0.40 * (floodZoneScores[gu] ?? 0) +
        0.35 * (IMPERV[gu] ?? 0.30) +
        0.25 * (BASIN[gu] ?? 0.30)

      // 복합 위험 지수: 강수(45%) + 하수수위(30%) + 취약성(20%) + 당일신고건수(5%)
      const composite = 0.45 * rain + 0.30 * sewer + 0.20 * vuln + 0.05 * (reportScores[gu] ?? 0)
      result[gu] = compositeToRisk(composite)
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({}, { status: 502 })
  }
}
