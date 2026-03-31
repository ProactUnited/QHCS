'use client'
import { motion } from 'framer-motion'
import { getScoreColor, getScoreGrade } from '@/lib/utils'

interface ScoreGaugeProps {
  score: number
  base?: number   // base score from config — default 500, max = base*2 = 1000
  size?: number
}

export default function ScoreGauge({ score, base = 1000, size = 180 }: ScoreGaugeProps) {
  const max = base * 1.25
  const r   = 70
  const cx  = size / 2
  const cy  = size / 2

  const circumference = 2 * Math.PI * r
  const arcLength     = (240 / 360) * circumference         // 240° sweep
  const fillRatio     = Math.min(1, Math.max(0, score / max))
  const offset        = arcLength - fillRatio * arcLength

  const color = getScoreColor(score, base)
  const grade = getScoreGrade(score, base)

  // Arc: starts at 150°, sweeps 240° clockwise to 30°
  const startAngle = 150
  const endAngle   = 30
  function polar(angle: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const start     = polar(startAngle)
  const end       = polar(endAngle)
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.06)"
              strokeWidth="10" strokeLinecap="round" />

        {/* Filled arc */}
        <motion.path
          d={trackPath}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          filter="url(#glow)"
        />

        {/* Score number */}
        <motion.text
          x={cx} y={cy - 6}
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill={color}
          fontFamily="Syne, sans-serif"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          {score}
        </motion.text>

        {/* / max */}
        <motion.text
          x={cx} y={cy + 16}
          textAnchor="middle"
          fontSize="10"
          fill="#64748b"
          fontFamily="DM Sans, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          / {max}
        </motion.text>

        {/* Grade */}
        <motion.text
          x={cx} y={cy + 34}
          textAnchor="middle"
          fontSize="10"
          fill={color}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          {grade}
        </motion.text>

        {/* Min / Max labels */}
        <text x={start.x - 4} y={start.y + 4} fontSize="9" fill="#475569" textAnchor="end">0</text>
        <text x={end.x + 4}   y={end.y + 4}   fontSize="9" fill="#475569" textAnchor="start">{max}</text>
      </svg>
    </div>
  )
}