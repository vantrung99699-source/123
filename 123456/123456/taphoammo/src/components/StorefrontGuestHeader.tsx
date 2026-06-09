import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Store, ChevronDown, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StorefrontTopBar } from './StorefrontTopBar';
import { StorefrontHeaderNavCategoryDropdown } from './StorefrontHeaderNavCategoryDropdown';
import { StorefrontHeaderNavToolsDropdown } from './StorefrontHeaderNavToolsDropdown';
import { useStorefrontLocale } from '../i18n/storefrontLocale';
import { STOREFRONT_TOOLS, type StorefrontToolId } from '../storefront/storefrontTools';

type Props = {
  onLogoClick: () => void;
  productCategories?: { name: string }[];
  serviceCategories?: { name: string }[];
  selectedCategories?: string[];
  noCategoriesLabel?: string;
  onSelectProductCategory?: (name: string) => void;
  onSelectServiceCategory?: (name: string) => void;
  onOpenFaqs?: () => void;
  onOpenSupport?: () => void;
  onOpenShare?: () => void;
  onOpenTool?: (toolId: StorefrontToolId) => void;
  sharePageActive?: boolean;
  activeToolId?: StorefrontToolId | null;
  /** Dùng `() => <… />` để mỗi vùng (desktop / menu mobile) có instance riêng — tránh lỗi khi gắn cùng một element hai chỗ. */
  authSlot: ReactNode | (() => ReactNode);
};

/** Chiều cao top bar (h-7) + header chính — dùng offset menu mobile & padding landing. */
export const STOREFRONT_GUEST_HEADER_OFFSET = 'calc(1.75rem + 3.5rem)';

export function StorefrontGuestHeader({
  onLogoClick,
  productCategories = [],
  serviceCategories = [],
  selectedCategories = [],
  noCategoriesLabel = 'Chưa có danh mục',
  onSelectProductCategory,
  onSelectServiceCategory,
  onOpenFaqs,
  onOpenSupport,
  onOpenShare,
  onOpenTool,
  sharePageActive = false,
  activeToolId = null,
  authSlot,
}: Props) {
  const { header } = useStorefrontLocale();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerDropdown, setHeaderDropdown] = useState<null | 'product' | 'service' | 'tools'>(null);
  const headerDropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!headerDropdown) return;
    const onDown = (e: MouseEvent) => {
      const el = headerDropdownRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) setHeaderDropdown(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [headerDropdown]);

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

            <nav
              className="hidden lg:flex items-center gap-0.5 text-sm font-medium text-white"
              ref={headerDropdownRef}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHeaderDropdown(v => (v === 'product' ? null : 'product'))}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    headerDropdown === 'product'
                      ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25'
                      : 'hover:bg-white/15 hover:text-emerald-100'
                  }`}
                  aria-expanded={headerDropdown === 'product'}
                  aria-haspopup="menu"
                >
                  {header.products}{' '}
                  <ChevronDown
                    size={14}
                    className={`opacity-90 transition-transform duration-200 ${headerDropdown === 'product' ? 'rotate-180' : ''}`}
                  />
                </button>
                {headerDropdown === 'product' && (
                  <StorefrontHeaderNavCategoryDropdown
                    variant="product"
                    menuTitle={header.products}
                    categories={productCategories}
                    selectedCategories={selectedCategories}
                    emptyLabel={noCategoriesLabel}
                    onSelectCategory={name => {
                      setHeaderDropdown(null);
                      onSelectProductCategory?.(name);
                    }}
                  />
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHeaderDropdown(v => (v === 'service' ? null : 'service'))}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    headerDropdown === 'service'
                      ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25'
                      : 'hover:bg-white/15 hover:text-emerald-100'
                  }`}
                  aria-expanded={headerDropdown === 'service'}
                  aria-haspopup="menu"
                >
                  {header.services}{' '}
                  <ChevronDown
                    size={14}
                    className={`opacity-90 transition-transform duration-200 ${headerDropdown === 'service' ? 'rotate-180' : ''}`}
                  />
                </button>
                {headerDropdown === 'service' && (
                  <StorefrontHeaderNavCategoryDropdown
                    variant="service"
                    menuTitle={header.services}
                    categories={serviceCategories}
                    selectedCategories={selectedCategories}
                    emptyLabel={noCategoriesLabel}
                    onSelectCategory={name => {
                      setHeaderDropdown(null);
                      onSelectServiceCategory?.(name);
                    }}
                  />
                )}
              </div>

              <button
                type="button"
                onClick={onOpenSupport}
                className="px-3.5 py-2 rounded-lg hover:bg-white/15 hover:text-emerald-100 transition-colors"
              >
                {header.support}
              </button>
              <button
                type="button"
                onClick={onOpenShare}
                className={`px-3.5 py-2 rounded-lg transition-colors ${
                  sharePageActive
                    ? 'bg-white/20 text-white font-semibold'
                    : 'hover:bg-white/15 hover:text-emerald-100'
                }`}
              >
                {header.share}
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setHeaderDropdown(v => (v === 'tools' ? null : 'tools'))}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 ${
                    headerDropdown === 'tools' || activeToolId
                      ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/25'
                      : 'hover:bg-white/15 hover:text-emerald-100'
                  }`}
                  aria-expanded={headerDropdown === 'tools'}
                  aria-haspopup="menu"
                >
                  {header.tools}{' '}
                  <ChevronDown
                    size={14}
                    className={`opacity-90 transition-transform duration-200 ${headerDropdown === 'tools' ? 'rotate-180' : ''}`}
                  />
                </button>
                {headerDropdown === 'tools' && (
                  <StorefrontHeaderNavToolsDropdown
                    menuTitle={header.tools}
                    activeToolId={activeToolId}
                    onSelectTool={toolId => {
                      setHeaderDropdown(null);
                      onOpenTool?.(toolId);
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={onOpenFaqs}
                className="px-3.5 py-2 rounded-lg hover:bg-white/15 hover:text-emerald-100 transition-colors"
              >
                {header.faqs}
              </button>
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
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-2">
                    {header.products}
                  </p>
                  <div className="flex flex-col gap-1">
                    {productCategories.length === 0 ? (
                      <p className="text-sm text-slate-500">{noCategoriesLabel}</p>
                    ) : (
                      productCategories.map(cat => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            onSelectProductCategory?.(cat.name);
                          }}
                          className="text-left text-sm font-medium py-2 px-2 rounded-lg hover:bg-emerald-50 text-slate-800"
                        >
                          {cat.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700 mb-2">
                    {header.services}
                  </p>
                  <div className="flex flex-col gap-1">
                    {serviceCategories.length === 0 ? (
                      <p className="text-sm text-slate-500">{noCategoriesLabel}</p>
                    ) : (
                      serviceCategories.map(cat => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            onSelectServiceCategory?.(cat.name);
                          }}
                          className="text-left text-sm font-medium py-2 px-2 rounded-lg hover:bg-violet-50 text-slate-800"
                        >
                          {cat.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenSupport?.();
                  }}
                  className="text-sm text-left"
                >
                  {header.support}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenShare?.();
                  }}
                  className="text-sm text-left"
                >
                  {header.share}
                </button>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-700 mb-2">
                    {header.tools}
                  </p>
                  <div className="flex flex-col gap-1">
                    {STOREFRONT_TOOLS.map(tool => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          onOpenTool?.(tool.id);
                        }}
                        className="text-left text-sm font-medium py-2 px-2 rounded-lg hover:bg-cyan-50 text-slate-800"
                      >
                        {tool.label}
                      </button>
                    ))}
                  </div>
                </div>
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
