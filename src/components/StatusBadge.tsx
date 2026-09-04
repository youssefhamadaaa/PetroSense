import type { WellStatus, Severity } from '@/types'

// ---------------------------------------------------------------------------
// StatusBadge — colored pill + animated dot. Critical pulses.
// Shared by the well grid, alerts, and detail screens.
// ---------------------------------------------------------------------------

type Status = WellStatus | Severity

const STYLES: Record<
  Status,
  { label: string; text: string; bg: string; dot: string }
> = {
  normal: {
    label: 'Normal',
    text: 'text-normal',
    bg: 'bg-normal/10 border-normal/30',
    dot: 'bg-normal',
  },
  warning: {
    label: 'Warning',
    text: 'text-warning',
    bg: 'bg-warning/10 border-warning/30',
    dot: 'bg-warning',
  },
  critical: {
    label: 'Critical',
    text: 'text-critical',
    bg: 'bg-critical/10 border-critical/30',
    dot: 'bg-critical',
  },
}

export function StatusDot({ status }: { status: Status }) {
  const s = STYLES[status]
  return (
    <span className="relative inline-flex h-2.5 w-2.5">
      {status === 'critical' && (
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${s.dot}`}
        />
      )}
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`}
      />
    </span>
  )
}

export function StatusBadge({ status }: { status: Status }) {
  const s = STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}
    >
      <StatusDot status={status} />
      {s.label}
    </span>
  )
}
