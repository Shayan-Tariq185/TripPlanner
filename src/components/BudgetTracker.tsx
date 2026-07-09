import { useMemo, useState } from 'react'
import { Plus, X, CircleNotch, Info } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import type { Stop, Expense, Currency } from '../lib/types'
import { formatMoney } from '../lib/currency'
import { Button } from './Button'
import { TextField } from './TextField'

interface BudgetTrackerProps {
  tripId: string
  budget: number
  currency: Currency
  stops: Stop[]
  expenses: Expense[]
  onExpenseAdded: (expense: Expense) => void
  onExpenseDeleted: (expenseId: string) => void
}

const CATEGORY_COLOR: Record<string, string> = {
  hotel: '#e8b355',
  attraction: '#2bb0a5',
  restaurant: '#e0674f',
  transport: '#94a3b8',
  other: '#a78bfa',
}

const CATEGORY_LABEL: Record<string, string> = {
  hotel: 'Hotels',
  attraction: 'Attractions',
  restaurant: 'Food',
  transport: 'Transport',
  other: 'Other',
}

export function BudgetTracker({
  tripId,
  budget,
  currency,
  stops,
  expenses,
  onExpenseAdded,
  onExpenseDeleted,
}: BudgetTrackerProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [category, setCategory] = useState('other')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const breakdown = useMemo(() => {
    const totals: Record<string, number> = { hotel: 0, attraction: 0, restaurant: 0, transport: 0, other: 0 }

    for (const stop of stops) {
      if (stop.est_cost) totals[stop.type] = (totals[stop.type] ?? 0) + stop.est_cost
    }
    for (const expense of expenses) {
      const key = totals[expense.category] !== undefined ? expense.category : 'other'
      totals[key] = (totals[key] ?? 0) + expense.amount
    }

    return totals
  }, [stops, expenses])

  const totalSpent = Object.values(breakdown).reduce((sum, v) => sum + v, 0)
  const remaining = budget - totalSpent
  const percentUsed = budget > 0 ? Math.min(100, (totalSpent / budget) * 100) : 0
  const overBudget = totalSpent > budget

  async function handleAddExpense() {
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) return
    setSaving(true)

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        category,
        amount: numAmount,
        description: description.trim() || CATEGORY_LABEL[category],
      })
      .select()
      .single()

    setSaving(false)
    if (!error && data) {
      onExpenseAdded(data as Expense)
      setAddOpen(false)
      setAmount('')
      setDescription('')
      setCategory('other')
    }
  }

  async function handleDeleteExpense(id: string) {
    onExpenseDeleted(id)
    await supabase.from('expenses').delete().eq('id', id)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Overview */}
      <div>
        <span className="eyebrow mb-3">
          <span className="eyebrow-dot" /> Budget
        </span>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="tabular font-display text-[2rem] font-medium text-mist-50">
            {formatMoney(totalSpent, currency)}
          </span>
          <span className="text-[0.85rem] text-mist-400">of {formatMoney(budget, currency)}</span>
        </div>

        <div className="relative mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              width: `${percentUsed}%`,
              background: overBudget
                ? 'linear-gradient(90deg, #d4a657, #e8785a)'
                : 'linear-gradient(90deg, #d4a657, #e8785a)',
            }}
          />
        </div>

        <p className={`mt-2.5 text-xs ${overBudget ? 'text-coral-500' : 'text-mist-400'}`}>
          {overBudget
            ? `${formatMoney(Math.abs(remaining), currency)} over budget`
            : `${formatMoney(remaining, currency)} remaining`}
        </p>

        <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-hairline bg-mist-400/[0.04] px-3 py-2 text-[0.72rem] leading-relaxed text-mist-400">
          <Info size={13} weight="light" className="mt-0.5 shrink-0 text-gold-400" />
          These are rough estimates to help you plan — actual prices vary by season, availability, and where you book.
        </p>
      </div>

      {/* Category breakdown */}
      <div className="flex flex-col">
        {Object.entries(breakdown)
          .filter(([, amount]) => amount > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([key, amount], i, arr) => (
            <div
              key={key}
              className={`flex items-center justify-between py-[0.7rem] text-[0.85rem] ${
                i < arr.length - 1 ? 'border-b border-hairline' : ''
              }`}
            >
              <span className="flex items-center gap-2.5 text-mist-100">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[key] }}
                  aria-hidden="true"
                />
                {CATEGORY_LABEL[key]}
              </span>
              <span className="tabular font-medium text-mist-400">{formatMoney(amount, currency)}</span>
            </div>
          ))}
        {totalSpent === 0 && <p className="py-2 text-sm text-mist-400">No spend tracked yet.</p>}
      </div>

      {/* Manual expenses list */}
      {expenses.length > 0 && (
        <div className="flex max-h-[200px] flex-col gap-2 overflow-y-auto border-t border-hairline pt-4 pr-1">
          {expenses.map((expense) => (
            <div key={expense.id} className="group flex items-center justify-between gap-2 text-[0.85rem]">
              <span className="min-w-0 truncate text-mist-300">{expense.description}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular text-mist-400">{formatMoney(expense.amount, currency)}</span>
                <button
                  onClick={() => handleDeleteExpense(expense.id)}
                  aria-label={`Remove ${expense.description}`}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={13} weight="light" className="text-mist-500 hover:text-coral-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add manual expense */}
      {addOpen ? (
        <div className="flex flex-col gap-4 border-t border-hairline pt-5">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`rounded-[0.9rem] border px-2.5 py-2 text-[0.76rem] transition-all duration-300
                            ${
                              category === key
                                ? 'border-gold-500 bg-gold-500/[0.1] text-mist-50'
                                : 'border-hairline-strong bg-ink-900 text-mist-300 hover:bg-white/[0.04]'
                            }`}
              >
                {label}
              </button>
            ))}
          </div>
          <TextField
            label={`Amount (${currency})`}
            type="number"
            inputMode="numeric"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
          <TextField
            label="Description"
            placeholder="Optional"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="md" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button size="md" disabled={saving || !amount} onClick={handleAddExpense}>
              {saving ? <CircleNotch size={16} className="animate-spin" /> : 'Add expense'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddOpen(true)}
          className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-[1rem] border border-hairline-strong bg-ink-900 py-[0.85rem] text-[0.85rem] text-mist-100 transition-all duration-400 hover:border-gold-500 hover:text-gold-400"
        >
          <Plus size={14} weight="bold" />
          Add expense
        </button>
      )}
    </div>
  )
}
