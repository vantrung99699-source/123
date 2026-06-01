import { useState, useEffect, type ReactNode } from 'react';
import { Store, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StorefrontTopBar } from './StorefrontTopBar';
import { useStorefrontLocale } from '../i18n/storefrontLocale';

type Props = {
  onLogoClick: () => void;
  /** Dùng `() => <… />` để mỗi vùng (desktop / menu mobile) có instance riêng — tránh lỗi khi gắn cùng một element hai chỗ. */
  authSlot: ReactNode | (() => ReactNode);
};

const NavItem = ({
  children,
  hasDropdown,
  href,
}: {
  children: ReactNode;
  hasDropdown?: boolean;
  href?: string;
}) => {
  const cls =
    'group relative flex items-center gap-1 cursor-pointer py-2 text-sm font-medium transition-colors text-white hover:text-emerald-100';
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
        {hasDropdown && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />}
      </a>
    );
  }
  return (
    <div className={cls}>
      {children}
      {hasDropdown && <ChevronDown size={14} className="group-hover:rotate-180 transition-transform" />}
    </div>
  );
};

/** Chiều cao top bar (h-7) + header chính — dùng offset menu mobile & padding landing. */
export const STOREFRONT_GUEST_HEADER_OFFSET = 'calc(1.75rem + 3.5rem)';

export function StorefrontGuestHeader({ onLogoClick, authSlot }: Props) {
  const { header } = useStorefrontLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const authDesktop = typeof authSlot === 'function' ? authSlot() : authSlot;
  const authMobile = typeof authSlot === 'function' ? authSlot() : authSlot;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60]">
        <StorefrontTopBar />
      </div>
      <header className="fixed top-7 left-0 right-0 z-50 bg-emerald-500 py-3 shadow-md">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={onLogoClick}
              className="flex items-center gap-2 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="TapHoaMMO"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-lg">
                <Store size={24} />
              </div>
              <span className="text-xl font-black text-white tracking-tight font-display">TapHoaMMO</span>
            </button>

            <nav className="hidden lg:flex items-center gap-6">
              <NavItem hasDropdown href="#guest-danh-sach-san-pham">
                {header.products}
              </NavItem>
              <NavItem hasDropdown href="#guest-danh-sach-dich-vu">
                {header.services}
              </NavItem>
              <NavItem href="#guest-gioi-thieu">{header.support}</NavItem>
              <NavItem href="#guest-gioi-thieu">{header.share}</NavItem>
              <NavItem hasDropdown href="#guest-gioi-thieu">
                {header.tools}
              </NavItem>
              <NavItem href="#guest-gioi-thieu">{header.faqs}</NavItem>
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:block h-8 w-px bg-white/20" />
            <div className="hidden sm:flex items-center gap-3">{authDesktop}</div>
            <button
              type="button"
              className="lg:hidden p-2 text-white"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              style={{ top: STOREFRONT_GUEST_HEADER_OFFSET }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-slate-50 px-6 pt-6 pb-10 overflow-auto border-t border-slate-200"
            >
              <div className="flex flex-col gap-4 text-slate-800">
                <a href="#guest-danh-sach-san-pham" onClick={() => setMobileOpen(false)} className="font-semibold">
                  {header.products}
                </a>
                <a href="#guest-danh-sach-dich-vu" onClick={() => setMobileOpen(false)} className="font-semibold">
                  {header.services}
                </a>
                <a href="#guest-gioi-thieu" onClick={() => setMobileOpen(false)}>
                  {header.support}
                </a>
                <div className="h-px bg-slate-200" />
                <div className="flex flex-wrap gap-3 items-center">{authMobile}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
