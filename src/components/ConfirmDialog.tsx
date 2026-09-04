import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/Modal'

// ---------------------------------------------------------------------------
// ConfirmDialog — destructive-action confirmation built on Modal.
// ---------------------------------------------------------------------------

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-critical/15 text-critical">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="pt-1.5 text-sm text-muted">{message}</p>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-input border border-border px-4 py-2 text-sm text-text transition-colors hover:bg-bg disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-input bg-critical px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
