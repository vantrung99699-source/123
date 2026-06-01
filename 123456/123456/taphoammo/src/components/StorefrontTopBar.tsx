import { StorefrontCurrencySwitcher } from './StorefrontCurrencySwitcher';
import { StorefrontLanguageSwitcher } from './StorefrontLanguageSwitcher';
import { STOREFRONT_TOP_BAR_BG, STOREFRONT_TOP_BAR_BORDER } from '../theme/storefrontHeaderColors';

/** Chiều cao thanh top (Tailwind h-7) — đồng bộ offset header khách / marquee. */
export const STOREFRONT_TOP_BAR_HEIGHT_CLASS = 'h-7';

export function StorefrontTopBar() {
  return (
    <div
      className="w-full border-b"
      style={{
        backgroundColor: STOREFRONT_TOP_BAR_BG,
        borderColor: `${STOREFRONT_TOP_BAR_BORDER}cc`,
      }}
      role="banner"
      aria-label="Thanh tiện ích"
    >
      <div
        className={`max-w-[2000px] mx-auto px-3 sm:px-6 ${STOREFRONT_TOP_BAR_HEIGHT_CLASS} flex items-center justify-end gap-3`}
      >
        <StorefrontCurrencySwitcher variant="top" />
        <StorefrontLanguageSwitcher variant="top" />
      </div>
    </div>
  );
}
