import { useNavigate } from 'react-router-dom'
import {
  MapTrifold,
  Sparkle,
  Wallet,
  ShareNetwork,
  Notebook,
} from '@phosphor-icons/react'
import { Button } from '../components/Button'
import { GlassCard } from '../components/GlassCard'
import { BrandMark } from '../components/BrandMark'
import { TicketCard } from '../components/TicketCard'
import { Reveal } from '../components/Reveal'
import { useAuth } from '../lib/AuthContext'

export function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Signed-in visitors should never be bounced to a login wall from the
  // landing page. The primary CTA takes them straight into planning a new
  // trip; the secondary takes them to their existing trips.
  const primaryCta = user ? 'Build your next trip' : 'Build your first trip'
  const goPrimary = () => navigate(user ? '/trips/new' : '/signup')
  const goSecondary = () => navigate(user ? '/dashboard' : '/signin')
  const secondaryLabel = user ? 'Go to my trips →' : 'See a live itinerary →'

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] overflow-hidden">
        <div
          className="absolute left-1/2 top-[-220px] h-[640px] w-[640px] -translate-x-1/2 rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(212,166,87,0.16), transparent 70%)' }}
        />
        <div
          className="absolute right-[-100px] bottom-[-160px] h-[520px] w-[520px] rounded-full blur-[90px]"
          style={{ background: 'radial-gradient(circle, rgba(232,120,90,0.1), transparent 70%)' }}
        />
      </div>

      {/* Hero */}
      <section className="relative flex min-h-[100dvh] items-center px-4 pb-24 pt-16 md:pt-20">
        <svg
          className="pointer-events-none absolute inset-0 -z-10 opacity-50"
          viewBox="0 0 1180 600"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M -20 480 C 200 420, 260 300, 460 320 S 700 220, 780 140 S 1050 60, 1220 90"
            fill="none"
            stroke="#D4A657"
            strokeWidth="1.4"
            strokeDasharray="2 10"
            strokeLinecap="round"
            opacity="0.55"
          />
          <circle cx="460" cy="320" r="4" fill="#E8785A" opacity="0.7" />
          <circle cx="780" cy="140" r="4" fill="#D4A657" opacity="0.7" />
        </svg>

        <div className="relative z-[1] mx-auto grid w-full max-w-[1240px] items-center gap-12 md:grid-cols-[1.15fr_0.72fr]">
          <div>
            <Reveal>
              <span className="eyebrow">
                <span className="eyebrow-dot" /> Plan in minutes, not evenings
              </span>
            </Reveal>

            <Reveal delayMs={80}>
              <h1 className="mt-8 font-display text-[3.3rem] font-normal leading-[0.98] tracking-[-0.02em] text-mist-50 md:text-[5.6rem]">
                Your trip,
              <br />
              <em className="bg-gradient-to-br from-gold-300 via-gold-400 to-coral-500 bg-clip-text italic text-transparent">
              thoughtfully
              </em>
              <br />
              <em className="bg-gradient-to-br from-gold-300 via-gold-400 to-coral-500 bg-clip-text italic text-transparent">
              planned.
              </em>
              </h1>
            </Reveal>

            <Reveal delayMs={160}>
              <p className="mt-7 max-w-[34rem] text-[1.06rem] leading-[1.7] text-mist-300">
                Tell us where you're headed, your dates, and how you like to plan your trip.
                VoyageFlow drafts the full itinerary — you drag, reorder, and make it yours.
              </p>
            </Reveal>

            <Reveal delayMs={240}>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Button size="lg" withArrow onClick={goPrimary}>
                  {primaryCta}
                </Button>
                <button
                  onClick={goSecondary}
                  className="border-b border-hairline-strong pb-[3px] text-[0.9rem] text-mist-100 transition-colors duration-500 hover:border-gold-500"
                >
                  {secondaryLabel}
                </button>
              </div>
            </Reveal>

            <Reveal delayMs={320}>
              <div className="mt-14 flex gap-10 border-t border-hairline pt-8">
  <div>
    <b className="block font-display text-[1.9rem] font-medium text-mist-50">Minutes</b>
    <span className="text-[0.72rem] tracking-[0.12em] text-mist-400">TO A FULL ITINERARY</span>
  </div>
  <div>
    <b className="block font-display text-[1.9rem] font-medium text-mist-50">AI-powered</b>
    <span className="text-[0.72rem] tracking-[0.12em] text-mist-400">DAY-BY-DAY PLANNING</span>
  </div>
  <div>
    <b className="block font-display text-[1.9rem] font-medium text-mist-50">Anywhere</b>
    <span className="text-[0.72rem] tracking-[0.12em] text-mist-400">IN THE WORLD</span>
  </div>
