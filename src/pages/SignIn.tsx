import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleNotch } from '@phosphor-icons/react'
import { useAuth } from '../lib/AuthContext'
import { GlassCard } from '../components/GlassCard'
import { MountReveal } from '../components/MountReveal'
import { RouteLine } from '../components/RouteLine'
import { TextField } from '../components/TextField'
import { Button } from '../components/Button'

export function SignIn() {
  const { signInWithPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signInWithPassword(email, password)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-32">
      <RouteLine className="pointer-events-none absolute -left-32 top-1/3 h-[500px] w-[700px] opacity-30" />
      <MountReveal className="relative w-full max-w-md">
        <GlassCard nested innerClassName="p-8 md:p-10">
          <h1 className="font-display text-3xl text-mist-50">Welcome back</h1>
          <p className="mt-2 text-sm text-mist-300">Sign in to see your trips.</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p role="alert" className="text-sm text-coral-500">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
              {loading ? <CircleNotch size={18} className="animate-spin" /> : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-mist-400">
            New here?{' '}
            <Link to="/signup" className="font-medium text-gold-300 hover:text-gold-200">
              Create an account
            </Link>
          </p>
        </GlassCard>
      </MountReveal>
    </div>
  )
}
