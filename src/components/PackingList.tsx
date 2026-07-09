import { useState, type FormEvent } from 'react'
import { Plus, X, CircleNotch, ListChecks } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import type { PackingItem } from '../lib/types'

interface PackingListProps {
  tripId: string
  items: PackingItem[]
  onItemAdded: (item: PackingItem) => void
  onItemToggled: (item: PackingItem) => void
  onItemDeleted: (itemId: string) => void
}

export function PackingList({ tripId, items, onItemAdded, onItemToggled, onItemDeleted }: PackingListProps) {
  const [label, setLabel] = useState('')
  const [adding, setAdding] = useState(false)

  const checkedCount = items.filter((i) => i.is_checked).length

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    setAdding(true)

    const { data, error } = await supabase
      .from('packing_items')
      .insert({ trip_id: tripId, label: trimmed, category: 'general' })
      .select()
      .single()

    setAdding(false)
    if (!error && data) {
      onItemAdded(data as PackingItem)
      setLabel('')
    }
  }

  async function handleToggle(item: PackingItem) {
    const updated = { ...item, is_checked: !item.is_checked }
    onItemToggled(updated)
    await supabase.from('packing_items').update({ is_checked: updated.is_checked }).eq('id', item.id)
  }

  async function handleDelete(itemId: string) {
    onItemDeleted(itemId)
    await supabase.from('packing_items').delete().eq('id', itemId)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">
          <span className="eyebrow-dot" /> Packing list
        </span>
        {items.length > 0 && (
          <span className="tabular text-[0.76rem] text-mist-400">
            {checkedCount}/{items.length} packed
          </span>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Add an item…"
          className="flex-1 rounded-[1.1rem] border border-hairline-strong bg-ink-900 px-4 py-3 text-[0.88rem]
                     text-mist-100 placeholder:text-mist-500
                     transition-all duration-400
                     focus:border-gold-500 focus:shadow-[0_0_0_4px_rgba(212,166,87,0.12)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding || !label.trim()}
          aria-label="Add item"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-400 to-gold-500 text-[#1a1206]
                     transition-opacity duration-300 disabled:opacity-40"
        >
          {adding ? <CircleNotch size={16} className="animate-spin" /> : <Plus size={16} weight="bold" />}
        </button>
      </form>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ListChecks size={22} weight="light" className="text-mist-500" />
          <p className="max-w-[220px] text-sm text-mist-400">
            Nothing on the list yet — add what you don't want to forget.
          </p>
        </div>
      ) : (
        <div className="flex max-h-[420px] flex-col gap-1 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="group flex items-center gap-3 rounded-[0.9rem] px-2 py-2.5 transition-colors duration-300 hover:bg-white/[0.03]">
              <button
                onClick={() => handleToggle(item)}
                aria-pressed={item.is_checked}
                aria-label={item.is_checked ? `Mark ${item.label} as not packed` : `Mark ${item.label} as packed`}
                className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-300
                            ${
                              item.is_checked
                                ? 'border-gold-500 bg-gold-500 text-[#1a1206]'
                                : 'border-white/20 text-transparent hover:border-white/40'
                            }`}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L4.5 8.5L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className={`flex-1 text-[0.88rem] ${item.is_checked ? 'text-mist-500 line-through' : 'text-mist-100'}`}>
                {item.label}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                aria-label={`Remove ${item.label}`}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={13} weight="light" className="text-mist-500 hover:text-coral-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
