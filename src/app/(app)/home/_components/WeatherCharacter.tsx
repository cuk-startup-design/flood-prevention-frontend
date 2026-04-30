'use client'

type RiskLevel = 'low' | 'medium' | 'high'

interface Props {
  risk: RiskLevel
}

const gradientColors: Record<RiskLevel, [string, string]> = {
  low: ['#FDE68A', '#F59E0B'],
  medium: ['#BFDBFE', '#60A5FA'],
  high: ['#CBD5E1', '#64748B'],
}

const animations: Record<RiskLevel, string> = {
  low: 'float 3s ease-in-out infinite',
  medium: 'bob 2.5s ease-in-out infinite',
  high: 'shake 0.45s ease-in-out infinite',
}

export default function WeatherCharacter({ risk }: Props) {
  const [c1, c2] = gradientColors[risk]

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-7px); }
          75% { transform: translateX(7px); }
        }
      `}</style>

      <div style={{ animation: animations[risk], display: 'inline-block' }}>
        <svg viewBox="0 0 200 210" width="200" height="210" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id={`body-${risk}`} cx="38%" cy="32%" r="65%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </radialGradient>
          </defs>

          {/* 그림자 */}
          <ellipse cx="100" cy="196" rx="52" ry="9" fill="rgba(0,0,0,0.08)" />

          {/* 몸통 */}
          <circle cx="100" cy="105" r="72" fill={`url(#body-${risk})`} />

          {/* 눈 */}
          {risk === 'low' && (
            <>
              <path d="M70 98 Q82 86 94 98" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M106 98 Q118 86 130 98" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="68" cy="118" r="13" fill="#FCA5A5" opacity="0.35" />
              <circle cx="132" cy="118" r="13" fill="#FCA5A5" opacity="0.35" />
            </>
          )}
          {risk === 'medium' && (
            <>
              <circle cx="82" cy="97" r="9" fill="#1f2937" />
              <circle cx="118" cy="97" r="9" fill="#1f2937" />
              <circle cx="85" cy="94" r="3" fill="white" />
              <circle cx="121" cy="94" r="3" fill="white" />
            </>
          )}
          {risk === 'high' && (
            <>
              <circle cx="82" cy="97" r="12" fill="white" />
              <circle cx="118" cy="97" r="12" fill="white" />
              <circle cx="84" cy="99" r="7" fill="#1f2937" />
              <circle cx="120" cy="99" r="7" fill="#1f2937" />
              <circle cx="86" cy="96" r="2.5" fill="white" />
              <circle cx="122" cy="96" r="2.5" fill="white" />
              {/* 땀방울 */}
              <path d="M150 70 Q156 82 150 92 Q144 82 150 70Z" fill="#93C5FD" opacity="0.9" />
            </>
          )}

          {/* 입 */}
          {risk === 'low' && (
            <path d="M76 122 Q100 142 124 122" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
          )}
          {risk === 'medium' && (
            <path d="M84 122 L116 122" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
          )}
          {risk === 'high' && (
            <path d="M78 134 Q100 118 122 134" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
          )}
        </svg>
      </div>
    </>
  )
}
