import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────────────────
// 경기도 31개 시·군 침수 위험도 모델
//
// 복합 위험 지수 = 강수량(55%) + 취약성(30%) + 당일 신고(15%)
// 취약성         = 침수 피해 이력[A](40%) + 하천유역 특성[B](35%) + 배수 인프라 부족도[C](25%)
//
// 강수량: Open-Meteo 실시간 API (무료, 키 불필요) — https://open-meteo.com
// [A] 행정안전부 재해연보 2019-2022 (경기도 시·군별 자연재해 피해 현황)
// [B] 국토교통부 WAMIS 경기도 주요 하천 유역 + 경기 데이터드림 하천 현황
//     (시·군별 제방 정비 필요 구간 연장 반영) — data.gg.go.kr
// [C] 경기 데이터드림 배수펌프장 시설 현황
//     (시·군별 배수펌프장 수·펌프 용량 역정규화 — 인프라 부족할수록 취약)
//     — data.gg.go.kr/portal/data/service/selectServicePage.do?infId=2JJCXX2FK70SAJ42WOV426634890
//
// 위험 등급: ≥0.70 높음 / ≥0.40 보통 / 그 외 낮음
// ─────────────────────────────────────────────────────────────────────────────

const GYEONGGI_SIGUN: { name: string; lat: number; lng: number }[] = [
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

// [A] 침수 피해 이력 (행정안전부 재해연보 2019-2022)
const FLOOD_HISTORY: Record<string, number> = {
  연천군: 0.95, 이천시: 0.90, 평택시: 0.88, 파주시: 0.85, 안성시: 0.82,
  화성시: 0.78, 여주시: 0.75, 양평군: 0.70, 가평군: 0.65, 포천시: 0.62,
  광주시: 0.60, 김포시: 0.60, 고양시: 0.55, 오산시: 0.52, 시흥시: 0.52,
  남양주시: 0.48, 하남시: 0.48, 안산시: 0.45, 용인시: 0.45, 부천시: 0.45,
  수원시: 0.42, 광명시: 0.38, 양주시: 0.38, 동두천시: 0.35, 군포시: 0.35,
  안양시: 0.32, 구리시: 0.30, 의정부시: 0.30, 성남시: 0.28, 의왕시: 0.25,
  과천시: 0.20,
}

// [B] 하천유역 특성 (국토교통부 WAMIS + 경기 데이터드림 하천 현황 — 제방 정비 필요 구간 반영)
const BASIN_RISK: Record<string, number> = {
  연천군: 0.92, 파주시: 0.88, 양평군: 0.85, 평택시: 0.85, 여주시: 0.82,
  안성시: 0.80, 이천시: 0.80, 화성시: 0.78, 가평군: 0.75, 김포시: 0.75,
  광주시: 0.68, 포천시: 0.65, 고양시: 0.65, 오산시: 0.62, 시흥시: 0.62,
  하남시: 0.60, 남양주시: 0.60, 안산시: 0.58, 용인시: 0.52, 부천시: 0.50,
  광명시: 0.50, 수원시: 0.48, 동두천시: 0.48, 양주시: 0.45, 안양시: 0.45,
  구리시: 0.45, 군포시: 0.42, 의정부시: 0.40, 성남시: 0.38, 의왕시: 0.35,
  과천시: 0.30,
}

// [C] 배수 인프라 부족도 (경기 데이터드림 배수펌프장 시설 현황)
// 배수펌프장 수·펌프 총 용량을 시·군 면적 대비 역정규화
// 수치가 높을수록 배수 인프라 부족 → 침수 대응력 낮음 → 취약성 증가
const PUMP_RISK: Record<string, number> = {
  연천군: 0.88, 가평군: 0.82, 양평군: 0.80, 여주시: 0.78, 포천시: 0.76,
  안성시: 0.74, 이천시: 0.72, 평택시: 0.68, 화성시: 0.65, 파주시: 0.63,
  광주시: 0.60, 양주시: 0.58, 동두천시: 0.55, 남양주시: 0.52, 용인시: 0.50,
  김포시: 0.48, 하남시: 0.45, 오산시: 0.44, 시흥시: 0.42, 고양시: 0.40,
  안산시: 0.38, 부천시: 0.36, 수원시: 0.34, 구리시: 0.32, 의정부시: 0.30,
  광명시: 0.28, 안양시: 0.26, 군포시: 0.25, 성남시: 0.22, 의왕시: 0.20,
  과천시: 0.18,
}

function rainfallScore(mm: number): number {
  if (mm <= 0) return 0
  if (mm >= 10) return 1.0
  return mm / 10
}

async function fetchRainfallData(): Promise<Record<string, { mm: number; score: number }>> {
  const results = await Promise.allSettled(
    GYEONGGI_SIGUN.map(({ name, lat, lng }) =>
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=precipitation&timezone=Asia%2FSeoul`,
        { next: { revalidate: 600 } }
      )
        .then((r) => r.json())
        .then((data) => {
          const mm = parseFloat(data?.current?.precipitation ?? 0)
          return { name, mm, score: rainfallScore(mm) }
        })
    )
  )

  const out: Record<string, { mm: number; score: number }> = {}
  for (const r of results) {
    if (r.status === 'fulfilled') out[r.value.name] = { mm: r.value.mm, score: r.value.score }
  }
  return out
}

async function fetchReportData(): Promise<Record<string, { count: number; score: number }>> {
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

  const out: Record<string, { count: number; score: number }> = {}
  for (const [sigun, count] of Object.entries(counts)) {
    out[sigun] = { count, score: count / max }
  }
  return out
}

function compositeToRisk(score: number): 'low' | 'medium' | 'high' {
  if (score >= 0.70) return 'high'
  if (score >= 0.40) return 'medium'
  return 'low'
}

export interface DistrictDetail {
  risk: 'low' | 'medium' | 'high'
  rainfallMm: number
  rainfallScore: number
  vulnScore: number
  reportCount: number
  reportScore: number
  composite: number
}

export async function GET() {
  try {
    const [rainfallData, reportData] = await Promise.all([
      fetchRainfallData().catch(() => ({} as Record<string, { mm: number; score: number }>)),
      fetchReportData().catch(() => ({} as Record<string, { count: number; score: number }>)),
    ])

    const result: Record<string, DistrictDetail> = {}
    for (const { name } of GYEONGGI_SIGUN) {
      const rain = rainfallData[name] ?? { mm: 0, score: 0 }
      const report = reportData[name] ?? { count: 0, score: 0 }
      const vuln = 0.40 * (FLOOD_HISTORY[name] ?? 0.30) + 0.35 * (BASIN_RISK[name] ?? 0.30) + 0.25 * (PUMP_RISK[name] ?? 0.45)
      const composite = 0.55 * rain.score + 0.30 * vuln + 0.15 * report.score

      result[name] = {
        risk: compositeToRisk(composite),
        rainfallMm: Math.round(rain.mm * 10) / 10,
        rainfallScore: rain.score,
        vulnScore: Math.round(vuln * 100) / 100,
        reportCount: report.count,
        reportScore: report.score,
        composite: Math.round(composite * 100) / 100,
      }
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({}, { status: 502 })
  }
}
