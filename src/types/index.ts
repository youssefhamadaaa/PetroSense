// ---------------------------------------------------------------------------
// PetroSense — shared domain types
// These shapes define the contract the whole frontend relies on.
// The mock api.ts returns exactly these; the real Django API must match them.
// ---------------------------------------------------------------------------

export type Role = 'admin' | 'engineer'

export type WellStatus = 'normal' | 'warning' | 'critical'

export type Severity = 'normal' | 'warning' | 'critical'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string // ISO timestamp
}

export interface Well {
  id: string
  name: string // e.g. "Well_001"
  location: string
  status: WellStatus
  health: number // 0..100
  createdAt: string
}

/**
 * A single point in time for one well's four sensors.
 * Sensor units (from the brief):
 *   pressure     -> bar        (pressure_bar)
 *   temperature  -> °C         (temperature_c)
 *   vibration    -> mm/s       (vibration_mm_s)
 *   flowRate     -> m³/day     (flow_rate_m3_day)
 */
export interface SensorReading {
  id: string
  wellId: string
  timestamp: string // ISO timestamp
  pressure: number // bar
  temperature: number // °C
  vibration: number // mm/s
  flowRate: number // m³/day
  isAnomaly: boolean
}

export interface Alert {
  id: string
  wellId: string
  wellName: string
  readingId: string
  sensor: keyof Pick<
    SensorReading,
    'pressure' | 'temperature' | 'vibration' | 'flowRate'
  >
  severity: Severity
  /** Human-readable, explainable reason — the product differentiator. */
  reason: string
  value: number
  baseline: number
  acknowledged: boolean
  createdAt: string
}

export interface Kpi {
  wellsOnline: number
  activeAlerts: number
  avgHealth: number // 0..100
  anomaliesToday: number
}

export interface AuthResponse {
  user: User
  token: string
}
