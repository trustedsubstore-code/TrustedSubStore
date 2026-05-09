import { createContext, useState, useEffect } from 'react';
import { setGlobalRates } from '../utils/currency';

export const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('tss_currency') || 'USD'; // Default to base USD
  });
  
  // We use state to force a re-render once rates load, so the UI updates
  const [ratesLoaded, setRatesLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem('tss_currency', currency);
  }, [currency]);

  useEffect(() => {
    fetch('/data/exchangeRates.json')
      .then(res => res.json())
      .then(data => {
        setGlobalRates(data);
        setRatesLoaded(true);
      })
      .catch(err => console.error("Failed to fetch exchange rates:", err));
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, ratesLoaded }}>
      {children}
    </CurrencyContext.Provider>
  );
}
