import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, User } from '@/types'

// ---------------------------------------------------------------------------
// Auth store — holds the current session: user, role, and JWT token.
// Persisted to localStorage so a refresh keeps the user signed in.
// ---------------------------------------------------------------------------

interface AuthState {
  currentUser: User | null
  role: Role | null
  token: string | null
  isAuthenticated: boolean
  setSession: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      role: null,
      token: null,
      isAuthenticated: false,
      setSession: (user, token) =>
        set({
          currentUser: user,
          role: user.role,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          currentUser: null,
          role: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'petrosense-auth',
    }
  )
)

/** Non-reactive token getter, used by the axios interceptor (later stages). */
export const getAuthToken = (): string | null => useAuthStore.getState().token
