'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie } from 'recharts'

interface Report {
  id: string
  district: string | null
  checklist_items: string[]
  status: '대기' | '완료' | '반려'
  created_at: string
}

interface DistrictDetail {
  risk: 'low' | 'medium' | 'high'
  rainfallMm: number
  rainfallScore: number
  vulnScore: number
  reportCount: number
  reportScore: number
  composite: number
}

interface DistrictStat {
  name: string
  count: number
}

interface Stats {
  total: number
  pending: number
  completed: number
  rejected: number
}

type ModalFilter = '전체' | '대기' | '완료' | '반려'
type ChartTab = '주간' | '월별'

const riskColor = { high: 'bg-red-100 text-red-600', medium: 'bg-yellow-100 text-yellow-600', low: 'bg-green-100 text-green-600' }
const riskLabel = { high: '높음', medium: '보통', low: '낮음' }
const statusStyle: Record<string, string> = {
  대기: 'bg-orange-100 text-orange-600',
  완료: 'bg-green-100 text-green-600',
  반려: 'bg-gray-100 text-gray-500',
}

function getRisk(count: number, max: number): 'high' | 'medium' | 'low' {
  const ratio = count / max
  if (ratio >= 0.7) return 'high'
  if (ratio >= 0.4) return 'medium'
  return 'low'
}

function buildWeeklyData(reports: Report[]): { label: string; count: number }[] {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, dateStr: d.toISOString().slice(0, 10), count: 0 }
  })
  reports.forEach((r) => {
    const day = days.find((d) => d.dateStr === r.created_at.slice(0, 10))
    if (day) day.count++
  })
  return days.map(({ label, count }) => ({ label, count }))
}

const SYMPTOM_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#f97316']

function buildSymptomData(reports: Report[]) {
  const counts: Record<string, number> = {}
  for (const r of reports) {
    for (const item of r.checklist_items ?? []) {
      counts[item] = (counts[item] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value], i) => ({ name, value, fill: SYMPTOM_COLORS[i] }))
}

