import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/lib/useReducedMotion'

// ---------------------------------------------------------------------------
// CountUp — animates a number from 0 to `value` on mount. Honors reduced
// motion by snapping straight to the final value.
// ---------------------------------------------------------------------------

export function CountUp({
  value,
  duration = 900,
  decimals = 0,
  suffix = '',
}: {
  value: number
  duration?: number
  decimals?: number
  suffix?: string
}) {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (value - from) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration, reduced])

  return (
    <span className="tnum">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  )
}
