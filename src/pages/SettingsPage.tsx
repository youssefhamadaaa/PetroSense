import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { User as UserIcon, SlidersHorizontal, Bell, Plug, Lock } from 'lucide-react'
import { SENSOR_INFO, SENSOR_ORDER } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/Toast'
import { Toggle } from '@/components/Toggle'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { fadeSlideUp, staggerContainer } from '@/lib/motion'

// ===========================================================================
// Settings (/app/settings) — profile, per-sensor alert thresholds,
// notification preferences, and a DISABLED "Connection / API" placeholder.
// (Local state only; mock persistence via toast.)
// ===========================================================================

export default function SettingsPage() {
  const reduced = useReducedMotion()
  const { currentUser, role } = useAuthStore()
  const { toast } = useToast()

  const [name, setName] = useState(currentUser?.name ?? '')
  const [email, setEmail] = useState(currentUser?.email ?? '')

  const [thresholds, setThresholds] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      SENSOR_ORDER.map((k) => [k, Math.round(SENSOR_INFO[k].baseline * 1.25)])
    )
  )

  const [notif, setNotif] = useState({
    critical: true,
    warning: true,
    email: false,
    digest: true,
  })

  const onSaveProfile = (e: FormEvent) => {
    e.preventDefault()
    toast('Profile updated.')
  }

  const onSaveThresholds = (e: FormEvent) => {
    e.preventDefault()
    toast('Alert thresholds saved.')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted">
          Manage your profile, alert thresholds, and notifications.
        </p>
      </div>

      <motion.div
        variants={staggerContainer(0.08)}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* Profile */}
        <Section
          reduced={reduced}
          icon={UserIcon}
          title="Profile"
          desc="Your account details."
        >
          <form onSubmit={onSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </Field>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              Role:
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                {role ?? '—'}
              </span>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Save profile
              </button>
            </div>
          </form>
        </Section>

        {/* Alert thresholds */}
        <Section
          reduced={reduced}
          icon={SlidersHorizontal}
          title="Alert Thresholds"
          desc="Trigger an alert when a sensor exceeds these values."
        >
          <form onSubmit={onSaveThresholds} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {SENSOR_ORDER.map((key) => {
                const info = SENSOR_INFO[key]
                return (
                  <Field key={key} label={`${info.label} (${info.unit})`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        step="any"
                        value={thresholds[key]}
                        onChange={(e) =>
                          setThresholds((t) => ({
                            ...t,
                            [key]: Number(e.target.value),
                          }))
                        }
                        className="input flex-1"
                      />
                      <span className="whitespace-nowrap text-xs text-muted">
                        base {info.baseline}
                      </span>
                    </div>
                  </Field>
                )
              })}
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Save thresholds
              </button>
            </div>
          </form>
        </Section>

        {/* Notifications */}
        <Section
          reduced={reduced}
          icon={Bell}
          title="Notifications"
          desc="Choose what you get notified about."
        >
          <div className="divide-y divide-border">
            <NotifRow
              label="Critical alerts"
              hint="Immediate push for critical severity."
              checked={notif.critical}
              onChange={(v) => setNotif((n) => ({ ...n, critical: v }))}
            />
            <NotifRow
              label="Warning alerts"
              hint="Notify on warning severity."
              checked={notif.warning}
              onChange={(v) => setNotif((n) => ({ ...n, warning: v }))}
            />
            <NotifRow
              label="Email notifications"
              hint="Send alerts to your email."
              checked={notif.email}
              onChange={(v) => setNotif((n) => ({ ...n, email: v }))}
            />
            <NotifRow
              label="Daily digest"
              hint="A once-a-day summary of field health."
              checked={notif.digest}
              onChange={(v) => setNotif((n) => ({ ...n, digest: v }))}
            />
          </div>
        </Section>

        {/* Connection / API — intentional disabled placeholder.
            Entrance animation lives on the motion wrapper; the greyed/disabled
            styling lives on the inner div so Framer's inline opacity (→1)
            doesn't override the 60% "coming soon" look. */}
        <motion.section variants={fadeSlideUp(reduced)}>
          <div
            aria-disabled="true"
            className="pointer-events-none select-none rounded-card border border-border bg-surface p-5 opacity-60"
          >
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-input bg-bg text-muted">
                <Plug className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-muted">
                    Connection / API
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-2 py-0.5 text-[11px] font-medium text-muted">
                    <Lock className="h-3 w-3" />
                    Coming soon
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Connect live device gateways and configure API keys. This
                  section is a placeholder and not yet available.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-sm text-muted">API endpoint</div>
              <input
                disabled
                placeholder="https://…"
                className="w-full cursor-not-allowed rounded-input border border-border bg-bg px-3 py-2 text-muted"
              />
            </div>
            <div>
              <div className="mb-1 text-sm text-muted">API key</div>
              <input
                disabled
                placeholder="••••••••••••"
                className="w-full cursor-not-allowed rounded-input border border-border bg-bg px-3 py-2 text-muted"
              />
            </div>
          </div>
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  desc,
  children,
  reduced,
}: {
  icon: typeof UserIcon
  title: string
  desc: string
  children: React.ReactNode
  reduced: boolean
}) {
  return (
    <motion.section
      variants={fadeSlideUp(reduced)}
      className="rounded-card border border-border bg-surface p-5"
    >
      <div className="mb-4 flex gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-input bg-bg text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </motion.section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      {children}
    </label>
  )
}

function NotifRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted">{hint}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}
