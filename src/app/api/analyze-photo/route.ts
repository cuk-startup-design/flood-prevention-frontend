import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const PROMPT = `이 이미지는 경기도 침수 예방 앱에서 시민이 찍은 하수구·침수 관련 신고 사진입니다.

아래 체크리스트 항목 중 이 사진에서 시각적으로 확인되는 것만 골라주세요.

1. 악취가 심하게 난다 (하수 역류 흔적)
2. 물이 고여 빠지지 않는다 (배수 불량)
3. 오물·쓰레기가 쌓여있다 (이물질 막힘)
4. 낙엽·흙으로 덮여있다 (계절성 막힘)
5. 격자 덮개가 파손·변형됐다 (구조 손상)
6. 배수 속도가 느리다 (부분 막힘 징후)
7. 하수구 주변이 침하됐다 (지반 꺼짐)
8. 위치 식별이 어렵다

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{"risk":"high","label":"한 줄 요약","reason":"이유 한 문장","suggestedIds":[숫자 배열]}

risk 기준: high=위험 징후(1~3번) 발견, medium=주의 징후(4~6번) 발견, low=이상 없어 보임, none=판단 불가`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: 'image required' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = (file.type || 'image/jpeg') as string

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      PROMPT,
    ])

    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ risk: 'none', label: '분석 불가', reason: '응답 파싱 실패', suggestedIds: [] })

    const parsed = JSON.parse(jsonMatch[0])
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ risk: 'none', label: '분석 불가', reason: 'AI 분석 중 오류가 발생했습니다', suggestedIds: [] })
  }
}
