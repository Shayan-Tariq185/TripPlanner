import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CircleNotch } from '@phosphor-icons/react'
import { AuthProvider } from './lib/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { Navbar } from './components/Navbar'
import { Landing } from './pages/Landing'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { NotFound } from './pages/NotFound'

// Dashboard, TripBuilder, TripView, and PublicTripView all pull in
// Framer Motion (directly or via TripCard), and the trip pages also pull in
// Leaflet (map rendering) and dnd-kit (drag-and-drop) — none of that is
// needed for a first-time visitor hitting the landing page or auth screens,
// so all four are lazy-loaded and only downloaded once actually visited.
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const TripBuilder = lazy(() => import('./pages/TripBuilder').then((m) => ({ default: m.TripBuilder })))
const TripView = lazy(() => import('./pages/TripView').then((m) => ({ default: m.TripView })))
const PublicTripView = lazy(() =>
  import('./pages/PublicTripView').then((m) => ({ default: m.PublicTripView }))
)

function PageFallback() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center text-mist-400">
      <CircleNotch size={20} className="animate-spin" />
    </div>
  )
}

function AppShell() {
  const location = useLocation()
  const isPublicShare = location.pathname.startsWith('/share/')

  return (
    <>
      <div className="ambient-mesh" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />
      {!isPublicShare && <Navbar />}
      <main>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/share/:shareSlug" element={<PublicTripView />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/new"
              element={
                <ProtectedRoute>
                  <TripBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId"
              element={
                <ProtectedRoute>
                  <TripView />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
