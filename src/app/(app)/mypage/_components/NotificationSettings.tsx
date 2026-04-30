'use client'

import { useState } from 'react'

const defaultSettings = [
  { key: 'flood', label: '침수 위험 경보' },
  { key: 'report', label: '신고 처리 알림' },
  { key: 'pay', label: '서울페이 적립 알림' },
]

export default function NotificationSettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>(
    Object.fromEntries(defaultSettings.map(({ key }) => [key, true]))
  )

  const toggle = (key: string) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold text-sm text-gray-700">알림 설정</p>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <ul className="divide-y divide-gray-50">
          {defaultSettings.map(({ key, label }) => (
            <li key={key} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-gray-800">{label}</span>
              <button
                type="button"
                onClick={() => toggle(key)}
                className={`w-11 h-6 rounded-full transition-colors relative ${settings[key] ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
