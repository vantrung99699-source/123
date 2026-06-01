import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import {
  localeDisplayCode,
  type StorefrontLocale,
  useStorefrontLocale,
} from '../i18n/storefrontLocale';
import { STOREFRONT_TOP_BAR_BG, STOREFRONT_TOP_BAR_BORDER } from '../theme/storefrontHeaderColors';

const OPTIONS: { id: StorefrontLocale; label: string }[] = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
];

type Props = {
  /** `top` — thanh header trên cùng (nền tối); `emerald` — header xanh chính */
  variant?: 'top' | 'emerald';
};

export function StorefrontLanguageSwitcher({ variant = 'emerald' }: Props) {
  const { locale, setLocale } = useStorefrontLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isTop = variant === 'top';

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={
          isTop
            ? 'flex items-center gap-1 text-[11px] font-bold text-emerald-100/85 hover:text-white hover:bg-emerald-700/50 px-1.5 py-0.5 rounded transition-colors'
            : 'flex items-center gap-1.5 text-sm font-bold text-white hover:text-emerald-100 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors'
        }
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Chọn ngôn ngữ"
      >
        <Globe size={isTop ? 12 : 16} />
        <span>{localeDisplayCode(locale)}</span>
        <ChevronDown size={isTop ? 12 : 14} className={`opacity-90 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          className={
            isTop
              ? 'absolute right-0 top-full mt-1 min-w-[140px] rounded-md border shadow-lg overflow-hidden z-[90] py-0.5'
              : 'absolute right-0 top-full mt-2 min-w-[148px] rounded-xl border border-emerald-900/10 bg-white shadow-xl overflow-hidden z-[80] py-1'
          }
          style={
            isTop
              ? { backgroundColor: STOREFRONT_TOP_BAR_BG, borderColor: STOREFRONT_TOP_BAR_BORDER }
              : undefined
          }
          role="listbox"
        >
          {OPTIONS.map(opt => (
            <li key={opt.id} role="option" aria-selected={locale === opt.id}>
              <button
                type="button"
                onClick={() => {
                  setLocale(opt.id);
                  setOpen(false);
                }}
                className={
                  isTop
                    ? `w-full px-3 py-1.5 text-left text-[11px] font-semibold transition-colors flex items-center justify-between gap-2 ${
                        locale === opt.id
                          ? 'text-emerald-50'
                          : 'text-emerald-100/80 hover:bg-[#0f4d3a]/80'
                      }`
                    : `w-full px-3.5 py-2.5 text-left text-[13px] font-semibold transition-colors flex items-center justify-between gap-2 ${
                        locale === opt.id
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`
                }
                style={
                  isTop && locale === opt.id
                    ? { backgroundColor: STOREFRONT_TOP_BAR_BORDER }
                    : undefined
                }
              >
                <span>{opt.label}</span>
                <span
                  className={
                    isTop
                      ? 'text-[9px] font-bold uppercase text-emerald-400/70'
                      : 'text-[10px] font-bold uppercase text-slate-400'
                  }
                >
                  {localeDisplayCode(opt.id)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
