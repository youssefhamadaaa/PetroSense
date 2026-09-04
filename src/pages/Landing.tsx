import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Fuel,
  ShieldAlert,
  Wrench,
  Activity,
  BrainCircuit,
  Database,
  LineChart,
  TrendingUp,
  ClipboardList,
  ArrowRight,
} from 'lucide-react'
import ParticleField from '@/components/ParticleField'
import { useReducedMotion } from '@/lib/useReducedMotion'
import {
  fadeSlideUp,
  scrollReveal,
  staggerContainer,
} from '@/lib/motion'

// ===========================================================================
// Landing (/) — public marketing page. Dark theme, existing tokens only.
// ===========================================================================

const CAPABILITIES = [
  {
    icon: ShieldAlert,
    title: 'Early Detection',
    line: 'Catch abnormal sensor behavior before it becomes downtime.',
  },
  {
    icon: Wrench,
    title: 'Predictive Maintenance',
    line: 'Forecast failures and service wells on your schedule, not theirs.',
  },
  {
    icon: Activity,
    title: 'Real-Time Monitoring',
    line: 'Pressure, temperature, vibration and flow — live across the field.',
  },
  {
    icon: BrainCircuit,
    title: 'Explainable AI',
    line: 'Every alert says which signal drove it and by how much.',
  },
]

const STEPS = [
  { icon: Database, title: 'Collect', line: 'Stream sensor data from every well.' },
  { icon: LineChart, title: 'Analyze', line: 'Model detects anomalies in real time.' },
  { icon: TrendingUp, title: 'Predict', line: 'Estimate risk and time-to-failure.' },
  { icon: ClipboardList, title: 'Recommend', line: 'Surface the next best action.' },
]

