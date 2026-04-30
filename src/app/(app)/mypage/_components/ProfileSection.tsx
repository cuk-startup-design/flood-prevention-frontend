const user = {
  name: '김민준',
  location: '강남구 역삼동',
  joinedAt: '2026.01.15',
}

export default function ProfileSection() {
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
        {user.name[0]}
      </div>
      <div className="text-center">
        <p className="font-bold text-lg text-gray-900">{user.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {user.location} · 가입 {user.joinedAt}
        </p>
      </div>
    </div>
  )
}
