const riskHistory = [
  { location: '강남대로 396 일대', date: '2024.08.18', level: '심각' },
  { location: '역삼역 교차로', date: '2023.07.11', level: '보통' },
  { location: '테헤란로 152', date: '2022.09.01', level: '심각' },
]

const levelStyle: Record<string, string> = {
  심각: 'bg-red-100 text-red-600',
  보통: 'bg-yellow-100 text-yellow-600',
  낮음: 'bg-green-100 text-green-600',
}

export default function FloodRiskSection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold text-sm text-gray-700">내 위치 침수 위험 현황</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span>📍</span>
            <span>역삼동 상습 침수 이력</span>
          </div>
          <span className="text-xs text-gray-400">최근 5년</span>
        </div>
        <ul className="divide-y divide-gray-50">
          {riskHistory.map(({ location, date, level }) => (
            <li key={date} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{location}</p>
                <p className="text-xs text-gray-400 mt-0.5">{date}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelStyle[level]}`}>
                {level}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
