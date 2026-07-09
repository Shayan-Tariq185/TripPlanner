import type { Currency } from './types'

const SYMBOL: Record<Currency, string> = {
  USD: '$',
  PKR: 'Rs ',
}

/**
 * Formats a numeric amount with the correct symbol and thousands separators
 * for the given currency. Centralized here so every screen displaying money
 * (budget, stop costs, expenses, donut chart) stays consistent rather than
 * each formatting dollars/rupees slightly differently.
 */
export function formatMoney(amount: number, currency: Currency): string {
  const rounded = Math.round(amount).toLocaleString('en-US')
  return `${SYMBOL[currency]}${rounded}`
}

/** Just the symbol/prefix, for places that build up their own layout (e.g. form field prefixes). */
export function currencySymbol(currency: Currency): string {
  return SYMBOL[currency]
}
