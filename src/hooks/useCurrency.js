import { useCrmStore } from '../store/crmStore';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

export function useCurrency() {
  const settings = useCrmStore((state) => state.settings);
  const currency = settings.currency || 'INR';

  return {
    format: (amount) => formatCurrency(amount, currency),
    symbol: getCurrencySymbol(currency),
    currency,
  };
}
