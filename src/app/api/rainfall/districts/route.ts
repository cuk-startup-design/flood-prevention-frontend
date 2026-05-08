import { NextResponse } from 'next/server'

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

function toRisk(mm: number): 'low' | 'medium' | 'high' {
  if (mm <= 0) return 'low'
  if (mm < 2) return 'medium'
  return 'high'
}

export async function GET() {
  const key = process.env.SEOUL_API_KEY
  const url = `http://openAPI.seoul.go.kr:8088/${key}/json/ListRainfallService/1/100/`

  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    const data: SeoulApiResponse = await res.json()
    const rows = data.ListRainfallService?.row ?? []

    const guMax: Record<string, number> = {}
    for (const row of rows) {
      const gu = row.GU_NM
      const rainfall = parseFloat(row.RN_10M) || 0
      if (!gu) continue
      if (guMax[gu] === undefined || rainfall > guMax[gu]) {
        guMax[gu] = rainfall
      }
    }

    const result: Record<string, 'low' | 'medium' | 'high'> = {}
    for (const [gu, mm] of Object.entries(guMax)) {
      result[gu] = toRisk(mm)
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({}, { status: 502 })
  }
}
