'use client'

import { useState } from 'react'

type Role = 'user' | 'admin'

interface User {
  id: string
  name: string
  email: string
  role: Role
  joinedAt: string
  reportCount: number
}

const dummy: User[] = [
  { id: 'u-001', name: '김민준', email: 'minjun@example.com', role: 'user', joinedAt: '2025-04-12', reportCount: 8 },
  { id: 'u-002', name: '이서연', email: 'seoyeon@example.com', role: 'user', joinedAt: '2025-04-18', reportCount: 5 },
  { id: 'u-003', name: '박지훈', email: 'jihun@example.com', role: 'admin', joinedAt: '2025-03-01', reportCount: 0 },
  { id: 'u-004', name: '최유진', email: 'yujin@example.com', role: 'user', joinedAt: '2025-05-01', reportCount: 3 },
  { id: 'u-005', name: '정다은', email: 'daeun@example.com', role: 'user', joinedAt: '2025-05-03', reportCount: 12 },
  { id: 'u-006', name: '한승우', email: 'seungwoo@example.com', role: 'user', joinedAt: '2025-05-06', reportCount: 1 },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState(dummy)

  const toggleRole = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u
      )
    )
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">사용자 관리</h1>
        <span className="text-sm text-gray-500">전체 {users.length}명</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['이름', '이메일', '역할', '가입일', '신고 수', '역할 변경'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    u.role === 'admin'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {u.role === 'admin' ? '관리자' : '일반 사용자'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{u.joinedAt}</td>
                <td className="px-4 py-3 text-gray-700 font-semibold">{u.reportCount}건</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleRole(u.id)}
                    className="text-xs px-3 py-1 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    {u.role === 'admin' ? '일반으로 변경' : '관리자로 변경'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
