import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import {
  getAnalytics,
  getWells,
  SENSOR_INFO,
  SENSOR_ORDER,
} from '@/services/api'
import { Skeleton } from '@/components/Skeleton'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { fadeSlideUp, staggerContainer } from '@/lib/motion'

// ===========================================================================
// Analytics (/app/analytics) — anomaly frequency over time, sensor comparison
// across wells, and a normal-vs-anomaly breakdown. Date/well filter bar.
// ===========================================================================

const TOOLTIP_STYLE = {
  background: '#1E2831',
  border: '1px solid #2F3D49',
  borderRadius: 10,
  color: '#E8EEF2',
  fontSize: 12,
}

export default function Analytics() {
  const reduced = useReducedMotion()
  const [wellId, setWellId] = useState('all')
  const [days, setDays] = useState(14)

  const { data: wells } = useQuery({ queryKey: ['wells'], queryFn: getWells })
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', wellId, days],
    queryFn: () => getAnalytics({ wellId, days }),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted">
          Anomaly trends and sensor behavior across the field.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          label="Well"
          value={wellId}
          onChange={setWellId}
          options={[
            { value: 'all', label: 'All wells' },
            ...(wells?.map((w) => ({ value: w.id, label: w.name })) ?? []),
          ]}
        />
        <Select
          label="Range"
          value={String(days)}
          onChange={(v) => setDays(Number(v))}
          options={[
            { value: '7', label: 'Last 7 days' },
            { value: '14', label: 'Last 14 days' },
            { value: '30', label: 'Last 30 days' },
          ]}
        />
      </div>

      {isLoading || !data ? (
        <LoadingGrid />
      ) : (
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Anomaly frequency */}
          <motion.section
            variants={fadeSlideUp(reduced)}
            className="rounded-card border border-border bg-surface p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">Anomaly Frequency</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.anomalyFrequency}
                  margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                >
                  <defs>
                    <linearGradient id="anomGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E4572E" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#E4572E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2F3D49" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8A99A6', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#2F3D49' }}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fill: '#8A99A6', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Anomalies"
                    stroke="#E4572E"
                    strokeWidth={2}
                    fill="url(#anomGrad)"
                    isAnimationActive={!reduced}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Sensor comparison */}
            <motion.section
              variants={fadeSlideUp(reduced)}
              className="rounded-card border border-border bg-surface p-5 lg:col-span-3"
            >
              <h2 className="mb-1 text-lg font-semibold">
                Sensor Comparison
              </h2>
              <p className="mb-4 text-xs text-muted">
                Average reading as % of each sensor’s normal baseline.
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={buildComparison(data.sensorComparison)}
                    margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid stroke="#2F3D49" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="well"
                      tick={{ fill: '#8A99A6', fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: '#2F3D49' }}
                    />
                    <YAxis
                      tick={{ fill: '#8A99A6', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      unit="%"
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#8A99A6' }}
                    />
                    {SENSOR_ORDER.map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        name={SENSOR_INFO[key].label}
                        fill={SENSOR_INFO[key].color}
                        radius={[3, 3, 0, 0]}
                        isAnimationActive={!reduced}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            {/* Normal vs anomaly breakdown */}
            <motion.section
              variants={fadeSlideUp(reduced)}
              className="rounded-card border border-border bg-surface p-5 lg:col-span-2"
            >
              <h2 className="mb-4 text-lg font-semibold">
                Normal vs Anomaly
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Normal', value: data.breakdown.normal },
                        { name: 'Anomaly', value: data.breakdown.anomaly },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      isAnimationActive={!reduced}
                    >
                      <Cell fill="#3BA55D" />
                      <Cell fill="#E4572E" />
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#8A99A6' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-center text-sm text-muted">
                {anomalyPercentText(data.breakdown)}
              </p>
            </motion.section>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildComparison(
  rows: {
    well: string
    pressure: number
    temperature: number
    vibration: number
    flowRate: number
  }[]
) {
  // Normalize each sensor to % of its baseline so scales are comparable.
  return rows.map((r) => ({
    well: r.well.replace('Well_', 'W'),
    pressure: pctOfBaseline('pressure', r.pressure),
    temperature: pctOfBaseline('temperature', r.temperature),
    vibration: pctOfBaseline('vibration', r.vibration),
    flowRate: pctOfBaseline('flowRate', r.flowRate),
  }))
}

function pctOfBaseline(
  key: 'pressure' | 'temperature' | 'vibration' | 'flowRate',
  value: number
): number {
  return Math.round((value / SENSOR_INFO[key].baseline) * 100)
}

function anomalyPercentText(b: { normal: number; anomaly: number }): string {
  const total = b.normal + b.anomaly
  if (total === 0) return 'No readings in range.'
  const pct = ((b.anomaly / total) * 100).toFixed(1)
  return `${pct}% of readings flagged anomalous`
}

function LoadingGrid() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-72 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 w-full lg:col-span-3" />
        <Skeleton className="h-72 w-full lg:col-span-2" />
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none rounded-input border border-border bg-surface py-1.5 pl-3 pr-8 text-sm text-text outline-none focus:border-primary"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </label>
  )
}
