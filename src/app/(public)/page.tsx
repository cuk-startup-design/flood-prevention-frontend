import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">홍수 예방 시스템</h1>
        <p className="text-gray-500 text-sm">실시간 홍수 모니터링 및 신고 플랫폼</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/login"
          className="w-full text-center bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="w-full text-center border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          회원가입
        </Link>
      </div>
    </div>
  )
}
