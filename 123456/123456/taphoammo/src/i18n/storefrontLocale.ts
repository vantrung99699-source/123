import { useCallback, useEffect, useState } from 'react';

export type StorefrontLocale = 'vi' | 'en';

const STORAGE_KEY = 'taphoammo_storefront_locale';

const HEADER_LABELS = {
  vi: {
    products: 'Sản phẩm',
    services: 'Dịch vụ',
    support: 'Hỗ trợ',
    share: 'Chia sẻ',
    tools: 'Công cụ',
    faqs: 'FAQs',
    topUp: 'Nạp tiền',
    balance: 'Số dư',
    messages: 'Nhắn tin',
    searchPlaceholder: 'Tìm kiếm tài khoản, phần mềm, dịch vụ...',
    noCategories: 'Chưa có danh mục',
  },
  en: {
    products: 'Products',
    services: 'Services',
    support: 'Support',
    share: 'Share',
    tools: 'Tools',
    faqs: 'FAQs',
    topUp: 'Top up',
    balance: 'Balance',
    messages: 'Messages',
    searchPlaceholder: 'Search accounts, software, services...',
    noCategories: 'No categories yet',
  },
} as const;

export type StorefrontHeaderLabels = (typeof HEADER_LABELS)[StorefrontLocale];

export function getStoredStorefrontLocale(): StorefrontLocale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'vi') return v;
  } catch {
    /* ignore */
  }
  return 'vi';
}

const LOCALE_CHANGE_EVENT = 'taphoammo-storefront-locale-change';

export function setStoredStorefrontLocale(locale: StorefrontLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent<StorefrontLocale>(LOCALE_CHANGE_EVENT, { detail: locale }));
}

export function getStorefrontHeaderLabels(locale: StorefrontLocale): StorefrontHeaderLabels {
  return HEADER_LABELS[locale];
}

export function localeDisplayCode(locale: StorefrontLocale): 'VN' | 'EN' {
  return locale === 'vi' ? 'VN' : 'EN';
}

export function useStorefrontLocale() {
  const [locale, setLocaleState] = useState<StorefrontLocale>(() => getStoredStorefrontLocale());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'vi' || e.newValue === 'en')) {
        setLocaleState(e.newValue);
      }
    };
    const onLocaleChange = (e: Event) => {
      const next = (e as CustomEvent<StorefrontLocale>).detail;
      if (next === 'vi' || next === 'en') setLocaleState(next);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange);
    };
  }, []);

  const setLocale = useCallback((next: StorefrontLocale) => {
    setStoredStorefrontLocale(next);
    setLocaleState(next);
  }, []);

  return {
    locale,
    setLocale,
    header: getStorefrontHeaderLabels(locale),
    displayCode: localeDisplayCode(locale),
  };
}
