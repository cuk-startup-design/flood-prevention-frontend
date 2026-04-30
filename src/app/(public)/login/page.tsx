'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [id, setId] = useState('admin')
  const [password, setPassword] = useState('1234')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (id === 'admin' && password === '1234') {
      router.push('/map')
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="w-full max-w-xs flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-center">로그인</h1>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="아이디"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          로그인
        </button>
        <p className="text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-blue-600 font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
