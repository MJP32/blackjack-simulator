import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { EVHistoryEntry } from '@/engine/types.js';

interface EVChartProps {
  data: EVHistoryEntry[];
}

export default function EVChart({ data }: EVChartProps) {
  if (data.length === 0) return null;

  const startingBankroll = data[0]?.bankroll ?? 1000;

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis
            dataKey="handNumber"
            tick={{ fontSize: 10, fill: '#7a9a7a' }}
            axisLine={{ stroke: '#3a5a3a' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7a9a7a' }}
            axisLine={{ stroke: '#3a5a3a' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              background: '#1a2e22',
              border: '1px solid #3a5a3a',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#7a9a7a' }}
            formatter={(value) => [`$${value}`, 'Bankroll']}
            labelFormatter={(label) => `Hand #${label}`}
          />
          <ReferenceLine
            y={startingBankroll}
            stroke="#ffd700"
            strokeDasharray="3 3"
            strokeOpacity={0.5}
          />
          <Line
            type="monotone"
            dataKey="bankroll"
            stroke="#4caf50"
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
