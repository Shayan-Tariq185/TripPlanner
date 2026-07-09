import type { Currency } from '../lib/types'
import { formatMoney } from '../lib/currency'

interface BudgetDonutProps {
  spent: number
  budget: number
  currency: Currency
}

/**
 * A donut chart showing spend vs. remaining budget, matching the Nepal
 * dashboard reference's budget card. Pure SVG, no charting library needed
 * for a two-segment ring.
 */
export function BudgetDonut({ spent, budget, currency }: BudgetDonutProps) {
  const percent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
  const remaining = Math.max(0, budget - spent)
  const overBudget = spent > budget

  const radius = 46
  const circumference = 2 * Math.PI * radius
  const spentLength = (percent / 100) * circumference

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex h-[116px] w-[116px] shrink-0 items-center justify-center">
        <svg viewBox="0 0 116 116" className="absolute -rotate-90">
          <circle cx="58" cy="58" r={radius} fill="none" stroke="rgba(212,166,87,0.18)" strokeWidth="12" />
          <circle
            cx="58"
            cy="58"
            r={radius}
            fill="none"
            stroke={overBudget ? '#e8785a' : '#d4a657'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${spentLength} ${circumference - spentLength}`}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="text-center">
          <div className="tabular font-display text-[1.15rem] font-medium text-mist-50">
            {Math.round(percent)}%
          </div>
          <div className="text-[0.65rem] text-mist-400">used</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 text-[0.82rem]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: overBudget ? '#e8785a' : '#d4a657' }} />
          <span className="text-mist-300">Spent</span>
          <span className="tabular font-medium text-mist-100">{formatMoney(spent, currency)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[rgba(212,166,87,0.18)]" />
          <span className="text-mist-300">Remaining</span>
          <span className="tabular font-medium text-mist-100">{formatMoney(remaining, currency)}</span>
        </div>
      </div>
    </div>
  )
}
