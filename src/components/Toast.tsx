import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react'

// ---------------------------------------------------------------------------
// Toast system — a provider + useToast() hook. Toasts render top-right and
// auto-dismiss. Used for success/error feedback on admin actions.
// ---------------------------------------------------------------------------

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastCtx {
  toast: (message: string, kind?: ToastKind) => void
}

const Ctx = createContext<ToastCtx | null>(null)

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

const ACCENT: Record<ToastKind, string> = {
  success: 'text-normal',
  error: 'text-critical',
  info: 'text-teal-light',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, kind, message }])
      window.setTimeout(() => remove(id), 3500)
    },
    [remove]
  )

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-xs flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.kind]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-auto flex items-start gap-3 rounded-card border border-border bg-surface p-3 shadow-xl"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ACCENT[t.kind]}`} />
                <p className="flex-1 text-sm text-text">{t.message}</p>
                <button
                  onClick={() => remove(t.id)}
                  className="text-muted transition-colors hover:text-text"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  )
}

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