export default function Landing() {
  const reduced = useReducedMotion()

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <Hero reduced={reduced} />
      <Features reduced={reduced} />
      <HowItWorks reduced={reduced} />
      <ClosingCta reduced={reduced} />
      <Footer />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-primary" />
          <span className="font-bold tracking-tight">PetroSense</span>
        </a>
        <nav className="flex items-center gap-6 text-sm">
          <a
            href="#features"
            className="text-muted transition-colors hover:text-text"
          >
            Features
          </a>
          <a
            href="#how"
            className="text-muted transition-colors hover:text-text"
          >
            How it works
          </a>
          <Link
            to="/login"
            className="rounded-input bg-primary px-4 py-1.5 font-semibold text-bg transition-transform hover:scale-[1.03]"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({ reduced }: { reduced: boolean }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border/60"
    >
      <ParticleField className="pointer-events-none absolute inset-0" />

      <motion.div
        variants={staggerContainer(0.12, 0.05)}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-3xl px-6 py-28 text-center md:py-36"
      >
        <motion.span
          variants={fadeSlideUp(reduced)}
          className="mb-5 inline-block rounded-input border border-border bg-surface/70 px-3 py-1 text-xs text-muted"
        >
          DATA · ENERGY · INTELLIGENCE
        </motion.span>

        <motion.h1
          variants={fadeSlideUp(reduced)}
          className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
        >
          AI-Driven Smart{' '}
          <span className="bg-gradient-to-r from-flame via-amber to-teal-light bg-clip-text text-transparent">
            Oil-Well Monitoring
          </span>
        </motion.h1>

        <motion.p
          variants={fadeSlideUp(reduced)}
          className="mx-auto mt-5 max-w-xl text-lg text-muted"
        >
          Detect problems early and predict failures before they happen — with
          explainable, real-time intelligence across your entire field.
        </motion.p>

        <motion.div
          variants={fadeSlideUp(reduced)}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 rounded-input bg-primary px-6 py-3 font-semibold text-bg transition-transform hover:scale-[1.03]"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="rounded-input border border-border px-6 py-3 font-semibold text-text transition-colors hover:bg-surface"
          >
            Explore features
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Features — four capability cards, stagger on scroll
// ---------------------------------------------------------------------------

function Features({ reduced }: { reduced: boolean }) {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <SectionHeading
        kicker="Capabilities"
        title="Built to keep wells producing"
        subtitle="Four pillars, one platform."
        reduced={reduced}
      />

      <motion.div
        variants={staggerContainer(0.1)}
        {...scrollReveal}
        className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CAPABILITIES.map(({ icon: Icon, title, line }) => (
          <motion.div
            key={title}
            variants={fadeSlideUp(reduced)}
            className="group rounded-card border border-border bg-surface p-6 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-input bg-bg text-primary ring-1 ring-border">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{line}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// How it works — Collect -> Analyze -> Predict -> Recommend
// ---------------------------------------------------------------------------

function HowItWorks({ reduced }: { reduced: boolean }) {
  return (
    <section
      id="how"
      className="border-y border-border/60 bg-surface/30 py-20"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          kicker="How it works"
          title="From raw signal to recommended action"
          subtitle="A continuous loop that runs on every reading."
          reduced={reduced}
        />

        <motion.div
          variants={staggerContainer(0.14)}
          {...scrollReveal}
          className="mt-12 flex flex-col items-stretch gap-4 md:flex-row md:items-center"
        >
          {STEPS.map(({ icon: Icon, title, line }, i) => (
            <div
              key={title}
              className="flex flex-1 flex-col items-center gap-4 md:flex-row"
            >
              <motion.div
                variants={fadeSlideUp(reduced)}
                className="flex-1 rounded-card border border-border bg-bg p-6 text-center"
              >
                <div className="mx-auto mb-3 inline-flex h-11 w-11 items-center justify-center rounded-input bg-surface text-teal-light ring-1 ring-border">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium text-muted">
                  Step {i + 1}
                </div>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{line}</p>
              </motion.div>

              {i < STEPS.length - 1 && <Arrow reduced={reduced} />}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function Arrow({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      variants={fadeSlideUp(reduced)}
      className="flex items-center justify-center text-primary"
    >
      {/* Horizontal on desktop, rotated on mobile */}
      <motion.div
        animate={reduced ? undefined : { x: [0, 4, 0] }}
        transition={
          reduced
            ? undefined
            : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
        }
        className="rotate-90 md:rotate-0"
      >
        <ArrowRight className="h-5 w-5" />
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Closing CTA band
// ---------------------------------------------------------------------------

function ClosingCta({ reduced }: { reduced: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <motion.div
        variants={fadeSlideUp(reduced)}
        {...scrollReveal}
        className="relative overflow-hidden rounded-card border border-border bg-surface p-10 text-center md:p-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(232,130,30,0.14),transparent_70%)]" />
        <div className="relative">
          <h2 className="text-2xl font-bold md:text-3xl">
            See your field the way the model does.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Open the dashboard and watch every well report in real time.
          </p>
          <Link
            to="/login"
            className="mt-7 inline-flex items-center gap-2 rounded-input bg-primary px-6 py-3 font-semibold text-bg transition-transform hover:scale-[1.03]"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <Fuel className="h-4 w-4 text-primary" />
          <span className="font-semibold text-text">PetroSense</span>
        </div>
        <p>ExxonMobil × SUT · 2026</p>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------------------
// Shared section heading
// ---------------------------------------------------------------------------

function SectionHeading({
  kicker,
  title,
  subtitle,
  reduced,
}: {
  kicker: string
  title: string
  subtitle: string
  reduced: boolean
}) {
  return (
    <motion.div
      variants={staggerContainer(0.08)}
      {...scrollReveal}
      className="text-center"
    >
      <motion.div
        variants={fadeSlideUp(reduced)}
        className="text-sm font-medium uppercase tracking-wide text-primary"
      >
        {kicker}
      </motion.div>
      <motion.h2
        variants={fadeSlideUp(reduced)}
        className="mt-2 text-3xl font-bold tracking-tight"
      >
        {title}
      </motion.h2>
      <motion.p
        variants={fadeSlideUp(reduced)}
        className="mt-2 text-muted"
      >
        {subtitle}
      </motion.p>
    </motion.div>
  )
}