</div>
            </Reveal>
          </div>

          <div className="relative hidden h-[540px] md:block">
            <TicketCard city="Lisbon, Portugal" dates="Aug 7 – Aug 12" badge="Budget" className="left-5 top-[10px] z-[1] -rotate-[5deg]" />
            <TicketCard city="Istanbul, Turkey" dates="Nov 12 – Nov 20" badge="Luxury" className="left-[120px] top-[120px] z-[2] rotate-[3deg] bg-ink-600" />
            <TicketCard city="Hunza, Pakistan" dates="Jul 7 – Jul 11" badge="Relaxed" className="left-[8px] top-[268px] z-[3] -rotate-[2deg]" />
            <div className="absolute inset-x-6 bottom-3 flex items-center gap-2 border-t border-dashed border-hairline-strong pt-5 font-display text-sm italic text-mist-300">
              <BrandMark className="h-[13px] w-[13px] shrink-0 text-mist-400" />
              Drafted, reordered, ready — in one sitting.
            </div>
          </div>
        </div>
      </section>

      {/* Feature bento */}
      <section className="px-4 py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <span className="eyebrow">
              <span className="eyebrow-dot" /> What's inside
            </span>
          </Reveal>
          <Reveal delayMs={60}>
            <h2 className="mt-5 max-w-[32rem] font-display text-3xl font-normal text-mist-50 md:text-[2.6rem]">
              Everything a trip plan actually needs.
            </h2>
          </Reveal>
          <Reveal delayMs={100}>
            <p className="mt-3 max-w-[30rem] text-mist-300">
              Not a checklist of buzzwords — the parts of planning that take the longest,
              handled in one place.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-4">
            <Reveal delayMs={0} className="md:col-span-3">
              <GlassCard className="h-full transition-transform duration-500 hover:-translate-y-1">
                <div className="flex h-full flex-col justify-between p-7">
                  <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-gold-500/20 bg-gold-500/10">
                    <Sparkle size={20} weight="light" className="text-gold-400" />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display text-xl font-medium text-mist-50">AI-drafted itineraries</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-mist-300">
                      Tell it where, when, and how you like to travel — get a full day-by-day plan back
                      in seconds, ready to reorder.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal delayMs={50}>
              <GlassCard
                className="relative h-full overflow-hidden transition-transform duration-500 hover:-translate-y-1"
                innerClassName="bg-[radial-gradient(circle_at_70%_20%,rgba(212,166,87,0.12),transparent_55%)]"
              >
                <div className="relative flex h-full flex-col p-7">
                  <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-gold-500/20 bg-gold-500/10">
                    <MapTrifold size={20} weight="light" className="text-gold-400" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-medium text-mist-50">Real routes</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist-300">
                    Every stop placed on an interactive map with the actual path between them.
                  </p>
                  <svg className="absolute bottom-5 right-6 h-[70px] w-[130px] opacity-90" viewBox="0 0 150 90" aria-hidden="true">
                    <path
                      d="M10 70 Q 50 20, 80 45 T 140 15"
                      fill="none"
                      stroke="#D4A657"
                      strokeWidth="1.2"
                      strokeDasharray="1.5 7"
                      opacity="0.7"
                    />
                    <circle cx="80" cy="45" r="3" fill="#E8785A" />
                    <circle cx="140" cy="15" r="3" fill="#D4A657" />
                  </svg>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal delayMs={100}>
              <GlassCard className="h-full transition-transform duration-500 hover:-translate-y-1">
                <div className="flex h-full flex-col p-7">
                  <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-gold-500/20 bg-gold-500/10">
                    <Wallet size={20} weight="light" className="text-gold-400" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-medium text-mist-50">Budget tracking</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist-300">
                    See spend by category against what you set aside, live as you plan.
                  </p>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal delayMs={150}>
              <GlassCard className="h-full transition-transform duration-500 hover:-translate-y-1">
                <div className="flex h-full flex-col p-7">
                  <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-gold-500/20 bg-gold-500/10">
                    <ShareNetwork size={20} weight="light" className="text-gold-400" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-medium text-mist-50">Share with anyone</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist-300">
                    Send a link. No account needed to view the plan.
                  </p>
                </div>
              </GlassCard>
            </Reveal>

            <Reveal delayMs={200} className="md:col-span-3">
              <GlassCard className="h-full transition-transform duration-500 hover:-translate-y-1">
                <div className="flex h-full flex-col p-7">
                  <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-gold-500/20 bg-gold-500/10">
                    <Notebook size={20} weight="light" className="text-gold-400" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-medium text-mist-50">
                    Notes &amp; packing, kept with the trip
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-mist-300">
                    Notes tied to the day they matter for, and a packing checklist that travels with the
                    plan instead of living in a separate app.
                  </p>
                </div>
              </GlassCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <GlassCard nested innerClassName="p-10 md:p-16">
              <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-display text-3xl font-normal text-mist-50 md:text-4xl">
                    Where are you headed?
                  </h2>
                  <p className="mt-2 text-mist-300">
                    Your first itinerary is a couple of questions away.
                  </p>
                </div>
                <Button size="lg" withArrow onClick={goPrimary}>
                  {user ? 'Build your next trip' : 'Start planning'}
                </Button>
              </div>
            </GlassCard>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
