/**
 * Currency formatting utilities for global currency support
 */

export interface CurrencyConfig {
  code: string
  name: string
  symbol: string
}

export const currencies: Record<string, CurrencyConfig> = {
  PKR: { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  USD: { code: "USD", name: "US Dollar", symbol: "$" },
  EUR: { code: "EUR", name: "Euro", symbol: "€" },
  GBP: { code: "GBP", name: "British Pound", symbol: "£" },
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹" },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$" },
}

/**
 * Format an amount with the specified currency
 * @param amount - The amount to format
 * @param currencyCode - The currency code (e.g., 'PKR', 'USD')
 * @param options - Additional formatting options
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'PKR',
  options: {
    showSymbol?: boolean
    showCode?: boolean
    decimals?: number
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    decimals = 2
  } = options

  const currency = currencies[currencyCode] || currencies.PKR
  const formattedAmount = amount.toFixed(decimals)

  if (showSymbol && showCode) {
    return `${currency.symbol} ${formattedAmount} ${currency.code}`
  } else if (showSymbol) {
    return `${currency.symbol} ${formattedAmount}`
  } else if (showCode) {
    return `${formattedAmount} ${currency.code}`
  } else {
    return formattedAmount
  }
}

/**
 * Get currency symbol for a given currency code
 * @param currencyCode - The currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return currencies[currencyCode]?.symbol || currencies.PKR.symbol
}

/**
 * Get currency name for a given currency code
 * @param currencyCode - The currency code
 */
export function getCurrencyName(currencyCode: string): string {
  return currencies[currencyCode]?.name || currencies.PKR.name
}

/**
 * Legacy format function for backwards compatibility
 * @deprecated Use formatCurrency instead
 */
export function formatAmount(amount: number, currency: string = 'PKR'): string {
  return formatCurrency(amount, currency)
}