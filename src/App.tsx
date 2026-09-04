import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import AppLayout from '@/layouts/AppLayout'
import { RequireAuth, RequireRole } from '@/components/guards'
import { useReducedMotion } from '@/lib/useReducedMotion'

import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Overview from '@/pages/Overview'
import WellDetail from '@/pages/WellDetail'
import Alerts from '@/pages/Alerts'
import Analytics from '@/pages/Analytics'
import SettingsPage from '@/pages/SettingsPage'
import AdminUsers from '@/pages/AdminUsers'
import AdminWells from '@/pages/AdminWells'
import NotFound from '@/pages/NotFound'

/**
 * Route "group" for top-level transitions. Inner /app navigation keeps the
 * same key ('app') so the shell + live polling never remount — AppLayout's own
 * AnimatePresence animates those. Only crossing between landing / login / app
 * (or 404) triggers the top-level fade.
 */
function routeGroup(pathname: string): string {
  if (pathname === '/') return 'landing'
  if (pathname.startsWith('/login')) return 'login'
  if (pathname.startsWith('/app')) return 'app'
  return 'other'
}

export default function App() {
  const location = useLocation()
  const reduced = useReducedMotion()
  const group = routeGroup(location.pathname)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={group}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.2, ease: 'easeOut' }}
      >
        <Routes location={location}>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* App (authenticated) */}
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Overview />} />
            <Route path="well/:id" element={<WellDetail />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Admin-only */}
            <Route
              path="admin/users"
              element={
                <RequireRole role="admin">
                  <AdminUsers />
                </RequireRole>
              }
            />
            <Route
              path="admin/wells"
              element={
                <RequireRole role="admin">
                  <AdminWells />
                </RequireRole>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}
