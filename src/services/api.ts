// ===========================================================================
// PetroSense — API service layer
// ---------------------------------------------------------------------------
// This is the ONLY data source for the entire frontend. Every screen imports
// from here. Today every function returns MOCK data. In Part 4 of the build we
// swap the body of each function for a real Axios call to the Django API —
// WITHOUT changing any function signature or return shape, so no screen breaks.
//
//   ┌──────────────────────────────────────────────────────────────────────┐
//   │  🔌 REPLACE-WITH-AXIOS markers below show exactly where the real call  │
//   │     goes. The commented axios line is the target implementation.       │
//   └──────────────────────────────────────────────────────────────────────┘
//
// Sensors (units):
//   pressure_bar        -> pressure     (bar)
//   temperature_c       -> temperature  (°C)
//   vibration_mm_s      -> vibration    (mm/s)
//   flow_rate_m3_day    -> flowRate     (m³/day)
// ===========================================================================

import type {
  Alert,
  AuthResponse,
  Kpi,
  Role,
  SensorReading,
  User,
  Well,
  WellStatus,
} from '@/types'

// Real API layer (Part 4). Auth calls now go through this axios instance;
// remaining functions are still mock and swap over in the next stages.
import { http, setRefreshToken } from '@/lib/axios'

// Maps the backend user shape ({id, name, email, role}) to the frontend User.
function mapUser(u: {
  id: number | string
  name: string
  email: string
  role: Role
  createdAt?: string
}): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt ?? nowIso(),
  }
}

// --- Backend → frontend mappers --------------------------------------------
// The backend already sends camelCase. The only reconciliations needed are:
//   • ids come back as numbers → the frontend types use strings
//   • alerts don't carry sensor/value/baseline → derive them from the reason
//     text so the Alerts screen renders unchanged.

interface ApiWell {
  id: number
  name: string
  location: string
  status: WellStatus
  health: number
  createdAt: string
}

function mapWell(w: ApiWell): Well {
  return {
    id: String(w.id),
    name: w.name,
    location: w.location,
    status: w.status,
    health: w.health,
    createdAt: w.createdAt,
  }
}

interface ApiReading {
  id: number
  wellId: number
  timestamp: string
  pressure: number
  temperature: number
  vibration: number
  flowRate: number
  isAnomaly: boolean
}

function mapReading(r: ApiReading): SensorReading {
  return {
    id: String(r.id),
    wellId: String(r.wellId),
    timestamp: r.timestamp,
    pressure: r.pressure,
    temperature: r.temperature,
    vibration: r.vibration,
    flowRate: r.flowRate,
    isAnomaly: r.isAnomaly,
  }
}

interface ApiAlert {
  id: number
  wellId: number
  wellName: string
  readingId: number
  severity: Alert['severity']
  reason: string
  acknowledged: boolean
  createdAt: string
}

// Reason text looks like: "Vibration 3.96 mm/s — 24% above normal baseline".
// Recover which sensor drove it and its value so the screen can show the
// sensor label + reading-vs-baseline detail exactly as with mock data.
const REASON_LABEL_TO_SENSOR: Record<string, Alert['sensor']> = {
  'flow rate': 'flowRate',
  pressure: 'pressure',
  temperature: 'temperature',
  vibration: 'vibration',
}

function parseReason(reason: string): { sensor: Alert['sensor']; value: number } {
  const lower = reason.toLowerCase()
  let sensor: Alert['sensor'] = 'vibration'
  for (const [label, key] of Object.entries(REASON_LABEL_TO_SENSOR)) {
    if (lower.startsWith(label)) {
      sensor = key
      break
    }
  }
  const match = reason.match(/\d+(?:\.\d+)?/)
  const value = match ? parseFloat(match[0]) : SENSOR_INFO[sensor].baseline
  return { sensor, value }
}

