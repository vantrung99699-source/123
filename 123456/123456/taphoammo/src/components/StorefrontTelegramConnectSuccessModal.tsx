import { Bell, CheckCircle2, Lock, MessageCircle, Shield, X } from 'lucide-react';

export interface StorefrontTelegramConnectSuccessModalProps {
  open: boolean;
  onClose: () => void;
  showSellerOrderHint?: boolean;
}

export function StorefrontTelegramConnectSuccessModal({
  open,
  onClose,
  showSellerOrderHint = false,
}: StorefrontTelegramConnectSuccessModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="telegram-success-title"
      >
        <div className="px-6 py-4 flex items-center justify-between bg-gradient-to-r from-[#2AABEE] to-[#229ED9]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} className="text-white" />
            </div>
            <h3 id="telegram-success-title" className="text-[15px] font-black text-white">
              Kết nối Telegram thành công
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Tài khoản đã liên kết <span className="font-bold text-slate-800">@TaphoaMMO_bot</span>.
            Các loại thông báo sau sẽ được gửi qua Telegram:
          </p>

          <div className="space-y-2.5">
            <div className="flex gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-3.5 py-3">
              <MessageCircle size={18} className="shrink-0 text-[#229ED9] mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-bold text-slate-800">Tin nhắn mới</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Lock size={9} aria-hidden />
                    Bắt buộc
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Thông báo khi có tin nhắn từ người mua, người bán hoặc hỗ trợ sàn — không thể tắt.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-xl border border-violet-100 bg-violet-50/80 px-3.5 py-3">
              <Shield size={18} className="shrink-0 text-violet-600 mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-bold text-slate-800">Thông báo từ admin</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Lock size={9} aria-hidden />
                    Bắt buộc
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Cập nhật quan trọng từ sàn: bảo trì, chính sách, xử lý khiếu nại, cảnh báo tài khoản…
                </p>
              </div>
            </div>

            {showSellerOrderHint && (
              <div className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
                <Bell size={18} className="shrink-0 text-emerald-600 mt-0.5" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-slate-800">Thông báo đơn hàng mới</p>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Người bán có thể bật hoặc tắt trong mục cài đặt Telegram bên dưới.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-bold transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
