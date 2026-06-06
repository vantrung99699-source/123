import { Fragment } from 'react';
import {
  Grid,
  TrendingUp,
  Code,
  MoreHorizontal,
  Store,
  Mail,
  Monitor,
  User,
  Cpu,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { StorefrontLandingFooter } from './StorefrontLandingFooter';
import type { StorefrontInfoTabId } from './StorefrontInfoPage';
import { motion } from 'motion/react';
import {
  ShopHubSearchToolbar,
  type ShopHubSearchParams,
} from './StorefrontHubSearchToolbar';
import {
  ShopHubSponsoredCarousel,
  type ShopHubSponsoredItem,
} from './StorefrontShopHubSections';

type CategoryItem = {
  id: string;
  title: string;
  icon: LucideIcon;
  desc: string;
  color: string;
};

export const STOREFRONT_HUB_PRODUCT_CATEGORIES: CategoryItem[] = [
  { id: 'email', title: 'Email', icon: Mail, desc: 'Gmail, Yahoo, Hotmail... và nhiều hơn thế nữa', color: 'bg-blue-50 text-blue-600' },
  { id: 'software', title: 'Phần mềm', icon: Monitor, desc: 'Các phần mềm chuyên dụng cho kiếm tiền online', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'account', title: 'Tài khoản', icon: User, desc: 'Facebook, BM, Key Windows, Kaspersky...', color: 'bg-purple-50 text-purple-600' },
  { id: 'other_prod', title: 'Khác', icon: Grid, desc: 'Các sản phẩm số đa dạng khác', color: 'bg-orange-50 text-orange-600' },
];

export const STOREFRONT_HUB_SERVICE_CATEGORIES: CategoryItem[] = [
  { id: 'engagement', title: 'Tăng tương tác', icon: TrendingUp, desc: 'Tăng like, view, share, comment cho sản phẩm', color: 'bg-pink-50 text-pink-600' },
  { id: 'dev', title: 'Dịch vụ phần mềm', icon: Code, desc: 'Dịch vụ code tool MMO, đồ họa, video...', color: 'bg-indigo-50 text-indigo-600' },
  { id: 'blockchain', title: 'Blockchain', icon: Cpu, desc: 'Dịch vụ tiền ảo, NFT, Coinlist và blockchain', color: 'bg-amber-50 text-amber-600' },
  { id: 'other_serv', title: 'Dịch vụ khác', icon: MoreHorizontal, desc: 'Các dịch vụ MMO phổ biến khác hiện nay', color: 'bg-slate-50 text-slate-600' },
];

type CategoryCardProps = Pick<CategoryItem, 'title' | 'icon' | 'desc' | 'color'> & {
  /** Thẻ nhỏ gọn cho trang chủ / hub (mặc định: thẻ lớn legacy). */
  compact?: boolean;
};

export function StorefrontCategoryHubCard({ title, icon: Icon, desc, color, compact }: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ y: compact ? -4 : -5 }}
      className={
        compact
          ? 'group relative flex min-h-[156px] flex-col items-center justify-start overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/50 px-5 pb-4 pt-5 text-center shadow-[0_6px_24px_-6px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/80 transition-[box-shadow,border-color,transform] duration-300 hover:border-emerald-200/70 hover:shadow-[0_18px_44px_-12px_rgba(16,185,129,0.18)] hover:ring-emerald-100/40 sm:min-h-[168px]'
          : 'group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center'
      }
    >
      {compact && (
        <span
          className="pointer-events-none absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-emerald-400/0 via-emerald-500/55 to-teal-500/0 opacity-80"
          aria-hidden
        />
      )}
      <div
        className={`flex items-center justify-center transition-transform duration-300 ${color} ${
          compact
            ? 'mb-3 h-14 w-14 shrink-0 rounded-2xl shadow-sm ring-1 ring-slate-900/5 group-hover:scale-105'
            : 'w-16 h-16 rounded-2xl mb-4 group-hover:scale-110'
        }`}
      >
        <Icon size={compact ? 24 : 32} />
      </div>
      <h3
        className={`font-bold text-slate-900 font-display ${compact ? 'mb-1.5 text-base leading-snug tracking-tight' : 'text-lg mb-2'}`}
      >
        {title}
      </h3>
      <p
        className={`${compact ? 'mx-auto max-w-[17rem] text-[13px] leading-relaxed text-slate-600 line-clamp-3' : 'text-sm text-slate-500 leading-relaxed'}`}
      >
        {desc}
      </p>
      {!compact && (
        <motion.button
          type="button"
          className="mt-4 text-emerald-600 font-semibold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Xem thêm <ArrowRight size={14} />
        </motion.button>
      )}
    </motion.div>
  );
}

