import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Fuel, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { login } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { fadeSlideUp, staggerContainer } from '@/lib/motion'

// ===========================================================================
// Login (/login) — polished, centered card. Still MOCK auth: api.login()
// returns a mock user + token; we read the role into the Zustand store.
// ===========================================================================

interface LocationState {
  from?: { pathname?: string }
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const reduced = useReducedMotion()
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState('admin@petrosense.io')
  const [password, setPassword] = useState('password')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? '/app'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const { user, token } = await login(email, password)
      setSession(user, token) // role read from returned user
      navigate(redirectTo, { replace: true })
    } catch {
      setError('Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-6">
      {/* Ambient gradient wash (flame + teal), no animation loop. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_45%_at_25%_20%,rgba(232,130,30,0.14),transparent_60%),radial-gradient(45%_45%_at_80%_75%,rgba(42,143,156,0.16),transparent_60%)]" />

      <motion.form
        onSubmit={onSubmit}
        variants={staggerContainer(0.07)}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-sm rounded-card border border-border bg-surface/90 p-8 shadow-xl backdrop-blur"
      >
        <motion.div
          variants={fadeSlideUp(reduced)}
          className="mb-6 flex flex-col items-center text-center"
        >
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-input bg-bg text-primary ring-1 ring-border">
            <Fuel className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Welcome to PetroSense
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to open your dashboard.
          </p>
        </motion.div>

        {/* Email */}
        <motion.div variants={fadeSlideUp(reduced)} className="mb-4">
          <label htmlFor="email" className="mb-1 block text-sm text-muted">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-input border border-border bg-bg py-2.5 pl-9 pr-3 text-text outline-none transition-colors focus:border-primary"
              placeholder="you@petrosense.io"
            />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div variants={fadeSlideUp(reduced)} className="mb-6">
          <label htmlFor="password" className="mb-1 block text-sm text-muted">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-input border border-border bg-bg py-2.5 pl-9 pr-3 text-text outline-none transition-colors focus:border-primary"
              placeholder="••••••••"
            />
          </div>
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-input border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          variants={fadeSlideUp(reduced)}
          type="submit"
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-input bg-primary px-4 py-2.5 font-semibold text-bg transition-[transform,opacity] hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </motion.button>

        <motion.p
          variants={fadeSlideUp(reduced)}
          className="mt-5 text-center text-xs text-muted"
        >
          Mock auth: an email containing “admin” signs in as admin.
        </motion.p>

        <motion.div
          variants={fadeSlideUp(reduced)}
          className="mt-4 text-center"
        >
          <Link
            to="/"
            className="text-xs text-teal-light transition-colors hover:text-text"
          >
            ← Back to home
          </Link>
        </motion.div>
      </motion.form>
    </div>
  )
}
