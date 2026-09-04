import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { UserPlus, Trash2, Users } from 'lucide-react'
import { getUsers, createUser, deleteUser } from '@/services/api'
import type { Role, User } from '@/types'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/Toast'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { fadeSlideUp, staggerContainer } from '@/lib/motion'

// ===========================================================================
// Admin — Users (/app/admin/users) [admin only, wrapped in RequireRole]
//   Table + add-user modal + delete confirm. Optimistic UI, toasts.
// ===========================================================================

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminUsers() {
  const reduced = useReducedMotion()
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  const [addOpen, setAddOpen] = useState(false)
  const [toDelete, setToDelete] = useState<User | null>(null)

  // --- Create (optimistic) ---
  const createMut = useMutation({
    mutationFn: createUser,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['users'] })
      const prev = qc.getQueryData<User[]>(['users'])
      const optimistic: User = {
        id: `temp-${Date.now()}`,
        name: input.name,
        email: input.email,
        role: input.role,
        createdAt: new Date().toISOString(),
      }
      qc.setQueryData<User[]>(['users'], (old) => [...(old ?? []), optimistic])
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['users'], ctx.prev)
      toast('Could not create user.', 'error')
    },
    onSuccess: () => toast('User created.'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  // --- Delete (optimistic) ---
  const deleteMut = useMutation({
    mutationFn: deleteUser,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ['users'] })
      const prev = qc.getQueryData<User[]>(['users'])
      qc.setQueryData<User[]>(['users'], (old) =>
        (old ?? []).filter((u) => u.id !== id)
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['users'], ctx.prev)
      toast('Could not delete user.', 'error')
    },
    onSuccess: () => toast('User deleted.'),
    onSettled: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
          <p className="text-sm text-muted">
            Add, remove, and set roles for platform users.
          </p>
        </div>
        <button onClick={() => setAddOpen(true)} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          Add user
        </button>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {/* header */}
        <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted sm:grid">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Created</span>
          <span className="text-right">Actions</span>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !users || users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-8 w-8 text-muted" />
            <p className="mt-3 font-medium">No users yet</p>
            <p className="mt-1 text-sm text-muted">
              Add your first user to get started.
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer(0.04)}
            initial="hidden"
            animate="show"
            className="divide-y divide-border"
          >
            {users.map((u) => (
              <motion.div
                key={u.id}
                variants={fadeSlideUp(reduced)}
                className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-[2fr_2fr_1fr_1fr_auto] sm:items-center sm:gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {initials(u.name)}
                  </span>
                  <span className="font-medium">{u.name}</span>
                </div>
                <span className="truncate text-sm text-muted">{u.email}</span>
                <span>
                  <span
                    className={[
                      'inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                      u.role === 'admin'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-teal/15 text-teal-light',
                    ].join(' ')}
                  >
                    {u.role}
                  </span>
                </span>
                <span className="text-sm text-muted">
                  {fmtDate(u.createdAt)}
                </span>
                <div className="flex justify-start sm:justify-end">
                  <button
                    onClick={() => setToDelete(u)}
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

      {/* Add-user modal */}
      <AddUserModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(input) => {
          createMut.mutate(input)
          setAddOpen(false)
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteMut.mutate(toDelete.id)
          setToDelete(null)
        }}
        title="Delete user"
        message={`Delete ${toDelete?.name}? This cannot be undone.`}
        confirmLabel="Delete user"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add-user modal
// ---------------------------------------------------------------------------

function AddUserModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: {
    name: string
    email: string
    role: Role
    password: string
  }) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('engineer')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setName('')
    setEmail('')
    setRole('engineer')
    setPassword('')
    setError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError('All fields are required.')
      return
    }
    onSubmit({ name, email, role, password })
    reset()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Add user"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="Jane Engineer"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="jane@petrosense.io"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="input"
            >
              <option value="engineer">Engineer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </label>
        </div>

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
            Create user
          </button>
        </div>
      </form>
    </Modal>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
