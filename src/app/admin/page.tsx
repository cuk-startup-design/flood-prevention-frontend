const stats = [
  { label: '전체 신고', value: '128', sub: '이번 달 +23', color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: '처리 대기', value: '14', sub: '즉시 처리 필요', color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: '처리 완료', value: '107', sub: '처리율 83.6%', color: 'text-green-600', bg: 'bg-green-50' },
  { label: '반려', value: '7', sub: '사유 불충분 등', color: 'text-red-500', bg: 'bg-red-50' },
]

const districtStats = [
  { name: '강남구', count: 18, risk: 'high' },
  { name: '송파구', count: 15, risk: 'high' },
  { name: '영등포구', count: 13, risk: 'high' },
  { name: '마포구', count: 11, risk: 'medium' },
  { name: '강서구', count: 10, risk: 'medium' },
  { name: '성동구', count: 9, risk: 'medium' },
  { name: '관악구', count: 8, risk: 'low' },
  { name: '종로구', count: 5, risk: 'low' },
]

const riskColor = { high: 'bg-red-100 text-red-600', medium: 'bg-yellow-100 text-yellow-600', low: 'bg-green-100 text-green-600' }
const riskLabel = { high: '높음', medium: '보통', low: '낮음' }

const recentReports = [
  { id: 'R-20250508-014', gu: '강남구', type: '오물·쓰레기', status: '대기', time: '13:42' },
  { id: 'R-20250508-013', gu: '송파구', type: '물이 고여 빠지지 않음', status: '완료', time: '12:15' },
  { id: 'R-20250508-012', gu: '영등포구', type: '악취', status: '대기', time: '11:03' },
  { id: 'R-20250508-011', gu: '마포구', type: '격자 덮개 파손', status: '반려', time: '09:30' },
]

const statusStyle: Record<string, string> = {
  대기: 'bg-orange-100 text-orange-600',
  완료: 'bg-green-100 text-green-600',
  반려: 'bg-gray-100 text-gray-500',
}

export default function AdminDashboard() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
        <p className="text-sm text-gray-500 mt-0.5">2025년 5월 8일 기준</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${s.bg} mb-3`}>
              <span className={`text-lg font-bold ${s.color}`}>{s.value[0]}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 구별 신고 현황 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">구별 신고 현황</h2>
          <div className="flex flex-col gap-2">
            {districtStats.map((d) => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-16 shrink-0">{d.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(d.count / 18) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-6 text-right">{d.count}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${riskColor[d.risk as keyof typeof riskColor]}`}>
                  {riskLabel[d.risk as keyof typeof riskLabel]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 신고 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-4">최근 신고</h2>
          <div className="flex flex-col gap-2">
            {recentReports.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{r.id}</p>
                  <p className="text-xs text-gray-500">{r.gu} · {r.type}</p>
                </div>
                <span className="text-xs text-gray-400">{r.time}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusStyle[r.status]}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
