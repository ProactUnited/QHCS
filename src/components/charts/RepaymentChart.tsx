// 'use client'
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
//   ResponsiveContainer, Cell, Legend
// } from 'recharts'
// import { format, parseISO } from 'date-fns'

// interface RepaymentData {
//   month: string
//   paid: number
//   missed: number
// }

// interface Props {
//   data: RepaymentData[]
// }

// const CustomTooltip = ({ active, payload, label }: any) => {
//   if (!active || !payload?.length) return null
//   return (
//     <div className="glass-card rounded-lg p-3 text-xs">
//       <p className="text-slate-300 font-semibold mb-1">{label}</p>
//       {payload.map((p: any) => (
//         <p key={p.dataKey} style={{ color: p.fill }}>
//           {p.dataKey === 'paid' ? '✓ Paid' : '✗ Missed'}: {p.value}
//         </p>
//       ))}
//     </div>
//   )
// }

// export default function RepaymentChart({ data }: Props) {
//   return (
//     <ResponsiveContainer width="100%" height={200}>
//       <BarChart data={data} barGap={2} barSize={14}>
//         <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
//         <XAxis
//           dataKey="month"
//           tick={{ fill: '#64748b', fontSize: 11 }}
//           axisLine={false}
//           tickLine={false}
//         />
//         <YAxis
//           tick={{ fill: '#64748b', fontSize: 11 }}
//           axisLine={false}
//           tickLine={false}
//           allowDecimals={false}
//         />
//         <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
//         <Legend
//           wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
//           formatter={(val) => val === 'paid' ? 'Paid' : 'Missed'}
//         />
//         <Bar dataKey="paid" fill="#10b981" radius={[3, 3, 0, 0]} />
//         <Bar dataKey="missed" fill="#f87171" radius={[3, 3, 0, 0]} />
//       </BarChart>
//     </ResponsiveContainer>
//   )
// }


'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

interface RepaymentData {
  month: string
  paid: number
  partial: number
  missed: number
}

interface Props {
  data: RepaymentData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-lg p-3 text-xs">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.dataKey === 'paid'    ? '✓ Paid'    :
           p.dataKey === 'partial' ? '~ Partial' :
                                     '✗ Missed'}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function RepaymentChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barGap={2} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
          formatter={(val) =>
            val === 'paid'    ? 'Paid' :
            val === 'partial' ? 'Partial' :
                                'Missed'
          }
        />
        <Bar dataKey="paid"    fill="#10b981" radius={[3, 3, 0, 0]} />
        <Bar dataKey="partial" fill="#f59e0b" radius={[3, 3, 0, 0]} />
        <Bar dataKey="missed"  fill="#f87171" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}