export interface StorefrontGuestLandingProps {
  productTypesByCategory?: Record<string, string[]>;
  serviceTypesByCategory?: Record<string, string[]>;
  /** Chưa đăng nhập — mở form đăng ký tài khoản. */
  onOpenRegister?: () => void;
  onDangKyBanHang?: () => void;
  onHubSearch?: (params: ShopHubSearchParams) => void;
  sponsoredItems?: ShopHubSponsoredItem[];
  onSponsoredClick?: (id: number) => void;
  onOpenInfo?: (tab: StorefrontInfoTabId) => void;
}

export function StorefrontGuestLanding({
  productTypesByCategory = {},
  serviceTypesByCategory = {},
  onOpenRegister,
  onDangKyBanHang,
  onHubSearch,
  sponsoredItems = [],
  onSponsoredClick,
  onOpenInfo,
}: StorefrontGuestLandingProps) {
  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleHubSearch = (params: ShopHubSearchParams) => {
    if (onHubSearch) {
      onHubSearch(params);
      return;
    }
    scrollToId('guest-danh-sach-san-pham');
  };

  const handleGuestAccountAction = () => {
    if (onOpenRegister) {
      onOpenRegister();
      return;
    }
    onDangKyBanHang?.();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans pt-[6.75rem]">
      <main className="flex-grow pb-20">
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
                  <h1 className="text-2xl sm:text-3xl md:text-[1.85rem] font-black tracking-tight text-slate-900 font-display">
                    <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                      TapHoa
                    </span>
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                      MMO
                    </span>
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
                    Giao dịch tài khoản game, dịch vụ MMO và tài sản kỹ thuật số{' '}
                    <span className="text-slate-800 font-medium">an toàn, bảo mật nhất</span>.
                  </p>
                </div>
                {(onOpenRegister || onDangKyBanHang) && (
                  <button
                    type="button"
                    onClick={handleGuestAccountAction}
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
                  onSearch={handleHubSearch}
                />
              </div>
            </div>
          </section>
        </div>

        <section id="guest-danh-sach-san-pham" className="max-w-[1700px] mx-auto px-6 pb-10 mb-10 scroll-mt-24">
          <div className="flex flex-col items-center mb-5 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-display flex flex-wrap items-center justify-center gap-2.5">
              <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
              DANH SÁCH SẢN PHẨM
              <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
            </h2>
          </div>
          <div className="mx-auto w-full max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STOREFRONT_HUB_PRODUCT_CATEGORIES.map(cat => (
              <Fragment key={cat.id}>
                <StorefrontCategoryHubCard compact title={cat.title} icon={cat.icon} desc={cat.desc} color={cat.color} />
              </Fragment>
            ))}
          </div>
        </section>

        <section id="guest-danh-sach-dich-vu" className="max-w-[1700px] mx-auto px-6 pb-10 mb-10 scroll-mt-24">
          <div className="flex flex-col items-center mb-5 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-display flex flex-wrap items-center justify-center gap-2.5">
              <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
              DANH SÁCH DỊCH VỤ
              <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
            </h2>
          </div>
          <div className="mx-auto w-full max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STOREFRONT_HUB_SERVICE_CATEGORIES.map(cat => (
              <Fragment key={cat.id}>
                <StorefrontCategoryHubCard compact title={cat.title} icon={cat.icon} desc={cat.desc} color={cat.color} />
              </Fragment>
            ))}
          </div>
        </section>

        <section id="guest-gioi-thieu" className="max-w-[1700px] mx-auto px-6 mb-24 scroll-mt-24">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-emerald-100/90 bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-amber-200/25 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" aria-hidden />

            <div className="relative z-10 flex flex-col items-center mb-6 sm:mb-8 text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 font-display flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                <span className="w-6 sm:w-8 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500" />
                GIAN HÀNG ĐƯỢC TÀI TRỢ
                <span className="w-6 sm:w-8 h-0.5 sm:h-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
              </h2>
              <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
                Danh sách gian hàng ưu tiên hiển thị — cam kết minh bạch, giao dịch an toàn theo chính sách TapHoaMMO.
              </p>
            </div>

            {sponsoredItems.length > 0 ? (
              <ShopHubSponsoredCarousel items={sponsoredItems} onSponsoredClick={onSponsoredClick} />
            ) : (
              <div className="relative z-10 mx-auto max-w-lg rounded-2xl border border-dashed border-emerald-200 bg-white/70 px-6 py-12 text-center">
                <Store size={32} className="mx-auto text-emerald-500/70 mb-3" aria-hidden />
                <p className="text-sm font-semibold text-slate-700">Chưa có gian hàng tài trợ</p>
                <p className="text-xs text-slate-500 mt-1">Vị trí sẽ hiển thị khi admin cấu hình gian Top 1 / tài trợ.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <StorefrontLandingFooter
        onChatSupport={handleGuestAccountAction}
        onJoinSeller={handleGuestAccountAction}
        onOpenInfo={onOpenInfo}
      />
    </div>
  );
}
