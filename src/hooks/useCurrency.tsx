import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: "GHS", symbol: "₵", name: "Ghana Cedis" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "EGP", symbol: "E£", name: "Egyptian Pound" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling" },
  { code: "XOF", symbol: "CFA", name: "West African CFA" },
  { code: "XAF", symbol: "FCFA", name: "Central African CFA" },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  rates: Record<string, number>;
  loading: boolean;
  formatPrice: (amount: number | null, opts?: { showCode?: boolean }) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: CURRENCIES[0],
  setCurrency: () => {},
  rates: {},
  loading: true,
  formatPrice: () => "",
});

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem("aktivee_currency");
    if (saved) {
      const found = CURRENCIES.find((c) => c.code === saved);
      if (found) return found;
    }
    return CURRENCIES[0]; // GHS default
  });

  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("aktivee_currency", c.code);
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("exchange-rates");
        if (error) throw error;
        if (data?.rates) {
          setRates(data.rates);
        }
      } catch (err) {
        console.error("Failed to fetch exchange rates:", err);
        // Fallback: all rates = 1 (no conversion)
        const fallback: Record<string, number> = {};
        CURRENCIES.forEach((c) => (fallback[c.code] = 1));
        setRates(fallback);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const formatPrice = useCallback(
    (amount: number | null, opts?: { showCode?: boolean }) => {
      if (amount == null) return "Request Price";
      const rate = rates[currency.code] || 1;
      const converted = amount * rate;
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(converted);
      return opts?.showCode
        ? `${currency.symbol}${formatted} ${currency.code}`
        : `${currency.symbol}${formatted}`;
    },
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, loading, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