function buildMonthlyData(reports: Report[]): { label: string; count: number }[] {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return { label: `${d.getMonth() + 1}월`, key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, count: 0 }
  })
  reports.forEach((r) => {
    const month = months.find((m) => m.key === r.created_at.slice(0, 7))
    if (month) month.count++
  })
  return months.map(({ label, count }) => ({ label, count }))
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, completed: 0, rejected: 0 })
  const [districtStats, setDistrictStats] = useState<DistrictStat[]>([])
  const [allReports, setAllReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [modalFilter, setModalFilter] = useState<ModalFilter | null>(null)
  const [chartTab, setChartTab] = useState<ChartTab>('주간')
  const [districtRisks, setDistrictRisks] = useState<Record<string, DistrictDetail>>({})
  const [districtRisksLoading, setDistrictRisksLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rainfall/districts')
      .then((r) => r.json())
      .then((data) => setDistrictRisks(data))
      .catch(() => {})
      .finally(() => setDistrictRisksLoading(false))
  }, [])

  useEffect(() => {
    supabase
      .from('reports')
      .select('id, district, checklist_items, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return setLoading(false)

        setAllReports(data as Report[])
        setStats({
          total: data.length,
          pending: data.filter((r) => r.status === '대기').length,
          completed: data.filter((r) => r.status === '완료').length,
          rejected: data.filter((r) => r.status === '반려').length,
        })

        const districtMap: Record<string, number> = {}
        data.forEach((r) => {
          if (r.district) districtMap[r.district] = (districtMap[r.district] ?? 0) + 1
        })
        setDistrictStats(
          Object.entries(districtMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
        )
        setLoading(false)
      })
  }, [])

  const processRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const districtEntries = Object.entries(districtRisks)
  const earlyWarnDistricts = districtEntries
    .filter(([, d]) => d.reportScore > 0.3)
    .sort(([, a], [, b]) => b.reportScore - a.reportScore)
    .slice(0, 3)
  const avgRainfall = districtEntries.length > 0
    ? districtEntries.reduce((s, [, d]) => s + d.rainfallScore, 0) / districtEntries.length
    : 0
  const avgVuln = districtEntries.length > 0
    ? districtEntries.reduce((s, [, d]) => s + d.vulnScore, 0) / districtEntries.length
    : 0
  const avgReport = districtEntries.length > 0
    ? districtEntries.reduce((s, [, d]) => s + d.reportScore, 0) / districtEntries.length
    : 0
  const maxCount = districtStats[0]?.count ?? 1
  const recentReports = allReports.slice(0, 5)
  const chartData = chartTab === '주간' ? buildWeeklyData(allReports) : buildMonthlyData(allReports)
  const symptomData = buildSymptomData(allReports)

  const statCards: { label: ModalFilter; value: number; sub: string; bar: string; num: string }[] = [
    { label: '전체', value: stats.total, sub: `처리율 ${processRate}%`, bar: 'bg-blue-500', num: 'text-blue-600' },
    { label: '대기', value: stats.pending, sub: '즉시 처리 필요', bar: 'bg-orange-400', num: 'text-orange-500' },
    { label: '완료', value: stats.completed, sub: `${processRate}% 완료`, bar: 'bg-green-500', num: 'text-green-600' },
    { label: '반려', value: stats.rejected, sub: '사유 불충분 등', bar: 'bg-red-400', num: 'text-red-500' },
  ]

  const modalReports = modalFilter
    ? modalFilter === '전체' ? allReports : allReports.filter((r) => r.status === modalFilter)
    : []

  const modalTitle: Record<ModalFilter, string> = {
    전체: '전체 신고',
    대기: '처리 대기',
    완료: '처리 완료',
    반려: '반려',
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setModalFilter(s.label)}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm text-left hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className={`h-1 w-full ${s.bar}`} />
            <div className="p-4 flex flex-col gap-1">
              <p className="text-xs font-semibold text-gray-500">{modalTitle[s.label]}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
              <p className={`text-3xl font-bold mt-2 ${s.num}`}>{loading ? '—' : s.value}</p>
            </div>
          </button>
        ))}
      </div>

      {/* 신고 건수 차트 */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-800">신고 건수 추이</h2>
          <div className="flex gap-1">
            {(['주간', '월별'] as ChartTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setChartTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  chartTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={chartTab === '주간' ? 28 : 36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                formatter={(v) => [`${v}건`, '신고']}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">구별 신고 현황</h2>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
          ) : districtStats.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">신고 데이터가 없습니다</div>
          ) : (
            <div className="flex flex-col gap-2">
              {districtStats.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-16 shrink-0">{d.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{d.count}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${riskColor[getRisk(d.count, maxCount)]}`}>
                    {riskLabel[getRisk(d.count, maxCount)]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">최근 신고</h2>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
          ) : recentReports.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">신고 내역이 없습니다</div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentReports.map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">#{r.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-gray-500 truncate">{r.district ?? '-'} · {r.checklist_items?.[0] ?? '-'}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(r.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 증상 분포 도넛 차트 */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 mb-4">주요 증상 분포</h2>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
        ) : symptomData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">신고 데이터가 없습니다</div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={symptomData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                >
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={(v, _, props) => [`${v}건`, props.payload.name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1 w-full">
              {symptomData.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                  <span className="text-xs font-bold shrink-0" style={{ color: item.fill }}>{item.value}건</span>
                  <span className="text-xs text-gray-400 shrink-0 w-8 text-right">
                    {Math.round((item.value / symptomData.reduce((s, d) => s + d.value, 0)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* AI 분석 인사이트 */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-bold text-gray-800">AI 분석 인사이트</h2>
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium ml-auto">실시간</span>
        </div>
        <p className="text-xs text-gray-400 mb-5">복합 위험 지수 = 강수량(55%) × 취약성(30%) × 시민신고(15%)</p>

        {districtRisksLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">AI 분석 중...</div>
        ) : (
          <>
            {/* ① 경기도 실시간 위험 등급 분포 */}
            <h3 className="text-xs font-semibold text-gray-600 mb-2">경기도 31개 시·군 위험 등급 분포</h3>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {([
                { level: 'high' as const, label: '높음', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
                { level: 'medium' as const, label: '보통', bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
                { level: 'low' as const, label: '낮음', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
              ]).map(({ level, label, bg, text, border }) => {
                const count = districtEntries.filter(([, d]) => d.risk === level).length
                return (
                  <div key={level} className={`${bg} border ${border} rounded-xl p-3 text-center`}>
                    <p className={`text-2xl font-bold ${text}`}>{count}</p>
                    <p className="text-xs text-gray-500 mt-0.5">위험 {label}</p>
                  </div>
                )
              })}
            </div>

            {/* ② Human-in-the-Loop 조기 경보 */}
            <h3 className="text-xs font-semibold text-gray-600 mb-1">Human-in-the-Loop 조기 경보</h3>
            <p className="text-xs text-gray-400 mb-2">시민 신고가 집중된 지역 — 구조 취약성 모델 독립 신호</p>
            <div className="mb-6">
              {earlyWarnDistricts.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">현재 조기 경보 지역 없음 (신고 집중 지역 없음)</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {earlyWarnDistricts.map(([name, d]) => (
                    <div key={name} className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                      <span className="text-xs font-semibold text-orange-800 w-16 shrink-0">{name}</span>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-14 shrink-0">신고 기여</span>
                          <div className="flex-1 bg-orange-100 rounded-full h-1.5">
                            <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${d.reportScore * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-orange-600 w-8 text-right">{Math.round(d.reportScore * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-14 shrink-0">종합 위험</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: `${d.composite * 100}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-8 text-right">{Math.round(d.composite * 100)}%</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${riskColor[d.risk]}`}>
                        {riskLabel[d.risk]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ③ 오늘의 모델 입력값 평균 */}
            <h3 className="text-xs font-semibold text-gray-600 mb-3">오늘의 모델 입력값 (31개 시·군 평균)</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: '강수량', weight: '55%', score: avgRainfall, color: 'bg-blue-400' },
                { label: '구조 취약성', weight: '30%', score: avgVuln, color: 'bg-purple-400' },
                { label: '시민 신고', weight: '15%', score: avgReport, color: 'bg-orange-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-28 shrink-0">
                    <span className="text-xs text-gray-600">{item.label}</span>
                    <span className="text-xs text-gray-400">({item.weight})</span>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${item.score * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right">{Math.round(item.score * 100)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modalFilter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalFilter(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-base text-gray-900">
                {modalTitle[modalFilter]}
                <span className="ml-2 text-sm font-normal text-gray-400">{modalReports.length}건</span>
              </h2>
              <button type="button" onClick={() => setModalFilter(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <ul className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {modalReports.length === 0 ? (
                <li className="px-5 py-8 text-center text-sm text-gray-400">내역이 없습니다</li>
              ) : (
                modalReports.map((r) => (
                  <li key={r.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-semibold text-gray-700">#{r.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {r.district ?? '-'} · {r.checklist_items?.[0] ?? '-'}
                        {(r.checklist_items?.length ?? 0) > 1 && ` 외 ${r.checklist_items.length - 1}건`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(r.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle[r.status]}`}>
                      {r.status}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
