'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'user' | 'admin'

const GYEONGGI_SIGUN = [
  '수원시', '성남시', '의정부시', '안양시', '부천시',
  '광명시', '평택시', '동두천시', '안산시', '고양시',
  '과천시', '구리시', '남양주시', '오산시', '시흥시',
  '군포시', '의왕시', '하남시', '용인시', '파주시',
  '이천시', '안성시', '김포시', '화성시', '광주시',
  '양주시', '포천시', '여주시', '연천군', '가평군',
  '양평군',
]

export default function SignupPage() {
  const [role, setRole] = useState<Role>('user')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [district, setDistrict] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !district || !password || !passwordConfirm) {
      setError('모든 항목을 입력해주세요.')
      return
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, district },
      },
    })
    setLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    router.push('/login')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gray-50">
      <div className="w-full max-w-xs flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="text-sm text-gray-500 mt-1">침수 예방 서비스에 오신 것을 환영합니다</p>
        </div>

        {/* 역할 선택 탭 */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            일반 사용자
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            관리자
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
          />
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white text-gray-700"
          >
            <option value="" disabled>거주 지역 (경기도 시/군 선택)</option>
            {GYEONGGI_SIGUN.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 bg-white"
          />

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mt-1 disabled:bg-blue-300"
          >
            {loading ? '처리 중...' : role === 'admin' ? '관리자로 가입하기' : '가입하기'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 font-semibold">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
