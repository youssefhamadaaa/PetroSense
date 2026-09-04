import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@/lib/useReducedMotion'

// ---------------------------------------------------------------------------
// ParticleField — lightweight canvas background: drifting particles + soft
// gradient wash in flame + teal. Sits behind the hero. When reduced-motion is
// on it paints a single static frame (no animation loop).
// ---------------------------------------------------------------------------

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
}

const COLORS = ['#E8821E', '#F2A93B', '#2A8F9C', '#4BB8C4']

export default function ParticleField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    let particles: Particle[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const parent = canvas.parentElement
      width = parent?.clientWidth ?? window.innerWidth
      height = parent?.clientHeight ?? window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(70, Math.floor((width * height) / 16000))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Connect nearby particles with faint lines.
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const dist = Math.hypot(dx, dy)
          if (dist < 120) {
            ctx.globalAlpha = (1 - dist / 120) * 0.12
            ctx.strokeStyle = '#4BB8C4'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.stroke()
          }
        }
      }

      // Particles.
      for (const p of particles) {
        ctx.globalAlpha = 0.7
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    const tick = () => {
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
      }
      draw()
      raf = requestAnimationFrame(tick)
    }

    resize()
    if (reduced) {
      draw() // single static frame
    } else {
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [reduced])

  return (
    <div className={className} aria-hidden="true">
      {/* Gradient wash */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_20%,rgba(232,130,30,0.18),transparent_60%),radial-gradient(55%_55%_at_85%_30%,rgba(42,143,156,0.20),transparent_60%)]" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
