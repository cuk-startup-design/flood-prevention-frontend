const reports = [
  { location: '강남대로 396 하수구', time: '방금 전', id: '#8823', status: '접수됨' },
  { location: '테헤란로 152 하수구', time: '3일 전', id: '#8791', status: '처리중' },
  { location: '서초대로 하수구', time: '1주일 전', id: '#8714', status: '완료' },
]

const statusStyle: Record<string, string> = {
  접수됨: 'bg-blue-100 text-blue-600',
  처리중: 'bg-yellow-100 text-yellow-600',
  완료: 'bg-green-100 text-green-600',
}

const statusIcon: Record<string, string> = {
  접수됨: '●',
  처리중: '●',
  완료: '✓',
}

export default function ReportListSection() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold text-sm text-gray-700">내 신고 내역</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-50">
          {reports.map(({ location, time, id, status }) => (
            <li key={id} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className={`text-xs ${status === '완료' ? 'text-green-500' : 'text-gray-300'}`}>
                  {statusIcon[status]}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{location}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{time} · {id}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[status]}`}>
                {status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
