import { Sun, Moon } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../lib/ThemeContext'

/**
 * Compact sun/moon theme toggle. The icon crossfades + rotates on switch so
 * the change feels intentional rather than a hard swap. Sits in the navbar.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-hairline-strong text-mist-300 transition-colors duration-500 hover:text-gold-400"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="absolute"
        >
          {isDark ? <Moon size={17} weight="light" /> : <Sun size={17} weight="light" />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
