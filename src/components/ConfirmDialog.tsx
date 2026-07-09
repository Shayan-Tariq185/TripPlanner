import { AnimatePresence, motion } from 'framer-motion'
import { CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Blocking confirmation modal for destructive, irreversible actions
 * (e.g. deleting a trip). Requires an explicit confirm click — never fires
 * on a single click of the triggering button.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/80 px-4 backdrop-blur-xl"
          onClick={onCancel}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="w-full max-w-sm rounded-2xl bg-white/[0.04] p-1.5 ring-1 ring-white/[0.06] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="rounded-[calc(theme(borderRadius.2xl)-0.375rem)] bg-ink-900/95 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-coral-500/10">
                <WarningCircle size={22} weight="light" className="text-coral-500" />
              </div>
              <h2 className="mt-4 font-display text-xl text-mist-50">{title}</h2>
              <p className="mt-1.5 text-sm text-mist-400">{description}</p>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={onCancel} disabled={loading}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={onConfirm} disabled={loading}>
                  {loading ? <CircleNotch size={16} className="animate-spin" /> : confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
