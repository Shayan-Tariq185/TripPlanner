import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowUpRight } from '@phosphor-icons/react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg'
  withArrow?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  withArrow = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'group relative inline-flex items-center justify-center gap-2 rounded-full font-medium ' +
    'transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ' +
    'disabled:opacity-40 disabled:cursor-not-allowed'

  const sizes = {
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  const variants = {
    primary:
      'bg-gradient-to-b from-gold-400 to-gold-500 text-[#1a1206] hover:brightness-105 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_12px_24px_-10px_rgba(212,166,87,0.55)]',
    secondary:
      'bg-mist-400/[0.06] text-mist-100 border border-hairline-strong hover:bg-mist-400/[0.12]',
    ghost: 'text-mist-300 hover:text-mist-50',
    danger:
      'bg-coral-500 text-mist-50 hover:bg-coral-500/90 shadow-[0_8px_24px_-8px_rgba(224,103,79,0.5)]',
  }

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {withArrow && (
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.14]
                     transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                     group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105"
        >
          <ArrowUpRight size={14} weight="bold" />
        </span>
      )}
    </button>
  )
}
