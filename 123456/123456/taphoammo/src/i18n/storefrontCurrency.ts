import { useCallback, useEffect, useState } from 'react';

/** Tiền tệ hiển thị storefront (số dư nội bộ vẫn tính bằng VND). */
export type StorefrontCurrency = 'VND' | 'USD';

const STORAGE_KEY = 'taphoammo_storefront_currency';
const CURRENCY_CHANGE_EVENT = 'taphoammo-storefront-currency-change';

/** Tỷ giá demo — chỉ đổi hiển thị, không quy đổi thanh toán thật. */
export const STOREFRONT_VND_PER_USD = 25_000;

export const STOREFRONT_CURRENCY_OPTIONS: { id: StorefrontCurrency; label: string }[] = [
  { id: 'VND', label: 'Việt Nam Đồng' },
  { id: 'USD', label: 'US Dollar' },
];

export function getStoredStorefrontCurrency(): StorefrontCurrency {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'VND' || v === 'USD') return v;
  } catch {
    /* ignore */
  }
  return 'VND';
}

export function setStoredStorefrontCurrency(currency: StorefrontCurrency): void {
  try {
    localStorage.setItem(STORAGE_KEY, currency);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent<StorefrontCurrency>(CURRENCY_CHANGE_EVENT, { detail: currency }));
}

/** Định dạng số tiền từ số dư VND nội bộ. */
export function formatStorefrontMoney(vndAmount: number, currency: StorefrontCurrency): string {
  const n = Math.max(0, vndAmount);
  if (currency === 'USD') {
    const usd = n / STOREFRONT_VND_PER_USD;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usd);
  }
  return `${Math.round(n).toLocaleString('vi-VN')}đ`;
}

export function useStorefrontCurrency() {
  const [currency, setCurrencyState] = useState<StorefrontCurrency>(() => getStoredStorefrontCurrency());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'VND' || e.newValue === 'USD')) {
        setCurrencyState(e.newValue);
      }
    };
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<StorefrontCurrency>).detail;
      if (next === 'VND' || next === 'USD') setCurrencyState(next);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(CURRENCY_CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(CURRENCY_CHANGE_EVENT, onChange);
    };
  }, []);

  const setCurrency = useCallback((next: StorefrontCurrency) => {
    setStoredStorefrontCurrency(next);
    setCurrencyState(next);
  }, []);

  return {
    currency,
    setCurrency,
    formatMoney: (vndAmount: number) => formatStorefrontMoney(vndAmount, currency),
  };
}
