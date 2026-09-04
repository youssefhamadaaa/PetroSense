import type { ReactNode } from 'react'

/**
 * Lightweight scaffold placeholder for screens built in later stages.
 * Keeps the app clickable end-to-end during Stage 1.
 */
export function Placeholder({
  title,
  subtitle,
  stage,
  children,
}: {
  title: string
  subtitle?: string
  stage?: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-text">{title}</h1>
        {stage && (
          <span className="rounded-input border border-border bg-bg px-2 py-0.5 text-xs text-muted">
            {stage}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
