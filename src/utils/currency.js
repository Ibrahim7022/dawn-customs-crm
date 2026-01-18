// Currency formatting utility

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AED: 'د.إ',
};

const currencyLocales = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  AED: 'ar-AE',
};

export function formatCurrency(amount, currency = 'INR') {
  const symbol = currencySymbols[currency] || '₹';
  const locale = currencyLocales[currency] || 'en-IN';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback formatting
    return `${symbol}${amount.toLocaleString(locale)}`;
  }
}

export function getCurrencySymbol(currency = 'INR') {
  return currencySymbols[currency] || '₹';
}
