"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// interface MonthlyData {
//   month: string
//   repayments: number
//   missed: number
// }

interface MonthlyData {
  month: string;
  repayments: number;
  partial: number; // ← add this
  missed: number;
}

interface RiskDistribution {
  name: string;
  value: number;
  color: string;
}

const TooltipStyle = {
  contentStyle: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-strong)",
    borderRadius: 8,
    fontSize: 12,
    color: "#94a3b8",
  },
};

export function ActivityChart({ data }: { data: MonthlyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="partialGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="missGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
        <XAxis
          dataKey="month"
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip {...TooltipStyle} />
        <Area
          type="monotone"
          dataKey="repayments"
          stroke="#0ea5e9"
          fill="url(#repGrad)"
          strokeWidth={2}
          name="Repayments"
        />
        <Area
          type="monotone"
          dataKey="missed"
          stroke="#f87171"
          fill="url(#missGrad)"
          strokeWidth={2}
          name="Missed"
        />
        <Area
          type="monotone"
          dataKey="partial"
          stroke="#f59e0b"
          fill="url(#partialGrad)"
          strokeWidth={2}
          name="Partial"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RiskPieChart({ data }: { data: RiskDistribution[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#64748b" }}
          formatter={(val, entry: any) => (
            <span style={{ color: entry.color }}>
              {val}: {entry.payload.value}
            </span>
          )}
        />
        <Tooltip {...TooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
