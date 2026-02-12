import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { EVHistoryEntry } from '@/engine/types.js';

interface SessionChartProps {
  data: EVHistoryEntry[];
}

export default function SessionChart({ data }: SessionChartProps) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id="bankrollGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4caf50" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="handNumber"
          tick={{ fontSize: 10, fill: '#7a9a7a' }}
          axisLine={{ stroke: '#3a5a3a' }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#7a9a7a' }}
          axisLine={{ stroke: '#3a5a3a' }}
        />
        <Tooltip
          contentStyle={{
            background: '#1a2e22',
            border: '1px solid #3a5a3a',
            borderRadius: '6px',
            fontSize: '12px',
          }}
          formatter={(value) => [`$${value}`, 'Bankroll']}
        />
        <Area
          type="monotone"
          dataKey="bankroll"
          stroke="#4caf50"
          fill="url(#bankrollGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
