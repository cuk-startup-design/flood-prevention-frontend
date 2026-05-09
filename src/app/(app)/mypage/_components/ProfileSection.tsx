'use client'

import { useUserStore } from '@/store/userStore'

export default function ProfileSection() {
  const { profile } = useUserStore()

  const name = profile?.name ?? '이름 없음'
  const district = profile?.district ?? '지역 미설정'
  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')
    : ''

  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
        {name[0]}
      </div>
      <div className="text-center">
        <p className="font-bold text-lg text-gray-900">{name}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {district} · 가입 {joinedAt}
        </p>
      </div>
    </div>
  )
}
