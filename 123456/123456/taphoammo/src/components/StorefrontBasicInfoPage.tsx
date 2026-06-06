/**
 * Hồ sơ công khai — thông tin cơ bản (nội dung dưới header storefront).
 */
import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Calendar,
  MessageCircle,
  Shield,
  Star,
  Store,
  User,
  ShoppingBag,
  Package,
  FileText,
  Send,
  Award,
  AlertTriangle,
} from 'lucide-react';
import type { StorefrontBasicProfileData } from '../storefront/storefrontBasicProfile';

export interface StorefrontBasicInfoPageProps {
  profile: StorefrontBasicProfileData;
  isOwnProfile?: boolean;
  /** Nhúng trong trang Thông tin tài khoản — ẩn hồ sơ trùng, chỉ bảng công khai. */
  embedded?: boolean;
  onOpenStores?: () => void;
  onOpenMessages?: () => void;
  onOpenFullAccount?: () => void;
}

type IconTone = 'emerald' | 'sky' | 'teal' | 'violet' | 'amber' | 'rose' | 'slate';

const ICON_TONE_STYLES: Record<IconTone, { box: string; icon: string; hover: string }> = {
  emerald: {
    box: 'bg-emerald-100 text-emerald-600',
    icon: 'text-emerald-600',
    hover: 'group-hover:bg-emerald-200',
  },
  sky: {
    box: 'bg-sky-100 text-sky-600',
    icon: 'text-sky-600',
    hover: 'group-hover:bg-sky-200',
  },
  teal: {
    box: 'bg-teal-100 text-teal-600',
    icon: 'text-teal-600',
    hover: 'group-hover:bg-teal-200',
  },
  violet: {
    box: 'bg-violet-100 text-violet-600',
    icon: 'text-violet-600',
    hover: 'group-hover:bg-violet-200',
  },
  amber: {
    box: 'bg-amber-100 text-amber-600',
    icon: 'text-amber-600',
    hover: 'group-hover:bg-amber-200',
  },
  rose: {
    box: 'bg-rose-100 text-rose-600',
    icon: 'text-rose-600',
    hover: 'group-hover:bg-rose-200',
  },
  slate: {
    box: 'bg-slate-100 text-slate-600',
    icon: 'text-slate-600',
    hover: 'group-hover:bg-slate-200',
  },
};

interface ProfileField {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  tone?: IconTone;
}

function StarRatingDisplay({ value, count }: { value: number; count: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.35;
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={15}
            className={
              i <= full
                ? 'fill-amber-400 text-amber-400'
                : i === full + 1 && half
                  ? 'fill-amber-200 text-amber-400'
                  : 'text-slate-200'
            }
          />
        ))}
      </span>
      <span className="text-[15px] font-bold text-slate-800 tabular-nums">
        {value.toFixed(1)}
        <span className="text-slate-400 font-semibold text-[13px] ml-1">
          ({count.toLocaleString('vi-VN')} đánh giá)
        </span>
      </span>
    </span>
  );
}

