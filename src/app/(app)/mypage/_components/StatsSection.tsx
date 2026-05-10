'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/store/userStore'

export default function StatsSection() {
  const { user } = useUserStore()
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(0)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', '완료'),
    ]).then(([totalRes, doneRes]) => {
      setTotal(totalRes.count ?? 0)
      setDone(doneRes.count ?? 0)
    })
  }, [user])

  const stats = [
    { value: `${total}건`, label: '총 신고' },
    { value: `${done * 500}P`, label: '서울페이' },
    { value: `${done}건`, label: '처리 완료' },
  ]

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
