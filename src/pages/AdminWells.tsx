import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { Plus, Trash2, Droplets } from 'lucide-react'
import { getWells, createWell, deleteWell } from '@/services/api'
import type { Well } from '@/types'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { StatusBadge } from '@/components/StatusBadge'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { fadeSlideUp, staggerContainer } from '@/lib/motion'

// ===========================================================================
// Admin — Wells (/app/admin/wells) [admin only, wrapped in RequireRole]
//   Table + add-well modal + delete confirm. Optimistic UI, toasts.
// ===========================================================================

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminWells() {
  const reduced = useReducedMotion()
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: wells, isLoading } = useQuery({
    queryKey: ['wells'],
    queryFn: getWells,
  })

  const [addOpen, setAddOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Well | null>(null)

  const createMut = useMutation({
    mutationFn: createWell,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['wells'] })
      const prev = qc.getQueryData<Well[]>(['wells'])
      const optimistic: Well = {
        id: `temp-${Date.now()}`,
        name: input.name,
        location: input.location,
        status: 'normal',
        health: 100,
        createdAt: new Date().toISOString(),
      }
      qc.setQueryData<Well[]>(['wells'], (old) => [...(old ?? []), optimistic])
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['wells'], ctx.prev)
      toast('Could not create well.', 'error')
    },
    onSuccess: () => toast('Well created.'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['wells'] }),
  })

  const deleteMut = useMutation({
    mutationFn: deleteWell,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['wells'] })
      const prev = qc.getQueryData<Well[]>(['wells'])
      qc.setQueryData<Well[]>(['wells'], (old) =>
        (old ?? []).filter((w) => w.id !== id)
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['wells'], ctx.prev)
      toast('Could not delete well.', 'error')
    },
    onSuccess: () => toast('Well deleted.'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['wells'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Wells</h1>
          <p className="text-sm text-muted">
            Add or remove wells from the monitored field.
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add well
        </button>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="hidden grid-cols-[2fr_2.5fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted sm:grid">
          <span>Name</span>
          <span>Location</span>
          <span>Status</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !wells || wells.length === 0 ? (
          <div className="p-12 text-center">
            <Droplets className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 font-medium">No wells yet</p>
            <p className="mt-1 text-sm text-muted">
              Add your first well to begin monitoring.
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer(0.04)}
            initial="hidden"
            animate="show"
            className="divide-y divide-border"
          >
            {wells.map((w) => (
              <motion.div
                key={w.id}
                variants={fadeSlideUp(reduced)}
                className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[2fr_2.5fr_1fr_1fr_auto] sm:items-center sm:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/15 text-teal-light">
                    <Droplets className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{w.name}</span>
                </div>
                <span className="truncate text-sm text-muted">
                  {w.location}
                </span>
                <span>
                  <StatusBadge status={w.status} />
                </span>
                <span className="text-sm text-muted">
                  {fmtDate(w.createdAt)}
                </span>
                <div className="flex justify-start sm:justify-end">
                  <button
                    onClick={() => setToDelete(w)}
                    className="inline-flex items-center gap-1.5 rounded-input border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-critical/50 hover:text-critical"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AddWellModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(input) => {
          createMut.mutate(input)
          setAddOpen(false)
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteMut.mutate(toDelete.id)
          setToDelete(null)
        }}
        title="Delete well"
        message={`Delete ${toDelete?.name}? Its readings and alerts will no longer be monitored.`}
        confirmLabel="Delete well"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add-well modal
// ---------------------------------------------------------------------------

function AddWellModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: { name: string; location: string }) => void
}) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setLocation('')
    setError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name || !location) {
      setError('Both fields are required.')
      return
    }
    onSubmit({ name, location })
    reset()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Add well"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Well name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Well_006"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
            placeholder="El Morgan Field · Gulf of Suez"
          />
        </label>

        {error && (
          <p className="rounded-input border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              reset()
              onClose()
            }}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create well
          </button>
        </div>
      </form>
    </Modal>
  )
}
