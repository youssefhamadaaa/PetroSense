import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SensorInfo } from '@/services/api'
import { classifySensor } from '@/services/api'
import type { SensorReading } from '@/types'
import { CountUp } from '@/components/CountUp'
import { StatusBadge } from '@/components/StatusBadge'
import { useReducedMotion } from '@/lib/useReducedMotion'

// ---------------------------------------------------------------------------
// SensorChart — one card: title, live current-value readout (count-up),
// per-signal status strip, and a colored area/line chart. Smooth transitions
// as new points append.
// ---------------------------------------------------------------------------

function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function SensorChart({
  info,
  readings,
}: {
  info: SensorInfo
  readings: SensorReading[]
}) {
  const reduced = useReducedMotion()

  const data = useMemo(
    () =>
      readings.map((r) => ({
        t: fmtTime(r.timestamp),
        v: r[info.key],
      })),
    [readings, info.key]
  )

  const current = readings.length ? readings[readings.length - 1][info.key] : 0
  const { status, deviationPct } = classifySensor(info.key, current)

  const decimals = info.key === 'vibration' ? 2 : info.key === 'flowRate' ? 0 : 1
  const gradId = `grad-${info.key}`

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      {/* Header row */}
      <div className="mb-1 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted">{info.label}</h3>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight">
              <CountUp value={current} decimals={decimals} />
            </span>
            <span className="text-sm text-muted">{info.unit}</span>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Deviation vs baseline */}
      <div className="mb-3 text-xs text-muted">
        Baseline {info.baseline} {info.unit} ·{' '}
        <span
          className={
            deviationPct >= 0 ? 'text-warning' : 'text-teal-light'
          }
        >
          {deviationPct >= 0 ? '+' : ''}
          {deviationPct}%
        </span>
      </div>

      {/* Chart */}
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={info.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={info.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              tick={{ fill: '#8A99A6', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#2F3D49' }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#8A99A6', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={44}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                background: '#1E2831',
                border: '1px solid #2F3D49',
                borderRadius: 10,
                color: '#E8EEF2',
                fontSize: 12,
              }}
              labelStyle={{ color: '#8A99A6' }}
              formatter={(val: number) => [
                `${val} ${info.unit}`,
                info.label,
              ]}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={info.color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              isAnimationActive={!reduced}
              animationDuration={300}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
