import { Info, MessageSquare, Phone, Store } from 'lucide-react';
import type { StorefrontInfoTabId } from './StorefrontInfoPage';

export interface StorefrontLandingFooterProps {
  onChatSupport?: () => void;
  onJoinSeller?: () => void;
  onOpenInfo?: (tab: StorefrontInfoTabId) => void;
  /** sticky = đẩy xuống đáy viewport (landing); flow = ngay sau nội dung trang */
  layout?: 'sticky' | 'flow';
}

export function StorefrontLandingFooter({
  onChatSupport,
  onJoinSeller,
  onOpenInfo,
  layout = 'sticky',
}: StorefrontLandingFooterProps) {
  return (
    <footer
      className={`bg-slate-900 text-slate-400 pt-20 pb-10 ${
        layout === 'sticky' ? 'mt-auto' : 'mt-10 border-t border-slate-800/80'
      }`}
    >
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
                onClick={onChatSupport}
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
              <li>
                <button
                  type="button"
                  onClick={onChatSupport}
                  className="flex w-full items-center gap-2 hover:text-emerald-400 cursor-pointer transition-colors text-left"
                >
                  <MessageSquare size={16} /> Chat với hỗ trợ viên
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg font-display flex items-center gap-2">
              <Info size={18} className="text-emerald-500" /> Thông tin
            </h3>
            <ul className="space-y-4 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo?.('about')}
                  className="w-full text-left hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Một ứng dụng nhằm kết nối, trao đổi, mua bán trong cộng đồng kiếm tiền online.
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo?.('payment')}
                  className="w-full text-left hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Thanh toán tự động, nhận hàng ngay tức thì.
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo?.('faq')}
                  className="w-full text-left hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Câu hỏi thường gặp
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo?.('terms')}
                  className="w-full text-left hover:text-emerald-400 cursor-pointer transition-colors"
                >
                  Điều khoản sử dụng
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg font-display flex items-center gap-2">
              <Store size={18} className="text-emerald-500" /> Đăng ký bán hàng
            </h3>
            <p className="text-sm leading-relaxed">
              Tạo một gian hàng của bạn trên trang của chúng tôi. Đội ngũ hỗ trợ sẽ liên lạc để giúp bạn tối ưu khả
              năng bán hàng.
            </p>
            <button
              type="button"
              onClick={onJoinSeller}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.99]"
            >
              Tham gia ngay
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