function mapAlert(a: ApiAlert): Alert {
  const { sensor, value } = parseReason(a.reason)
  return {
    id: String(a.id),
    wellId: String(a.wellId),
    wellName: a.wellName,
    readingId: String(a.readingId),
    sensor,
    severity: a.severity,
    reason: a.reason,
    value,
    baseline: SENSOR_INFO[sensor].baseline,
    acknowledged: a.acknowledged,
    createdAt: a.createdAt,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate network latency so loading states are visible during development. */
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

const nowIso = () => new Date().toISOString()

const iso = (d: Date) => d.toISOString()

const rand = (min: number, max: number) => min + Math.random() * (max - min)

const round = (n: number, dp = 2) => {
  const f = 10 ** dp
  return Math.round(n * f) / f
}

// ---------------------------------------------------------------------------
// Mock baselines — "normal" operating point per sensor. Used to generate
// realistic readings and to compute explainable deviation for alerts.
// ---------------------------------------------------------------------------

const BASELINE = {
  pressure: 120, // bar
  temperature: 78, // °C
  vibration: 3.2, // mm/s
  flowRate: 1450, // m³/day
} as const

// ---------------------------------------------------------------------------
// Mock wells (Well_001..005) — realistic Egyptian oil-field names.
// ---------------------------------------------------------------------------

interface MockWell extends Well {
  // extra fields the mock keeps internally but the Well type already covers
  _statusSeed: number
}

const MOCK_WELLS: MockWell[] = [
  {
    id: 'well-001',
    name: 'Well_001',
    location: 'El Morgan Field · Gulf of Suez',
    status: 'normal',
    health: 96,
    createdAt: '2025-01-12T08:00:00.000Z',
    _statusSeed: 0,
  },
  {
    id: 'well-002',
    name: 'Well_002',
    location: 'Belayim Marine · Gulf of Suez',
    status: 'warning',
    health: 74,
    createdAt: '2025-02-03T08:00:00.000Z',
    _statusSeed: 1,
  },
  {
    id: 'well-003',
    name: 'Well_003',
    location: 'Badr El-Din (BED-3) · Western Desert',
    status: 'critical',
    health: 41,
    createdAt: '2025-02-20T08:00:00.000Z',
    _statusSeed: 2,
  },
  {
    id: 'well-004',
    name: 'Well_004',
    location: 'Zohr · Mediterranean Offshore',
    status: 'normal',
    health: 89,
    createdAt: '2025-03-10T08:00:00.000Z',
    _statusSeed: 3,
  },
  {
    id: 'well-005',
    name: 'Well_005',
    location: 'October Field · Gulf of Suez',
    status: 'normal',
    health: 91,
    createdAt: '2025-03-28T08:00:00.000Z',
    _statusSeed: 4,
  },
]

// A mutable copy so createWell/deleteWell behave during the mock phase.
let wellsDb: MockWell[] = [...MOCK_WELLS]

// (Mock users removed — getUsers/createUser/deleteUser now hit the real
//  /api/admin/users/ API.)

// ---------------------------------------------------------------------------
// Reading generator — builds a plausible history for a given well.
// ---------------------------------------------------------------------------

function statusFactor(status: WellStatus): number {
  // How far readings drift from baseline given the well's health/status.
  switch (status) {
    case 'critical':
      return 1
    case 'warning':
      return 0.5
    default:
      return 0.12
  }
}

function generateReading(
  well: MockWell,
  timestamp: Date,
  index: number
): SensorReading {
  const drift = statusFactor(well.status)

  // Base noise around the normal operating point.
  let pressure = BASELINE.pressure + rand(-3, 3)
  let temperature = BASELINE.temperature + rand(-1.5, 1.5)
  let vibration = BASELINE.vibration + rand(-0.4, 0.4)
  let flowRate = BASELINE.flowRate + rand(-40, 40)

  // Anomaly pattern: flow DOWN, pressure/temp/vibration UP.
  const anomalyRoll = Math.random()
  const isAnomaly = anomalyRoll < drift * 0.18

  if (isAnomaly) {
    pressure += rand(15, 35) * drift
    temperature += rand(8, 18) * drift
    vibration += rand(2.5, 5) * drift
    flowRate -= rand(200, 500) * drift
  }

  return {
    id: `${well.id}-r-${index}`,
    wellId: well.id,
    timestamp: iso(timestamp),
    pressure: round(pressure, 1),
    temperature: round(temperature, 1),
    vibration: round(vibration, 2),
    flowRate: round(Math.max(flowRate, 0), 0),
    isAnomaly,
  }
}

function buildHistory(well: MockWell, count = 120): SensorReading[] {
  const readings: SensorReading[] = []
  const now = Date.now()
  const stepMs = 60_000 // one point per minute
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now - i * stepMs)
    readings.push(generateReading(well, t, count - 1 - i))
  }
  return readings
}

// NOTE: getWells/getWell/getSensorHistory/getAlerts/getKpis now hit the real
// Django API (see below). The former mock alert generator lived here and was
// removed once getAlerts/getKpis were switched over. The remaining mock helpers
// above are still used by getAnalytics and the admin mock functions until those
// stages are wired.

