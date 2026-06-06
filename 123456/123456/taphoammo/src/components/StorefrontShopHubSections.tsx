import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  Store,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  StorefrontCategoryHubCard,
  STOREFRONT_HUB_PRODUCT_CATEGORIES,
  STOREFRONT_HUB_SERVICE_CATEGORIES,
} from './StorefrontGuestLanding';
import {
  ShopHubSearchToolbar,
  type ShopHubSearchParams,
} from './StorefrontHubSearchToolbar';

export type { ShopHubSearchParams } from './StorefrontHubSearchToolbar';
export { ShopHubSearchToolbar } from './StorefrontHubSearchToolbar';

export type ShopHubFeaturedItem = {
  id: number;
  name: string;
  imageUrl: string;
  hasKhongTrung?: boolean;
  isHot?: boolean;
  isSponsored?: boolean;
};

export type ShopHubSponsoredPromoBadge = { label: string; variant?: 'default' | 'accent' };

export type ShopHubSponsoredItem = {
  id: number;
  title: string;
  seller: string;
  sellerInitial: string;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  isOutOfStock?: boolean;
  isService?: boolean;
  description: string;
  businessLine?: string;
  promoBadges?: ShopHubSponsoredPromoBadge[];
  price: string;
  /** URL ảnh hoặc emoji (một ký tự / chuỗi ngắn). */
  image: string;
};

export function HubStockLabel({
  stock,
  isOutOfStock,
  isService,
  compact,
}: {
  stock: number;
  isOutOfStock?: boolean;
  isService?: boolean;
  compact?: boolean;
}) {
  const textCls = compact ? 'text-[11px]' : 'text-[12px]';
  if (isService) {
    return (
      <span className={`${textCls} font-semibold text-violet-700 shrink-0 tabular-nums`} title="Dịch vụ">
        Đặt hàng ngay
      </span>
    );
  }
  if (isOutOfStock || stock <= 0) {
    return (
      <span className={`${textCls} font-semibold text-red-600 shrink-0`} title="Hết hàng">
        Hết hàng
      </span>
    );
  }
  const low = stock < 100;
  return (
    <span
      className={`${textCls} shrink-0 tabular-nums inline-flex items-baseline gap-1`}
      title={low ? 'Tồn kho thấp' : 'Còn hàng'}
    >
      <span className="font-medium text-slate-500">Tồn kho</span>
      <span className={`font-bold ${low ? 'text-orange-600' : 'text-emerald-600'}`}>
        {stock.toLocaleString('vi-VN')}
      </span>
    </span>
  );
}

function HubStarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
          }
        />
      ))}
    </div>
  );
}

export function isLikelyImageUrl(s: string) {
  return /^https?:\/\//i.test(s) || s.startsWith('data:') || s.startsWith('//');
}

const SPONSORED_SCROLL_HIDE =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

