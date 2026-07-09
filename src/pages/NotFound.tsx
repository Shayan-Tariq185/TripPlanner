import { useNavigate } from 'react-router-dom'
import { Compass } from '@phosphor-icons/react'
import { Button } from '../components/Button'
import { MountReveal } from '../components/MountReveal'

export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center">
      <MountReveal className="flex flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold-500/25 bg-gold-500/10">
          <Compass size={26} weight="light" className="text-gold-400" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-normal text-mist-50">Off the map</h1>
        <p className="mt-3 max-w-sm text-mist-300">
          This page doesn't exist, or the link may be out of date. Let's get you back on track.
        </p>
        <div className="mt-8">
          <Button size="lg" withArrow onClick={() => navigate('/')}>
            Back to VoyageFlow
          </Button>
        </div>
      </MountReveal>
    </div>
  )
}