// ===========================================================================
// PUBLIC API — the only surface the app talks to.
// ===========================================================================

// ---- Wells ----------------------------------------------------------------

export async function getWells(): Promise<Well[]> {
  const { data } = await http.get<ApiWell[]>('/api/wells/')
  return data.map(mapWell)
}

export async function getWell(id: string): Promise<Well | null> {
  try {
    const { data } = await http.get<ApiWell>(`/api/wells/${id}/`)
    return mapWell(data)
  } catch {
    return null // 404 / unknown id -> null, same as the mock
  }
}

// ---- Sensor history -------------------------------------------------------

export async function getSensorHistory(
  id: string,
  limit = 100
): Promise<SensorReading[]> {
  const { data } = await http.get<ApiReading[]>(
    `/api/wells/${id}/readings/?limit=${limit}`
  )
  return data.map(mapReading)
}

/**
 * Live tick — polls the readings endpoint for the most recent reading. The
 * Well Detail screen calls this on an interval and appends the point, keeping
 * the live chart working against the real API.
 */
export async function getNextReading(id: string): Promise<SensorReading | null> {
  const { data } = await http.get<ApiReading[]>(
    `/api/wells/${id}/readings/?limit=1`
  )
  const latest = data[data.length - 1]
  return latest ? mapReading(latest) : null
}

// ---------------------------------------------------------------------------
// Sensor metadata + per-signal classification — exported so screens render
// units, colors, and Normal/Warning/Critical strips from one source of truth.
// ---------------------------------------------------------------------------

export type SensorKey = 'pressure' | 'temperature' | 'vibration' | 'flowRate'

export interface SensorInfo {
  key: SensorKey
  label: string
  unit: string
  color: string
  baseline: number
  /** true when a reading BELOW baseline is the abnormal direction (flow). */
  invert: boolean
}

export const SENSOR_INFO: Record<SensorKey, SensorInfo> = {
  pressure: {
    key: 'pressure',
    label: 'Pressure',
    unit: 'bar',
    color: '#E8821E',
    baseline: BASELINE.pressure,
    invert: false,
  },
  temperature: {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    color: '#F2A93B',
    baseline: BASELINE.temperature,
    invert: false,
  },
  vibration: {
    key: 'vibration',
    label: 'Vibration',
    unit: 'mm/s',
    color: '#4BB8C4',
    baseline: BASELINE.vibration,
    invert: false,
  },
  flowRate: {
    key: 'flowRate',
    label: 'Flow rate',
    unit: 'm³/day',
    color: '#2A8F9C',
    baseline: BASELINE.flowRate,
    invert: true,
  },
}

export const SENSOR_ORDER: SensorKey[] = [
  'pressure',
  'temperature',
  'vibration',
  'flowRate',
]

/** Classify a single sensor value against its baseline. */
export function classifySensor(
  sensor: SensorKey,
  value: number
): { status: WellStatus; deviationPct: number } {
  const info = SENSOR_INFO[sensor]
  const rawPct = ((value - info.baseline) / info.baseline) * 100
  // Only count deviation in the "abnormal" direction.
  const abnormal = info.invert ? -rawPct : rawPct
  const magnitude = Math.max(abnormal, 0)
  const status: WellStatus =
    magnitude > 30 ? 'critical' : magnitude > 12 ? 'warning' : 'normal'
  return { status, deviationPct: Math.round(rawPct) }
}

// ---- Analytics ------------------------------------------------------------

export interface AnalyticsFilter {
  wellId?: string // undefined / 'all' => every well
  days?: number // lookback window, default 14
}

export interface AnalyticsData {
  anomalyFrequency: { date: string; count: number }[]
  sensorComparison: {
    well: string
    pressure: number
    temperature: number
    vibration: number
    flowRate: number
  }[]
  breakdown: { normal: number; anomaly: number }
}

