import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, BellOff, ExternalLink } from 'lucide-react'
import { getAlerts, SENSOR_INFO } from '@/services/api'
import type { Alert, Severity } from '@/types'
import { StatusBadge, StatusDot } from '@/components/StatusBadge'
import { Skeleton } from '@/components/Skeleton'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { fadeSlideUp, staggerContainer } from '@/lib/motion'

// ===========================================================================
// Alerts (/app/alerts) — filterable, explainable alert list with expandable
// detail. The explainable REASON line is the product differentiator.
// ===========================================================================

const SEVERITIES: (Severity | 'all')[] = ['all', 'critical', 'warning', 'normal']

function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Alerts() {
  const reduced = useReducedMotion()
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  })

  const [severity, setSeverity] = useState<Severity | 'all'>('all')
  const [wellFilter, setWellFilter] = useState<string>('all')

  const wells = useMemo(() => {
    const set = new Map<string, string>()
    alerts?.forEach((a) => set.set(a.wellId, a.wellName))
    return Array.from(set, ([id, name]) => ({ id, name }))
  }, [alerts])

  const filtered = useMemo(() => {
    return (alerts ?? []).filter((a) => {
      if (severity !== 'all' && a.severity !== severity) return false
      if (wellFilter !== 'all' && a.wellId !== wellFilter) return false
      return true
    })
  }, [alerts, severity, wellFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Alerts</h1>
        <p className="text-sm text-muted">
          Every alert explains which signal drove it, and by how much.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterSelect
          label="Severity"
          value={severity}
          onChange={(v) => setSeverity(v as Severity | 'all')}
          options={SEVERITIES.map((s) => ({
            value: s,
            label: s === 'all' ? 'All severities' : cap(s),
          }))}
        />
        <FilterSelect
          label="Well"
          value={wellFilter}
          onChange={setWellFilter}
          options={[
            { value: 'all', label: 'All wells' },
            ...wells.map((w) => ({ value: w.id, label: w.name })),
          ]}
        />
        {!isLoading && (
          <span className="ml-auto text-xs text-muted">
            {filtered.length} of {alerts?.length ?? 0} alerts
          </span>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasAlerts={(alerts?.length ?? 0) > 0} />
      ) : (
        <motion.ul
          key={`${severity}-${wellFilter}`}
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filtered.map((a) => (
            <motion.li key={a.id} variants={fadeSlideUp(reduced)}>
              <AlertRow alert={a} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alert row (expandable)
// ---------------------------------------------------------------------------

function AlertRow({ alert }: { alert: Alert }) {
  const [open, setOpen] = useState(false)
  const info = SENSOR_INFO[alert.sensor]
  const deviationPct = Math.round(
    ((alert.value - alert.baseline) / alert.baseline) * 100
  )
  const dir = deviationPct >= 0 ? 'above' : 'below'

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-bg/40"
      >
        {/* severity color rail */}
        <span
          className={[
            'h-10 w-1 shrink-0 rounded-full',
            alert.severity === 'critical'
              ? 'bg-critical'
              : alert.severity === 'warning'
                ? 'bg-warning'
                : 'bg-normal',
          ].join(' ')}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{alert.wellName}</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">{info.label}</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-muted">
              {fmtTimestamp(alert.createdAt)}
            </span>
          </div>
          {/* Explainable reason — the differentiator */}
          <p className="mt-1 truncate text-sm font-medium text-text">
            {alert.reason}
          </p>
        </div>

        <StatusBadge status={alert.severity} />
        <ChevronDown
          className={[
            'h-4 w-4 shrink-0 text-muted transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <DetailStat
                  label="Driving signal"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <StatusDot status={alert.severity} />
                      {info.label}
                    </span>
                  }
                />
                <DetailStat
                  label="Reading"
                  value={
                    <span className="tnum">
                      {alert.value} {info.unit}
                    </span>
                  }
                />
                <DetailStat
                  label="Baseline"
                  value={
                    <span className="tnum">
                      {alert.baseline} {info.unit}
                    </span>
                  }
                />
              </div>

              {/* Reading vs baseline bar */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>Deviation from baseline</span>
                  <span
                    className={
                      deviationPct >= 0 ? 'text-warning' : 'text-teal-light'
                    }
                  >
                    {Math.abs(deviationPct)}% {dir}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
                  <div
                    className={[
                      'h-full rounded-full',
                      alert.severity === 'critical'
                        ? 'bg-critical'
                        : alert.severity === 'warning'
                          ? 'bg-warning'
                          : 'bg-normal',
                    ].join(' ')}
                    style={{
                      width: `${Math.min(Math.abs(deviationPct), 100)}%`,
                    }}
                  />
                </div>
              </div>

              <Link
                to={`/app/well/${alert.wellId}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-teal-light transition-colors hover:text-text"
              >
                View well
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function DetailStat({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-input border border-border bg-bg p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Filter select + empty state
// ---------------------------------------------------------------------------

function FilterSelect({
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

function EmptyState({ hasAlerts }: { hasAlerts: boolean }) {
  return (
    <div className="rounded-card border border-border bg-surface p-12 text-center">
      <BellOff className="mx-auto h-8 w-8 text-muted" />
      <p className="mt-3 font-medium">
        {hasAlerts ? 'No alerts match these filters' : 'No active alerts'}
      </p>
      <p className="mt-1 text-sm text-muted">
        {hasAlerts
          ? 'Try widening the severity or well filter.'
          : 'All wells are operating within normal baselines.'}
      </p>
    </div>
  )
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
