import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import {
  Droplets,
  Bell,
  HeartPulse,
  TriangleAlert,
  ChevronRight,
} from 'lucide-react'
import { getKpis, getWells, getAlerts, getSensorHistory } from '@/services/api'
import type { Kpi, Well } from '@/types'
import { CountUp } from '@/components/CountUp'
import { Skeleton } from '@/components/Skeleton'
import { StatusBadge } from '@/components/StatusBadge'
import { Sparkline } from '@/components/Sparkline'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { fadeSlideUp, staggerContainer } from '@/lib/motion'

// ===========================================================================
// Overview (/app) — field overview: KPIs, well status grid, recent alerts.
// All data via api.ts (mock).
// ===========================================================================

export default function Overview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Field Overview</h1>
        <p className="text-sm text-muted">
          Live health across every monitored well.
        </p>
      </div>

      <KpiRow />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WellGrid />
        </div>
        <div>
          <RecentAlerts />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KPI row
// ---------------------------------------------------------------------------

function KpiRow() {
  const { data, isLoading } = useQuery({ queryKey: ['kpis'], queryFn: getKpis })
  const reduced = useReducedMotion()

  const cards: {
    key: keyof Kpi
    label: string
    icon: typeof Droplets
    color: string
    suffix?: string
  }[] = [
    { key: 'wellsOnline', label: 'Wells Online', icon: Droplets, color: 'text-teal-light' },
    { key: 'activeAlerts', label: 'Active Alerts', icon: Bell, color: 'text-warning' },
    { key: 'avgHealth', label: 'Avg Health', icon: HeartPulse, color: 'text-normal', suffix: '%' },
    { key: 'anomaliesToday', label: 'Anomalies Today', icon: TriangleAlert, color: 'text-critical' },
  ]

  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map(({ key, label, icon: Icon, color, suffix }) => (
        <motion.div
          key={key}
          variants={fadeSlideUp(reduced)}
          className="rounded-card border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{label}</span>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <div className="mt-3 text-3xl font-bold tracking-tight">
            {isLoading || !data ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <CountUp value={data[key]} suffix={suffix ?? ''} />
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Well status grid
// ---------------------------------------------------------------------------

function WellGrid() {
  const { data: wells, isLoading } = useQuery({
    queryKey: ['wells'],
    queryFn: getWells,
  })
  const reduced = useReducedMotion()

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Well Status</h2>
        <span className="text-xs text-muted">
          {wells ? `${wells.length} wells` : ''}
        </span>
      </div>

      {isLoading || !wells ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-card border border-border bg-surface p-5"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-3 h-9 w-full" />
              <Skeleton className="mt-3 h-4 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {wells.map((well) => (
            <motion.div key={well.id} variants={fadeSlideUp(reduced)}>
              <WellCard well={well} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  )
}

const SPARK_COLOR: Record<Well['status'], string> = {
  normal: '#3BA55D',
  warning: '#F2A93B',
  critical: '#E4572E',
}

function WellCard({ well }: { well: Well }) {
  // Each card pulls a short history for its sparkline (mock).
  const { data: history } = useQuery({
    queryKey: ['spark', well.id],
    queryFn: () => getSensorHistory(well.id, 24),
  })

  const series = history?.map((r) => r.flowRate) ?? []

  return (
    <Link
      to={`/app/well/${well.id}`}
      className="group block rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{well.name}</h3>
            <ChevronRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted">
            {well.location}
          </p>
        </div>
        <StatusBadge status={well.status} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs text-muted">Health</div>
          <div className="text-2xl font-bold tracking-tight">
            <CountUp value={well.health} suffix="%" />
          </div>
        </div>
        <div className="w-1/2">
          {series.length > 0 ? (
            <Sparkline data={series} color={SPARK_COLOR[well.status]} />
          ) : (
            <Skeleton className="h-9 w-full" />
          )}
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Recent alerts feed
// ---------------------------------------------------------------------------

function RecentAlerts() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  })
  const reduced = useReducedMotion()

  const recent = alerts?.slice(0, 6) ?? []

  return (
    <section className="rounded-card border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Alerts</h2>
        <Link
          to="/app/alerts"
          className="text-xs text-teal-light transition-colors hover:text-text"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          No alerts. All wells nominal.
        </p>
      ) : (
        <motion.ul
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className="space-y-2"
        >
          {recent.map((a) => (
            <motion.li key={a.id} variants={fadeSlideUp(reduced)}>
              <Link
                to="/app/alerts"
                className="flex items-start gap-3 rounded-input border border-border bg-bg p-3 transition-colors hover:border-primary/40"
              >
                <span className="mt-1">
                  <StatusBadge status={a.severity} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {a.wellName}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {a.reason}
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  )
}