export async function getAnalytics(
  filter: AnalyticsFilter = {}
): Promise<AnalyticsData> {
  await delay()
  // 🔌 REPLACE-WITH-AXIOS:
  //   return (await http.get<AnalyticsData>('/api/stats/analytics/', {
  //     params: { well: filter.wellId, days: filter.days }
  //   })).data
  const days = filter.days ?? 14
  const scoped =
    filter.wellId && filter.wellId !== 'all'
      ? wellsDb.filter((w) => w.id === filter.wellId)
      : wellsDb

  // Anomaly frequency over the lookback window.
  const now = Date.now()
  const anomalyFrequency = Array.from({ length: days }, (_, i) => {
    const d = new Date(now - (days - 1 - i) * 86_400_000)
    const base = scoped.reduce((sum, w) => sum + statusFactor(w.status), 0)
    const count = Math.max(
      0,
      Math.round(base * rand(1.5, 4) + rand(-1, 1.5))
    )
    return {
      date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      count,
    }
  })

  // Average sensor readings per well (from generated history).
  const sensorComparison = scoped.map((w) => {
    const hist = buildHistory(w, 40)
    const avg = (k: SensorKey) =>
      round(hist.reduce((s, r) => s + r[k], 0) / hist.length, 1)
    return {
      well: w.name,
      pressure: avg('pressure'),
      temperature: avg('temperature'),
      vibration: avg('vibration'),
      flowRate: avg('flowRate'),
    }
  })

  // Normal vs anomaly split across scoped wells.
  let normal = 0
  let anomaly = 0
  for (const w of scoped) {
    const hist = buildHistory(w, 60)
    for (const r of hist) r.isAnomaly ? anomaly++ : normal++
  }

  return { anomalyFrequency, sensorComparison, breakdown: { normal, anomaly } }
}

// ---- Alerts ---------------------------------------------------------------

export async function getAlerts(): Promise<Alert[]> {
  const { data } = await http.get<ApiAlert[]>('/api/alerts/')
  return data.map(mapAlert)
}

// ---- KPIs -----------------------------------------------------------------

export async function getKpis(): Promise<Kpi> {
  // Backend /api/stats/summary/ already carries the KPI-shaped fields.
  const { data } = await http.get<Kpi>('/api/stats/summary/')
  return {
    wellsOnline: data.wellsOnline,
    activeAlerts: data.activeAlerts,
    avgHealth: data.avgHealth,
    anomaliesToday: data.anomaliesToday,
  }
}

// ---- Auth -----------------------------------------------------------------

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  // Real call: POST /api/auth/login/ -> {access, refresh, user}
  const { data } = await http.post<{
    access: string
    refresh: string
    user: { id: number; name: string; email: string; role: Role }
  }>('/api/auth/login/', { email, password })

  // Persist the refresh token (the access token is stored by the screen via
  // the auth store's setSession, as before). Same return shape as the mock.
  setRefreshToken(data.refresh)
  return { user: mapUser(data.user), token: data.access }
}

export async function getCurrentUser(): Promise<User | null> {
  // Real call: GET /api/auth/me/ -> current user.
  try {
    const { data } = await http.get<{
      id: number
      name: string
      email: string
      role: Role
    }>('/api/auth/me/')
    return mapUser(data)
  } catch {
    return null
  }
}

// ---- Admin: Users ---------------------------------------------------------

export async function getUsers(): Promise<User[]> {
  const { data } = await http.get<
    { id: number; name: string; email: string; role: Role; createdAt: string }[]
  >('/api/admin/users/')
  return data.map(mapUser)
}

export async function createUser(input: {
  name: string
  email: string
  role: Role
  password: string
}): Promise<User> {
  // POST /api/admin/users/ (admin only) — password is hashed server-side.
  const { data } = await http.post<{
    id: number
    name: string
    email: string
    role: Role
    createdAt: string
  }>('/api/admin/users/', input)
  return mapUser(data)
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete(`/api/admin/users/${id}/`)
}

// ---- Admin: Wells ---------------------------------------------------------

export async function createWell(input: {
  name: string
  location: string
}): Promise<Well> {
  // POST /api/wells/ (admin only) — status defaults to 'normal' server-side.
  const { data } = await http.post<ApiWell>('/api/wells/', input)
  return mapWell(data)
}

export async function deleteWell(id: string): Promise<void> {
  await http.delete(`/api/wells/${id}/`)
}

// ---- ML prediction --------------------------------------------------------

export interface PredictResult {
  is_anomaly: boolean
  probability: number
  top_features: {
    feature: string
    label: string
    importance: number
    deviationPct: number
    score: number
  }[]
  reason: string
}

/** POST /api/predict/ — server computes ratios and returns an explainable result. */
export async function predict(input: {
  flow_rate: number
  pressure: number
  temperature: number
  vibration: number
}): Promise<PredictResult> {
  const { data } = await http.post<PredictResult>('/api/predict/', input)
  return data
}
