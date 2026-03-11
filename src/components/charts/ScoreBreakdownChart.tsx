'use client'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'
import { ScoreBreakdown } from '@/lib/scoring'

interface Props {
  breakdown: ScoreBreakdown
}

export default function ScoreBreakdownChart({ breakdown }: Props) {
  const data = [
    { subject: 'On-Time', value: Math.max(0, breakdown.onTimeBonus), fullMark: 40 },
    { subject: 'Closed', value: Math.max(0, breakdown.closedBonus), fullMark: 30 },
    { subject: 'Late', value: Math.max(0, -breakdown.lateDeduction), fullMark: 20 },
    { subject: 'Missed', value: Math.max(0, -breakdown.missedDeduction), fullMark: 50 },
    { subject: 'Guarantor', value: Math.max(0, -breakdown.guarantorDeduction), fullMark: 20 },
    { subject: 'Gold Sold', value: Math.max(0, -breakdown.goldSoldDeduction), fullMark: 20 },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(99,179,237,0.08)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: '#64748b', fontSize: 11 }}
        />
        <Radar
          name="Score Factors"
          dataKey="value"
          stroke="#0ea5e9"
          fill="#0ea5e9"
          fillOpacity={0.15}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
