import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Radio } from 'lucide-react'
import {
  getWell,
  getSensorHistory,
  getNextReading,
  SENSOR_INFO,
  SENSOR_ORDER,
} from '@/services/api'
import type { SensorReading } from '@/types'
import { SensorChart } from '@/components/SensorChart'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/Skeleton'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { fadeSlideUp, staggerContainer } from '@/lib/motion'

// ===========================================================================
// Well Detail (/app/well/:id)
//   • Header: name, overall status badge, last-updated
//   • Four live sensor charts with count-up readouts + status strips
//   • Live feed simulated by polling api.getNextReading and appending points
// ===========================================================================

const MAX_POINTS = 40
const TICK_MS = 3000

export default function WellDetail() {
  const { id = '' } = useParams()
  const reduced = useReducedMotion()

  const { data: well, isLoading: wellLoading } = useQuery({
    queryKey: ['well', id],
    queryFn: () => getWell(id),
  })

  const { data: initial, isLoading: histLoading } = useQuery({
    queryKey: ['history', id],
    queryFn: () => getSensorHistory(id, MAX_POINTS),
  })

  const [readings, setReadings] = useState<SensorReading[]>([])
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  // Seed the buffer from the initial history.
  useEffect(() => {
    if (initial) {
      setReadings(initial)
      setLastUpdated(initial[initial.length - 1]?.timestamp ?? null)
    }
  }, [initial])

  // Live tick: append one fresh reading every few seconds.
  useEffect(() => {
    if (!id || !initial) return
    let cancelled = false

    const tick = async () => {
      const next = await getNextReading(id)
      if (cancelled || !next) return
      setReadings((prev) => [...prev, next].slice(-MAX_POINTS))
      setLastUpdated(next.timestamp)
    }

    timerRef.current = window.setInterval(tick, TICK_MS)
    return () => {
      cancelled = true
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [id, initial])

  if (!wellLoading && !well) {
    return (
      <div className="rounded-card border border-border bg-surface p-10 text-center">
        <p className="text-muted">Well not found.</p>
        <Link
          to="/app"
          className="mt-4 inline-block text-sm text-teal-light hover:text-text"
        >
          ← Back to Overview
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/app"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Overview
      </Link>

      {/* Header */}
      {wellLoading || !well ? (
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-6 w-24" />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {well.name}
              </h1>
              <StatusBadge status={well.status} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5" />
              {well.location}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <Radio className="h-3.5 w-3.5 text-normal" />
            {lastUpdated
              ? `Updated ${new Date(lastUpdated).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}`
              : 'Connecting…'}
          </div>
        </div>
      )}

      {/* Four sensor charts */}
      {histLoading || readings.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-card border border-border bg-surface p-5"
            >
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-2 h-8 w-24" />
              <Skeleton className="mt-4 h-40 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={staggerContainer(0.08)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {SENSOR_ORDER.map((key) => (
            <motion.div key={key} variants={fadeSlideUp(reduced)}>
              <SensorChart info={SENSOR_INFO[key]} readings={readings} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
