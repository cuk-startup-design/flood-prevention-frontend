'use client'

import { useEffect, useMemo, useState } from 'react'

type RiskLevel = 'low' | 'medium' | 'high'

interface Props {
  risk: RiskLevel
}

const DROP_COUNT = { low: 0, medium: 14, high: 36 }
const CLOUD_COUNT = { low: 2, medium: 4, high: 5 }

const BG: Record<RiskLevel, string> = {
  low: 'linear-gradient(to bottom, #fef9c3, #e0f2fe)',
  medium: 'linear-gradient(to bottom, #dbeafe, #cbd5e1)',
  high: 'linear-gradient(to bottom, #94a3b8, #475569)',
}

export default function BackgroundScene({ risk }: Props) {
  const [lightning, setLightning] = useState(false)

  const drops = useMemo(
    () =>
      Array.from({ length: DROP_COUNT[risk] }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 0.35 + Math.random() * 0.35,
        height: 10 + Math.random() * 14,
        opacity: 0.4 + Math.random() * 0.4,
      })),
    [risk]
  )

  const clouds = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT[risk] }, (_, i) => ({
        id: i,
        top: 4 + Math.random() * 28,
        scale: 0.6 + Math.random() * 0.7,
        duration: 13 + Math.random() * 14,
        delay: -(Math.random() * 14),
      })),
    [risk]
  )

  useEffect(() => {
    if (risk !== 'high') return
    const id = setInterval(() => {
      setLightning(true)
      setTimeout(() => setLightning(false), 120)
    }, 3200)
    return () => clearInterval(id)
  }, [risk])

  const cloudColor = risk === 'high' ? '#64748b' : '#e2e8f0'

  return (
    <div
      className="absolute inset-0 overflow-hidden transition-all duration-1000"
      style={{ background: BG[risk] }}
    >
      <style>{`
        @keyframes fall {
          0%   { transform: translateY(-20px); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes drift {
          0%   { transform: translateX(-160px); }
          100% { transform: translateX(calc(100vw + 160px)); }
        }
      `}</style>

      {/* 번개 플래시 */}
      {lightning && <div className="absolute inset-0 bg-white/40 z-10 pointer-events-none" />}

      {/* 구름 */}
      {clouds.map((c) => (
        <div
          key={c.id}
          className="absolute pointer-events-none"
          style={{
            top: `${c.top}%`,
            animation: `drift ${c.duration}s linear ${c.delay}s infinite`,
          }}
        >
          <svg
            viewBox="0 0 120 50"
            width={120 * c.scale}
            height={50 * c.scale}
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="60" cy="36" rx="50" ry="18" fill={cloudColor} />
            <ellipse cx="44" cy="28" rx="28" ry="22" fill={cloudColor} />
            <ellipse cx="76" cy="25" rx="22" ry="18" fill={cloudColor} />
          </svg>
        </div>
      ))}

      {/* 빗방울 */}
      {drops.map((d) => (
        <div
          key={d.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${d.left}%`,
            top: 0,
            width: risk === 'high' ? '2.5px' : '1.5px',
            height: `${d.height}px`,
            background: risk === 'high' ? 'rgba(96,165,250,0.75)' : 'rgba(147,197,253,0.65)',
            animation: `fall ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
