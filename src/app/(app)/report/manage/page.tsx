'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

const tabs = ['진행중', '완료'] as const
type Tab = (typeof tabs)[number]

export default function ReportManagePage() {
  const [activeTab, setActiveTab] = useState<Tab>('진행중')

  return (
    <div className="flex flex-col">
      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      <div className="p-4">
        {activeTab === '진행중' && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm">
            진행중인 신고가 없습니다
          </div>
        )}
        {activeTab === '완료' && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm">
            완료된 신고가 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
