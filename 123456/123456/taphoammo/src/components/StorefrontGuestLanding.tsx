import { Fragment } from 'react';
import {
  Mail,
  Monitor,
  User,
  Grid,
  TrendingUp,
  Code,
  Cpu,
  MoreHorizontal,
  ArrowRight,
  Search,
  ChevronDown,
  Clock,
  LayoutGrid,
  Facebook,
  MessageSquare,
  Phone,
  Info,
  Store,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';

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

export function StorefrontGuestLanding() {
  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans pt-[6.75rem]">
      <main className="flex-grow pb-20">
        <section className="container mx-auto px-4 mb-16 mt-6">
          <div className="relative overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/95 to-emerald-50/40 p-5 sm:p-7 md:p-8 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-white/60">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"
              aria-hidden
            />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-stretch lg:justify-between lg:gap-10">
              <div className="relative z-10 min-w-0 flex-1 text-center lg:text-left">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600/90 mb-2"
                >
                  Chợ MMO số 1 Việt Nam
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl sm:text-3xl lg:text-[2.35rem] font-black tracking-tight text-slate-900 font-display mb-3 leading-tight"
                >
                  <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">Giao dịch </span>
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">An toàn</span>
                  <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent"> & </span>
                  <br className="hidden lg:block" />
                  <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">Nhanh chóng</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-6"
                >
                  Nền tảng thương mại điện tử chuyên biệt dành cho cộng đồng MMO. Mua bán tài khoản, phần mềm và dịch vụ số với sự{' '}
                  <span className="text-slate-800 font-medium">bảo đảm tuyệt đối</span>.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap justify-center lg:justify-start gap-3"
                >
                  <button
                    type="button"
                    onClick={() => scrollToId('guest-danh-sach-san-pham')}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:brightness-[1.05] active:scale-[0.98]"
                  >
                    Khám phá ngay <ArrowRight size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200/90 bg-white/90 px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-500/10 transition hover:border-emerald-300 hover:bg-white hover:shadow-md hover:ring-emerald-500/20 active:scale-[0.98]"
                  >
                    <Store size={18} className="text-emerald-600" strokeWidth={2.25} aria-hidden />
                    Đăng ký bán hàng
                  </button>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                className="relative z-10 w-full max-w-md shrink-0 mx-auto lg:mx-0 lg:max-w-sm lg:self-center"
              >
                <div className="hidden lg:grid grid-cols-2 gap-3">
                  <div className="space-y-3 pt-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.08)] backdrop-blur-sm -rotate-6 ring-1 ring-white/60">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow-sm">
                        <Mail className="text-white" size={16} aria-hidden />
                      </div>
                      <div className="mb-2 h-1.5 w-16 rounded-full bg-slate-200/90" />
                      <div className="h-1.5 w-10 rounded-full bg-slate-100" />
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.08)] backdrop-blur-sm rotate-3 ring-1 ring-white/60">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
                        <Monitor className="text-white" size={16} aria-hidden />
                      </div>
                      <div className="mb-2 h-1.5 w-12 rounded-full bg-slate-200/90" />
                      <div className="h-1.5 w-20 rounded-full bg-slate-100" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.08)] backdrop-blur-sm rotate-6 ring-1 ring-white/60">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 shadow-sm">
                        <User className="text-white" size={16} aria-hidden />
                      </div>
                      <div className="mb-2 h-1.5 w-20 rounded-full bg-slate-200/90" />
                      <div className="h-1.5 w-12 rounded-full bg-slate-100" />
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_4px_20px_-6px_rgba(15,23,42,0.08)] backdrop-blur-sm -rotate-3 ring-1 ring-white/60">
                      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 shadow-sm">
                        <Cpu className="text-white" size={16} aria-hidden />
                      </div>
                      <div className="mb-2 h-1.5 w-10 rounded-full bg-slate-200/90" />
                      <div className="h-1.5 w-16 rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="relative z-10 mt-6 sm:mt-7 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 p-1.5 sm:p-2 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-stretch sm:gap-1 sm:min-h-[3.25rem]">
                <div className="group flex flex-1 items-center gap-3 min-w-0 rounded-xl sm:rounded-2xl bg-slate-50/80 px-3.5 py-3 sm:py-2.5 sm:pl-4 border border-transparent transition-colors focus-within:border-emerald-300/60 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.12)] sm:border-0 sm:focus-within:shadow-none sm:focus-within:bg-slate-50/80">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100">
                    <Search size={18} strokeWidth={2.25} aria-hidden />
                  </span>
                  <input
                    type="search"
                    placeholder="Bạn đang tìm sản phẩm gì?"
                    className="w-full min-w-0 border-none bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400 sm:text-sm"
                  />
                </div>

                <div className="my-1 hidden h-8 w-px shrink-0 self-center bg-gradient-to-b from-transparent via-slate-200 to-transparent sm:block" aria-hidden />

                <div className="relative flex min-w-0 items-center gap-2 rounded-xl bg-slate-50/60 px-3 py-2.5 transition-colors hover:bg-slate-100/80 sm:rounded-2xl sm:px-3 sm:py-0 sm:min-w-[10rem] border-b border-slate-100 sm:border-0">
                  <LayoutGrid size={16} className="hidden shrink-0 text-emerald-600/70 sm:block" strokeWidth={2} aria-hidden />
                  <select
                    className="w-full min-w-0 cursor-pointer appearance-none border-none bg-transparent py-1 pr-8 text-[13px] font-semibold text-slate-700 outline-none sm:text-xs"
                    aria-label="Loại tìm kiếm"
                  >
                    <option className="bg-white text-slate-800">Tùy chọn nội dung tìm kiếm</option>
                    <option className="bg-white text-slate-800">Sản phẩm</option>
                    <option className="bg-white text-slate-800">Dịch vụ</option>
                    <option className="bg-white text-slate-800">Gian hàng</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 sm:right-2"
                    aria-hidden
                  />
                </div>

                <div className="my-1 hidden h-8 w-px shrink-0 self-center bg-gradient-to-b from-transparent via-slate-200 to-transparent sm:block" aria-hidden />

                <div className="relative flex min-w-0 items-center gap-2 rounded-xl bg-slate-50/60 px-3 py-2.5 transition-colors hover:bg-slate-100/80 sm:rounded-2xl sm:px-3 sm:py-0 sm:min-w-[8.5rem] border-b border-slate-100 sm:border-0">
                  <Clock size={16} className="hidden shrink-0 text-emerald-600/70 sm:block" strokeWidth={2} aria-hidden />
                  <select
                    className="w-full min-w-0 cursor-pointer appearance-none border-none bg-transparent py-1 pr-6 text-[13px] font-semibold text-slate-700 outline-none sm:text-xs sm:pr-7"
                    aria-label="Sắp xếp"
                  >
                    <option className="bg-white text-slate-800">Mới nhất</option>
                    <option className="bg-white text-slate-800">Phổ biến</option>
                    <option className="bg-white text-slate-800">Giá tăng dần</option>
                    <option className="bg-white text-slate-800">Giá giảm dần</option>
                  </select>
                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 sm:right-2"
                    aria-hidden
                  />
                </div>

                <button
                  type="button"
                  onClick={() => scrollToId('guest-danh-sach-san-pham')}
                  className="mt-2 flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:brightness-[1.05] active:scale-[0.98] sm:mt-0 sm:rounded-2xl sm:px-7 sm:py-2.5"
                >
                  Tìm kiếm
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="guest-danh-sach-san-pham" className="container mx-auto px-4 mb-20 scroll-mt-24">
          <div className="flex flex-col items-center mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-3 font-display flex flex-wrap items-center justify-center gap-2.5">
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

        <section id="guest-danh-sach-dich-vu" className="container mx-auto px-4 mb-20 scroll-mt-24">
          <div className="flex flex-col items-center mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-3 font-display flex flex-wrap items-center justify-center gap-2.5">
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

        <section id="guest-gioi-thieu" className="container mx-auto px-4 mb-24 scroll-mt-24">
          <div className="bg-emerald-50 rounded-[2.5rem] p-8 lg:p-16 border border-emerald-100 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-4xl mx-auto text-center">
              <h2 className="text-2xl lg:text-3xl font-black text-slate-800 mb-6 font-display">
                Tạp hóa MMO - Chuyên trang thương mại điện tử sản phẩm số
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed mb-10">
                Một sản phẩm từ TINSOFT, ra đời với mục đích thuận tiện và an toàn hơn trong các giao dịch mua bán sản phẩm số. Như các bạn đã biết, tình trạng lừa đảo trên mạng xã hội kéo dài bao năm qua vẫn chưa có dấu hiệu hạ nhiệt. Chúng tôi ở đây để thay đổi điều đó.
              </p>
              <button
                type="button"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200"
              >
                Xem thêm về chúng tôi
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 pt-20 pb-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                  <Store size={18} />
                </div>
                <span className="text-xl font-black text-white tracking-tight font-display">
                  TapHoa<span className="text-emerald-500">MMO</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Nền tảng giao dịch sản phẩm số hàng đầu cho cộng đồng MMO tại Việt Nam. An toàn, uy tín và nhanh chóng.
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"
                  aria-label="Facebook"
                >
                  <Facebook size={20} />
                </button>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"
                  aria-label="Tin nhắn"
                >
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-white font-bold text-lg font-display flex items-center gap-2">
                <Phone size={18} className="text-emerald-500" /> Liên hệ
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="hover:text-emerald-400 cursor-pointer transition-colors">
                  Liên hệ ngay nếu bạn có khó khăn khi sử dụng dịch vụ hoặc cần hợp tác.
                </li>
                <li className="flex items-center gap-2 hover:text-emerald-400 cursor-pointer transition-colors">
                  <MessageSquare size={16} /> Chat với hỗ trợ viên
                </li>
                <li className="flex items-center gap-2 hover:text-emerald-400 cursor-pointer transition-colors">
                  <Facebook size={16} /> Tạp hóa MMO
                </li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-white font-bold text-lg font-display flex items-center gap-2">
                <Info size={18} className="text-emerald-500" /> Thông tin
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="hover:text-emerald-400 cursor-pointer transition-colors">
                  Một ứng dụng nhằm kết nối, trao đổi, mua bán trong cộng đồng kiếm tiền online.
                </li>
                <li className="hover:text-emerald-400 cursor-pointer transition-colors">Thanh toán tự động, nhận hàng ngay tức thì.</li>
                <li className="hover:text-emerald-400 cursor-pointer transition-colors">Câu hỏi thường gặp</li>
                <li className="hover:text-emerald-400 cursor-pointer transition-colors">Điều khoản sử dụng</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h3 className="text-white font-bold text-lg font-display flex items-center gap-2">
                <Store size={18} className="text-emerald-500" /> Đăng ký bán hàng
              </h3>
              <p className="text-sm leading-relaxed">
                Tạo một gian hàng của bạn trên trang của chúng tôi. Đội ngũ hỗ trợ sẽ liên lạc để giúp bạn tối ưu khả năng bán hàng.
              </p>
              <button
                type="button"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.99]"
              >
                Tham gia ngay
              </button>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 text-center text-xs">
            <p>© 2026 TapHoaMMO. All rights reserved. Powered by TinSoft.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
