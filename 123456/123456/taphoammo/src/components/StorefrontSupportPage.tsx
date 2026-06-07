import {
  Clock,
  CreditCard,
  Headphones,
  HelpCircle,
  MessageCircle,
  Package,
  Shield,
  User,
} from 'lucide-react';
import {
  TAPHOAMMO_PLATFORM_CHAT_LABEL,
  TAPHOAMMO_SUPPORT_DISPLAY_NAME,
} from '../storefront/sellerRegistrationApprovalNotify';

const HELP_TOPICS = [
  {
    icon: Package,
    title: 'Đơn hàng & giao hàng',
    desc: 'Theo dõi đơn, nhận hàng tự động, đặt trước và trạng thái thanh toán.',
    color: 'text-sky-600 bg-sky-50 border-sky-100',
  },
  {
    icon: Shield,
    title: 'Khiếu nại & tranh chấp',
    desc: 'Hướng dẫn gửi khiếu nại, bằng chứng và quy trình xử lý với người bán.',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  {
    icon: User,
    title: 'Tài khoản & bảo mật',
    desc: 'Đăng nhập, 2FA, kết nối Telegram và quản lý phiên thiết bị.',
    color: 'text-violet-600 bg-violet-50 border-violet-100',
  },
  {
    icon: CreditCard,
    title: 'Nạp tiền & rút tiền',
    desc: 'Số dư ví, lịch sử giao dịch, phí dịch vụ và thời gian xử lý rút.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
];

export interface StorefrontSupportPageProps {
  isLoggedIn?: boolean;
  onOpenSupportChat: () => void;
  onRequireLogin?: () => void;
  onOpenFaqs?: () => void;
  fixedHeaderOffset?: boolean;
}

export function StorefrontSupportPage({
  isLoggedIn = false,
  onOpenSupportChat,
  onRequireLogin,
  onOpenFaqs,
  fixedHeaderOffset = false,
}: StorefrontSupportPageProps) {
  const handleChat = () => {
    if (isLoggedIn) {
      onOpenSupportChat();
      return;
    }
    onRequireLogin?.();
  };

  return (
    <div
      className={`min-h-screen bg-slate-100 ${fixedHeaderOffset ? 'pt-[6.75rem]' : ''}`}
    >
      <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white">
        <div className="max-w-4xl mx-auto px-6 py-10 sm:py-14">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
              <Headphones size={28} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Hỗ trợ</h1>
              <p className="text-sm sm:text-base text-emerald-50/95 mt-2 max-w-2xl leading-relaxed">
                Trung tâm hỗ trợ TapHoaMMO — nhắn tin trực tiếp với đội ngũ sàn về giao dịch, khiếu nại
                và tài khoản.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
              <MessageCircle size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-slate-900">{TAPHOAMMO_PLATFORM_CHAT_LABEL}</p>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Trao đổi với <span className="font-bold text-emerald-700">{TAPHOAMMO_SUPPORT_DISPLAY_NAME}</span>{' '}
                — cùng kênh nhắn tin hỗ trợ như trong mục Nhắn tin.
              </p>
              {!isLoggedIn && (
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3 leading-relaxed">
                  Đăng nhập để mở hội thoại và gửi tin nhắn cho bộ phận hỗ trợ.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleChat}
              className="shrink-0 w-full sm:w-auto px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors shadow-md shadow-emerald-600/20"
            >
              {isLoggedIn ? 'Nhắn tin hỗ trợ' : 'Đăng nhập để chat'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HELP_TOPICS.map(topic => (
            <div
              key={topic.title}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${topic.color}`}
              >
                <topic.icon size={18} />
              </div>
              <p className="text-[14px] font-bold text-slate-800">{topic.title}</p>
              <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">{topic.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-800">Thời gian phản hồi</p>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                Hỗ trợ trực tuyến 08:00 – 22:00 (GMT+7), mỗi ngày. Tin nhắn ngoài giờ sẽ được xử lý ưu tiên
                vào phiên làm việc tiếp theo.
              </p>
            </div>
          </div>
          {onOpenFaqs && (
            <button
              type="button"
              onClick={onOpenFaqs}
              className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[13px] font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <HelpCircle size={16} />
              Xem FAQ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
