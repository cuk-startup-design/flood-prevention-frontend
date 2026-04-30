const payHistory = [
  { title: '하수구 신고', id: '#8823', points: 500 },
  { title: '하수구 신고', id: '#8791', points: 500 },
  { title: '하수구 신고', id: '#8714', points: 500 },
]

const total = payHistory.reduce((sum, item) => sum + item.points, 0)

export default function SeoulPaySection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold text-sm text-gray-700">최근 서울페이 적립 내역</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-50">
          {payHistory.map(({ title, id, points }) => (
            <li key={id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-700">{title} ({id})</span>
              <span className="text-sm font-semibold text-blue-600">+{points}P</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <span className="text-sm font-semibold text-gray-700">누적 합계</span>
          <span className="text-base font-bold text-blue-600">{total.toLocaleString()}P</span>
        </div>
      </div>
    </div>
  )
}
