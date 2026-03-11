'use client'
import { motion } from 'framer-motion'
import { getScoreColor, getScoreGrade } from '@/lib/utils'

interface ScoreGaugeProps {
  score: number
  size?: number
}

export default function ScoreGauge({ score, size = 180 }: ScoreGaugeProps) {
  const r = 70
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  // Arc is 240 degrees (270 start, going clockwise)
  const arcLength = (240 / 360) * circumference
  const offset = arcLength - (score / 100) * arcLength
  const color = getScoreColor(score)
  const grade = getScoreGrade(score)

  // Gauge arc: starts at 150deg (bottom-left), sweeps 240deg
  const startAngle = 150
  const endAngle = 30 // 150 + 240 = 390 = 30
  function polar(angle: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const start = polar(startAngle)
  const end = polar(endAngle)
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${end.x} ${end.y}`

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Glow filter */}
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
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Score fill */}
        <motion.path
          d={trackPath}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={arcLength} // start at 0
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          filter="url(#glow)"
        />

        {/* Center score */}
        <motion.text
          x={cx} y={cy - 6}
          textAnchor="middle"
          fontSize="32"
          fontWeight="700"
          fill={color}
          fontFamily="Syne, sans-serif"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          {score}
        </motion.text>

        <motion.text
          x={cx} y={cy + 16}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
          fontFamily="DM Sans, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          / 100
        </motion.text>

        {/* Grade */}
        <motion.text
          x={cx} y={cy + 36}
          textAnchor="middle"
          fontSize="11"
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
        <text x={end.x + 4} y={end.y + 4} fontSize="9" fill="#475569" textAnchor="start">100</text>
      </svg>
    </div>
  )
}
