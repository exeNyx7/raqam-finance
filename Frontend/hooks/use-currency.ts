import { useApp } from '@/contexts/app-context'
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol as getCurrencySymbolUtil } from '@/lib/utils/currency'

/**
 * Custom hook that provides currency formatting functions
 * using the current user's currency settings
 */
export function useCurrency() {
  const { state } = useApp()
  const currentCurrency = state.settings.currency

  /**
   * Format an amount using the user's current currency setting
   */
  const formatCurrency = (
    amount: number,
    options?: {
      showSymbol?: boolean
      showCode?: boolean
      decimals?: number
    }
  ): string => {
    return formatCurrencyUtil(amount, currentCurrency, options)
  }

  /**
   * Get the current currency symbol
   */
  const getCurrencySymbol = (): string => {
    return getCurrencySymbolUtil(currentCurrency)
  }

  /**
   * Get the current currency code
   */
  const getCurrencyCode = (): string => {
    return currentCurrency
  }

  return {
    formatCurrency,
    getCurrencySymbol,
    getCurrencyCode,
    currentCurrency
  }
}