import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-xs flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">회원가입</h1>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="아이디"
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="이름"
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          회원가입
        </button>
        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 font-medium">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
