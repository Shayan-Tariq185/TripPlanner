import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleNotch } from '@phosphor-icons/react'
import { useAuth } from '../lib/AuthContext'
import { GlassCard } from '../components/GlassCard'
import { MountReveal } from '../components/MountReveal'
import { RouteLine } from '../components/RouteLine'
import { TextField } from '../components/TextField'
import { Button } from '../components/Button'

export function SignUp() {
  const { signUpWithPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signUpWithPassword(email, password)
    setLoading(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-32">
      <RouteLine className="pointer-events-none absolute -right-32 top-1/4 h-[500px] w-[700px] opacity-30" />
      <MountReveal className="relative w-full max-w-md">
        <GlassCard nested innerClassName="p-8 md:p-10">
          <h1 className="font-display text-3xl text-mist-50">Start planning</h1>
          <p className="mt-2 text-sm text-mist-300">Create an account to build your first trip.</p>

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
              autoComplete="new-password"
              hint="At least 6 characters."
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p role="alert" className="text-sm text-coral-500">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
              {loading ? <CircleNotch size={18} className="animate-spin" /> : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-mist-400">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-gold-300 hover:text-gold-200">
              Sign in
            </Link>
          </p>
        </GlassCard>
      </MountReveal>
    </div>
  )
}