function ProfileFieldRow({ icon: Icon, label, value, valueClassName, tone = 'slate' }: ProfileField) {
  const t = ICON_TONE_STYLES[tone];
  return (
    <tr className="group hover:bg-white/90 transition-colors even:bg-white/40">
      <td className="px-6 py-4 w-[42%] align-middle border-b border-emerald-100/60">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${t.box} ${t.hover}`}
          >
            <Icon size={16} strokeWidth={2.25} className={t.icon} />
          </span>
          <span className="text-[13px] font-semibold text-slate-700">{label}</span>
        </div>
      </td>
      <td
        className={`px-6 py-4 text-[14px] font-semibold text-slate-900 align-middle border-b border-emerald-100/60 ${valueClassName ?? ''}`}
      >
        {value}
      </td>
    </tr>
  );
}

export function StorefrontBasicInfoPage({
  profile,
  isOwnProfile = true,
  embedded = false,
  onOpenStores,
  onOpenMessages,
  onOpenFullAccount,
}: StorefrontBasicInfoPageProps) {
  const initial = (profile.displayName || profile.username).charAt(0).toUpperCase() || '?';

  const fields: ProfileField[] = [
    { icon: User, label: 'Tài khoản', value: `@${profile.username}`, tone: 'sky' },
    { icon: Calendar, label: 'Ngày đăng ký', value: profile.registeredAtLabel, tone: 'teal' },
    {
      icon: ShoppingBag,
      label: 'Đã mua',
      value: `${profile.purchasedCount.toLocaleString('vi-VN')} đơn hàng`,
      tone: 'emerald',
    },
    {
      icon: Store,
      label: 'Số gian hàng',
      value: `${profile.gianHangCount.toLocaleString('vi-VN')} gian hàng`,
      valueClassName: 'text-emerald-700',
      tone: 'emerald',
    },
    {
      icon: Package,
      label: 'Đã bán',
      value: `${profile.soldProductCount.toLocaleString('vi-VN')} sản phẩm`,
      valueClassName: 'text-teal-700',
      tone: 'teal',
    },
    {
      icon: FileText,
      label: 'Số bài viết',
      value: `${profile.postCount.toLocaleString('vi-VN')} bài viết`,
      tone: 'slate',
    },
    {
      icon: Send,
      label: 'Kết nối Telegram',
      tone: 'sky',
      value: profile.telegramLinked ? (
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 border border-emerald-200">
          <BadgeCheck size={15} />
          Đã kết nối
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-800 border border-amber-200">
          Chưa kết nối
        </span>
      ),
    },
    {
      icon: Shield,
      label: 'Bảo hiểm gian hàng',
      tone: 'violet',
      value:
        profile.insuranceVnd > 0 ? (
          <span className="inline-flex items-center gap-2 text-violet-800">
            <Shield size={15} className="text-violet-600" />
            {profile.insuranceVnd.toLocaleString('vi-VN')}đ
            <span className="text-[12px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md border border-violet-200">
              Đã xác minh
            </span>
          </span>
        ) : (
          <span className="text-slate-400 font-medium">Chưa áp dụng</span>
        ),
    },
    {
      icon: Award,
      label: 'Đánh giá',
      tone: 'amber',
      value: <StarRatingDisplay value={profile.rating} count={profile.ratingCount} />,
    },
    {
      icon: AlertTriangle,
      label: 'Tỷ lệ khiếu nại',
      tone: 'rose',
      value: `${profile.complaintRatePercent}%`,
      valueClassName:
        profile.complaintRatePercent <= 1
          ? 'text-emerald-700'
          : profile.complaintRatePercent <= 3
            ? 'text-amber-700'
            : 'text-rose-700',
    },
  ];

  const tableSection = (
    <section
      className={`rounded-2xl border border-emerald-100/90 bg-white/80 backdrop-blur-sm shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] overflow-hidden ${embedded ? '' : ''}`}
    >
      <div className="px-6 py-4 border-b border-emerald-100 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-r from-emerald-600/95 to-teal-600/95">
        <div>
          <h3 className="text-[15px] font-bold text-white">Chi tiết tài khoản</h3>
          <p className="text-[12px] text-emerald-50/90 mt-0.5">
            {embedded
              ? 'Hồ sơ công khai — người khác có thể xem khi giao dịch'
              : 'Đồng bộ từ đơn hàng và gian hàng — ai cũng có thể xem hồ sơ này'}
          </p>
        </div>
        <span className="text-[11px] font-bold text-white/90 bg-white/15 px-2.5 py-1 rounded-lg tabular-nums">
          {fields.length} mục
        </span>
      </div>

      <div className="overflow-x-auto bg-gradient-to-b from-emerald-50/30 to-white">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="bg-emerald-50/80 text-left">
              <th className="px-6 py-3 text-[10px] font-bold text-emerald-800/70 uppercase tracking-wider w-[42%]">
                Mục
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-emerald-800/70 uppercase tracking-wider">
                Nội dung
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map(field => (
              <ProfileFieldRow key={field.label} {...field} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const footerSection =
    (profile.gianHangCount > 0 && onOpenStores) || (!embedded && isOwnProfile && onOpenFullAccount) ? (
      <footer className={`flex flex-wrap gap-3 ${embedded ? 'mt-4' : 'mt-6'} justify-end`}>
        {profile.gianHangCount > 0 && onOpenStores ? (
          <button
            type="button"
            onClick={onOpenStores}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[13px] font-bold hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25 transition-all"
          >
            <Store size={16} />
            Xem tất cả gian hàng
          </button>
        ) : null}
        {!embedded && isOwnProfile && onOpenFullAccount ? (
          <button
            type="button"
            onClick={onOpenFullAccount}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-violet-200 bg-violet-50 text-[13px] font-bold text-violet-800 hover:bg-violet-100 transition-colors"
          >
            <User size={16} />
            Chỉnh sửa & bảo mật
          </button>
        ) : null}
      </footer>
    ) : null;

  if (embedded) {
    return (
      <div className="text-slate-900">
        {tableSection}
        {footerSection}
      </div>
    );
  }

  return (
    <div className="relative min-h-[480px]">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-sky-50/90"
        aria-hidden
      />
      <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 bg-teal-200/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" aria-hidden />

      <div className="relative max-w-5xl mx-auto px-6 py-6 text-slate-900">
        <section className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/30 shadow-[0_8px_30px_-8px_rgba(16,185,129,0.25)] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400" />
          <div className="p-6 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-black ring-4 ring-emerald-100 shadow-lg shadow-emerald-500/25">
                    {initial}
                  </div>
                  <span className="absolute -bottom-2 -right-2 min-w-[2rem] h-7 px-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-[10px] font-black text-white border-2 border-white shadow-md flex items-center justify-center">
                    LV{profile.level}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 truncate">@{profile.username}</h2>
                    {profile.isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold border border-sky-200">
                        <BadgeCheck size={12} />
                        Xác minh
                      </span>
                    ) : null}
                    {profile.insuranceVerified ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-bold border border-violet-200">
                        <Shield size={12} />
                        Bảo hiểm
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[14px] text-slate-700 font-medium mt-0.5">{profile.displayName}</p>
                  <p className="text-[12px] mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100/80 border border-emerald-200/80 px-3 py-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="font-bold text-emerald-800">Đang hoạt động</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 lg:justify-end shrink-0">
                <button
                  type="button"
                  onClick={onOpenStores}
                  className="inline-flex items-center justify-center gap-2 min-w-[120px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[13px] font-bold hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/30 transition-all"
                >
                  <Store size={16} />
                  Gian hàng
                </button>
                <button
                  type="button"
                  onClick={onOpenMessages}
                  className="inline-flex items-center justify-center gap-2 min-w-[120px] px-5 py-2.5 rounded-xl bg-white border-2 border-sky-200 text-sky-800 text-[13px] font-bold hover:bg-sky-50 hover:border-sky-300 transition-colors shadow-sm"
                >
                  <MessageCircle size={16} />
                  Nhắn tin
                </button>
              </div>
            </div>
          </div>
        </section>

        {tableSection}
        {footerSection}
      </div>
    </div>
  );
}
