import { memo } from 'react'
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts'

// ---------------------------------------------------------------------------
// Sparkline — tiny inline trend line (no axes/grid). Used on well cards.
// ---------------------------------------------------------------------------

function SparklineBase({
  data,
  color = '#4BB8C4',
  height = 36,
}: {
  data: number[]
  color?: string
  height?: number
}) {
  const points = data.map((v, i) => ({ i, v }))
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export const Sparkline = memo(SparklineBase)
