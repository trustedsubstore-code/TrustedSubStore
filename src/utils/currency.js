export let globalRates = { USD: 122, EUR: 142, GBP: 162, KRW: 0.081 };

export const setGlobalRates = (rates) => {
  if (rates && typeof rates === 'object') {
    globalRates = { ...globalRates, ...rates };
  }
};

export function convertPrice(amount, toCurrency = 'USD') {
  // Amount is always in BDT base
  if (toCurrency === 'USD') {
    return amount / globalRates.USD;
  }
  if (toCurrency === 'EUR') {
    return amount / globalRates.EUR;
  }
  if (toCurrency === 'GBP') {
    return amount / globalRates.GBP;
  }
  if (toCurrency === 'KRW') {
    return amount / globalRates.KRW;
  }
  return amount; // BDT
}

export function formatPrice(amount, currencyCode = 'USD') {
  const converted = convertPrice(amount, currencyCode);
  if (currencyCode === 'USD') {
    return `USD ${converted.toFixed(2)}`;
  }
  if (currencyCode === 'EUR') {
    return `€ ${converted.toFixed(2)}`;
  }
  if (currencyCode === 'GBP') {
    return `£ ${converted.toFixed(2)}`;
  }
  if (currencyCode === 'KRW') {
    return `₩ ${converted.toFixed(0)}`;
  }
  return `৳ ${converted.toFixed(0)}`;
}
