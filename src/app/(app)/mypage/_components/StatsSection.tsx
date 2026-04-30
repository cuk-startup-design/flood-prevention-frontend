const stats = [
  { value: '4건', label: '총 신고' },
  { value: '1,500P', label: '서울페이' },
  { value: '3건', label: '처리 완료' },
]

export default function StatsSection() {
  return (
    <div className="flex border-t border-b border-gray-100">
      {stats.map(({ value, label }, i) => (
        <div
          key={label}
          className={`flex-1 flex flex-col items-center py-4 gap-1 ${i !== 0 ? 'border-l border-gray-100' : ''}`}
        >
          <span className="font-bold text-base text-blue-600">{value}</span>
          <span className="text-xs text-gray-500">{label}</span>
        </div>
      ))}
    </div>
  )
}