export function ShopHubSponsoredCarousel({
  items,
  onSponsoredClick,
}: {
  items: ShopHubSponsoredItem[];
  onSponsoredClick?: (id: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showNav, setShowNav] = useState(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    const overflow = scrollWidth > clientWidth + 1;
    setShowNav(overflow);
    setCanLeft(scrollLeft > 1);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    window.addEventListener('resize', updateScrollState);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScrollState);
    };
  }, [items.length, updateScrollState]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(280, Math.floor(el.clientWidth * 0.85));
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  return (
    <div className="relative mx-auto max-w-6xl">
      {showNav && (
        <>
          <button
            type="button"
            aria-label="Xem sản phẩm tài trợ trước đó"
            disabled={!canLeft}
            onClick={() => scrollByDir(-1)}
            className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-30 sm:left-0 sm:h-10 sm:w-10 sm:-translate-x-1/2"
          >
            <ChevronLeft size={20} strokeWidth={2.25} className="sm:h-[22px] sm:w-[22px]" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Xem thêm sản phẩm tài trợ"
            disabled={!canRight}
            onClick={() => scrollByDir(1)}
            className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-700 shadow-md backdrop-blur-sm transition hover:bg-white disabled:pointer-events-none disabled:opacity-30 sm:right-0 sm:h-10 sm:w-10 sm:translate-x-1/2"
          >
            <ChevronRight size={20} strokeWidth={2.25} className="sm:h-[22px] sm:w-[22px]" aria-hidden />
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className={`flex flex-nowrap gap-5 overflow-x-auto scroll-smooth pb-1 snap-x snap-mandatory ${SPONSORED_SCROLL_HIDE} ${showNav ? 'scroll-pl-6 scroll-pr-6 sm:scroll-pl-10 sm:scroll-pr-10' : ''}`}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSponsoredClick?.(item.id)}
            className="group flex w-[min(100%,20rem)] max-w-full shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-sm transition hover:border-amber-200/80 hover:shadow-lg hover:shadow-amber-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <div className="relative flex h-40 shrink-0 items-center justify-center bg-gradient-to-br from-violet-100 via-fuchsia-50 to-rose-50 sm:h-44">
              <span className="absolute right-2.5 top-2.5 z-10 rounded-md bg-amber-400 px-2 py-0.5 text-[9px] font-black tracking-wide text-amber-950 shadow-sm">
                TÀI TRỢ <span className="text-amber-700">✦</span>
              </span>
              {isLikelyImageUrl(item.image) ? (
                <img
                  src={item.image}
                  alt=""
                  className="h-24 w-24 object-contain transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28"
                  loading="lazy"
                />
              ) : (
                <span
                  className="select-none text-6xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105 sm:text-7xl"
                  aria-hidden
                >
                  {item.image}
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2.5 p-4">
              <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-900 sm:text-sm">{item.title}</h3>
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-slate-500">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <HubStarRating rating={item.rating} size={11} />
                  <span className="font-semibold text-slate-700 tabular-nums">{item.rating}</span>
                  <span className="text-slate-400">({item.reviews.toLocaleString('vi-VN')})</span>
                </div>
                <span className="shrink-0 font-semibold text-orange-500 tabular-nums">
                  Đã bán {item.sold.toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <HubStockLabel
                  stock={item.stock}
                  isOutOfStock={item.isOutOfStock}
                  isService={item.isService}
                  compact
                />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                  {item.sellerInitial}
                </div>
                <span className="truncate text-[12px] font-semibold text-slate-800">{item.seller}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#3b82f6" className="shrink-0" aria-hidden>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-500">{item.description}</p>
              {item.businessLine && (
                <p className="line-clamp-2 text-[10px] leading-snug text-slate-500 [overflow-wrap:anywhere]">
                  <span className="font-bold text-slate-600">Kinh doanh:</span> {item.businessLine}
                </p>
              )}
              {item.promoBadges && item.promoBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5" aria-label="Ưu đãi">
                  {item.promoBadges.map((b) => {
                    const accent = b.variant === 'accent';
                    return (
                      <span
                        key={b.label}
                        className={
                          accent
                            ? 'rounded-md border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700'
                            : 'rounded-md border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600'
                        }
                      >
                        {b.label}
                      </span>
                    );
                  })}
                </div>
              )}
              <p className="mt-auto pt-1 text-base font-bold text-emerald-600 tabular-nums">{item.price}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  featuredItems: ShopHubFeaturedItem[];
  sponsoredItems?: ShopHubSponsoredItem[];
  onFeaturedClick?: (id: number) => void;
  onSponsoredClick?: (id: number) => void;
  onScrollToCatalog?: () => void;
  productTypesByCategory?: Record<string, string[]>;
  serviceTypesByCategory?: Record<string, string[]>;
  onHubSearch?: (params: ShopHubSearchParams) => void;
  /** Đăng ký / mở kênh bán hàng (demo: có thể dẫn tới admin). */
  onDangKyBanHang?: () => void;
};

/**
 * Trang chủ sau đăng nhập: ô tìm kiếm + danh mục SP/DV + hàng nổi bật (đồng bộ style guest landing / emerald).
 */
export function StorefrontShopHubSections({
  featuredItems,
  sponsoredItems = [],
  onFeaturedClick,
  onSponsoredClick,
  onScrollToCatalog,
  productTypesByCategory = {},
  serviceTypesByCategory = {},
  onHubSearch,
  onDangKyBanHang,
}: Props) {
  const goCatalog = () => onScrollToCatalog?.();

  return (
    <div className="bg-slate-50 border-b border-slate-200/90">
      <section className="max-w-[1700px] mx-auto px-6 pt-5 pb-3">
        <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/95 to-emerald-50/40 p-5 sm:p-7 md:p-8 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-white/60">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/90 mb-2">
                Gian hàng trực tuyến
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-[1.85rem] font-black tracking-tight text-slate-900 font-display">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  TapHoa
                </span>
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  MMO
                </span>
              </h2>
              <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
                Giao dịch tài khoản game, dịch vụ MMO và tài sản kỹ thuật số{' '}
                <span className="text-slate-800 font-medium">an toàn, bảo mật nhất</span>.
              </p>
            </div>
            {onDangKyBanHang && (
              <button
                type="button"
                onClick={onDangKyBanHang}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-emerald-200/90 bg-white/90 px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-500/10 transition hover:border-emerald-300 hover:bg-white hover:shadow-md hover:ring-emerald-500/20 active:scale-[0.98] sm:self-auto"
              >
                <Store size={18} className="text-emerald-600" strokeWidth={2.25} aria-hidden />
                Đăng ký bán hàng
              </button>
            )}
          </div>

          <div className="relative mt-6 sm:mt-7 rounded-2xl sm:rounded-3xl border-2 border-slate-300/90 bg-white/90 p-2 sm:p-2.5 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-sm">
            <ShopHubSearchToolbar
              productTypesByCategory={productTypesByCategory}
              serviceTypesByCategory={serviceTypesByCategory}
              onSearch={params => {
                if (onHubSearch) {
                  onHubSearch(params);
                  return;
                }
                goCatalog();
              }}
            />
          </div>
        </div>
      </section>

      <section id="logged-in-danh-sach-san-pham" className="max-w-[1700px] mx-auto px-6 pb-10 scroll-mt-20">
        <div className="flex flex-col items-center mb-5 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-display flex flex-wrap items-center justify-center gap-2.5">
            <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
            DANH SÁCH SẢN PHẨM
            <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
          </h2>
        </div>
        <div className="mx-auto w-full max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STOREFRONT_HUB_PRODUCT_CATEGORIES.map((cat) => (
            <Fragment key={cat.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={goCatalog}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goCatalog();
                  }
                }}
                className="text-left rounded-3xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <StorefrontCategoryHubCard compact title={cat.title} icon={cat.icon} desc={cat.desc} color={cat.color} />
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <section id="logged-in-danh-sach-dich-vu" className="max-w-[1700px] mx-auto px-6 pb-10 scroll-mt-20">
        <div className="flex flex-col items-center mb-5 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-display flex flex-wrap items-center justify-center gap-2.5">
            <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
            DANH SÁCH DỊCH VỤ
            <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
          </h2>
        </div>
        <div className="mx-auto w-full max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STOREFRONT_HUB_SERVICE_CATEGORIES.map((cat) => (
            <Fragment key={cat.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={goCatalog}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goCatalog();
                  }
                }}
                className="text-left rounded-3xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <StorefrontCategoryHubCard compact title={cat.title} icon={cat.icon} desc={cat.desc} color={cat.color} />
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <section className="max-w-[1700px] mx-auto px-6 pb-10 scroll-mt-20">
        <div className="flex flex-col items-center mb-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 font-display flex flex-wrap items-center justify-center gap-3">
            <span className="w-8 h-1 bg-emerald-500 rounded-full" />
            SẢN PHẨM NỔI BẬT
            <span className="w-8 h-1 bg-emerald-500 rounded-full" />
          </h2>
          <p className="text-[13px] text-slate-500 mt-2">Chọn nhanh — xem chi tiết & mua trong trang gian hàng</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFeaturedClick?.(item.id)}
              className="group bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all p-3 text-center relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <div className="relative flex min-h-[72px] items-center justify-center py-2">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-12 w-12 sm:h-14 sm:w-14 object-contain mx-auto group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug mt-1">{item.name}</p>
            </button>
          ))}
        </div>
      </section>

      {sponsoredItems.length > 0 && (
        <section className="max-w-[1700px] mx-auto px-6 pb-12 scroll-mt-20" aria-labelledby="hub-san-pham-tai-tro-heading">
          <div className="flex flex-col items-center mb-6 text-center">
            <h2
              id="hub-san-pham-tai-tro-heading"
              className="text-2xl sm:text-3xl font-black text-slate-800 font-display flex flex-wrap items-center justify-center gap-3"
            >
              <span className="w-8 h-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500" />
              SẢN PHẨM TÀI TRỢ
              <span className="w-8 h-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
            </h2>
            <p className="text-[13px] text-slate-500 mt-2 max-w-lg">
              Gian hàng được tài trợ — ưu tiên hiển thị, cam kết minh bạch theo chính sách nền tảng.
            </p>
          </div>
          <ShopHubSponsoredCarousel items={sponsoredItems} onSponsoredClick={onSponsoredClick} />
        </section>
      )}
    </div>
  );
}
