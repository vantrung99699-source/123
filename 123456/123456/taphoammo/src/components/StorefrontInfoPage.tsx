import { useState } from 'react';
import {
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  ShieldCheck,
  Store,
  Zap,
} from 'lucide-react';

export type StorefrontInfoTabId = 'about' | 'payment' | 'faq' | 'terms';

export const STOREFRONT_INFO_TAB_LABELS: Record<StorefrontInfoTabId, string> = {
  about: 'Giới thiệu',
  payment: 'Thanh toán & giao hàng',
  faq: 'Câu hỏi thường gặp',
  terms: 'Điều khoản sử dụng',
};

const INFO_TABS: StorefrontInfoTabId[] = ['about', 'payment', 'faq', 'terms'];

const FAQ_ITEMS = [
  {
    q: 'TapHoaMMO là gì?',
    a: 'TapHoaMMO là nền tảng giao dịch sản phẩm số dành cho cộng đồng kiếm tiền online (MMO) tại Việt Nam. Bạn có thể mua bán tài khoản, phần mềm, dịch vụ tương tác và nhiều sản phẩm số khác trong một môi trường được quản lý minh bạch.',
  },
  {
    q: 'Làm sao để mua hàng trên TapHoaMMO?',
    a: 'Đăng ký tài khoản, nạp số dư ví (nếu cần), chọn sản phẩm tại gian hàng, thanh toán và nhận hàng tự động ngay sau khi giao dịch thành công. Bạn có thể theo dõi đơn hàng trong mục Đơn hàng của tôi.',
  },
  {
    q: 'Thanh toán có an toàn không?',
    a: 'Hệ thống giữ tiền trong quá trình giao dịch và chỉ giải ngân cho người bán khi đơn hàng được xác nhận hoàn tất. Mọi giao dịch đều được ghi nhận trong lịch sử thanh toán để bạn đối soát.',
  },
  {
    q: 'Khi nào tôi có thể gửi khiếu nại?',
    a: 'Bạn có thể khiếu nại khi đơn hàng đang ở trạng thái «Tạm giữ tiền» hoặc «Đang thực hiện» — thường là sau khi nhận hàng nhưng phát hiện sai nội dung, không dùng được, thiếu số lượng hoặc không đúng mô tả. Đơn đặt trước chưa giao hàng, đơn đã khiếu nại/tranh chấp hoặc đã hoàn tất thì không gửi thêm được.',
  },
  {
    q: 'Làm sao để gửi khiếu nại đơn hàng?',
    a: 'Vào «Đơn hàng của tôi» → chọn đơn cần khiếu nại → nhấn nút Khiếu nại → mô tả rõ lý do (kèm bằng chứng nếu có: ảnh, video, nội dung lỗi). Sau khi gửi, đơn chuyển sang trạng thái «Khiếu nại», người bán và hệ thống được thông báo để xử lý. Bạn cũng có thể chat với người bán hoặc hỗ trợ viên trong lúc chờ.',
  },
  {
    q: 'Mỗi đơn hàng được khiếu nại bao nhiêu lần?',
    a: 'Mỗi đơn chỉ được khiếu nại một lần duy nhất. Nếu bạn đã gửi khiếu nại rồi (kể cả khi sau đó hủy khiếu nại), hệ thống sẽ không cho gửi lại. Hãy mô tả đầy đủ lý do ngay từ lần đầu và giữ bằng chứng liên quan.',
  },
  {
    q: 'Khiếu nại và tranh chấp khác nhau như thế nào?',
    a: '«Khiếu nại» là bước đầu khi người mua báo sự cố — tiền vẫn được tạm giữ, hai bên trao đổi để tìm hướng xử lý. «Tranh chấp» là giai đoạn leo thang khi chưa thống nhất được (thường do người bán/admin chuyển đơn sang tranh chấp). Lúc này TapHoaMMO can thiệp sâu hơn để đối soát bằng chứng và quyết định cuối cùng.',
  },
  {
    q: 'Người bán xử lý khiếu nại như thế nào?',
    a: 'Khi nhận khiếu nại, người bán có thể đề xuất: (1) Hoàn tiền toàn phần hoặc một phần số lượng lỗi; (2) Bảo hành — giao lại sản phẩm/dịch vụ thay thế; (3) Chuyển sang «Tranh chấp» nếu không đồng ý với yêu cầu của người mua. Người mua sẽ nhận thông báo và có thể chấp nhận hoặc từ chối đề xuất trong đơn hàng.',
  },
  {
    q: 'Tôi có thể hủy khiếu nại không?',
    a: 'Có. Trong thời gian đơn đang «Khiếu nại», bạn có thể hủy khiếu nại nếu đã thỏa thuận xong với người bán hoặc phát hiện nhầm lẫn. Đơn sẽ trở về trạng thái trước đó (thường là «Tạm giữ tiền»). Lưu ý: hủy khiếu nại không mở lại quyền khiếu nại lần hai cho cùng đơn hàng.',
  },
  {
    q: 'Nếu khiếu nại hoặc tranh chấp kéo dài quá lâu thì sao?',
    a: 'Nếu đơn ở trạng thái «Khiếu nại» quá 3 ngày mà người mua không hủy khiếu nại, hệ thống có thể tự động chuyển đơn sang «Thất bại» và hoàn 100% số tiền vào ví. Tương tự, «Tranh chấp» quá 3 ngày không được xử lý dứt điểm cũng có thể dẫn đến hoàn tiền tự động cho người mua. Thời hạn được hiển thị trên đơn hàng để bạn theo dõi.',
  },
  {
    q: 'Tôi nhận hàng sai hoặc lỗi — cần chuẩn bị gì khi khiếu nại?',
    a: 'Chụp màn hình hoặc quay video lỗi ngay khi phát hiện, ghi rõ thời gian và nội dung đơn hàng. Không tự ý đổi mật khẩu/email tài khoản đã mua nếu shop yêu cầu giữ nguyên để đối chiếu bảo hành. Gửi khiếu nại kèm mô tả cụ thể; nếu cần, liên hệ Chat hỗ trợ để được hướng dẫn thêm.',
  },
  {
    q: 'Làm thế nào để đăng ký bán hàng?',
    a: 'Nhấn Đăng ký bán hàng, điền thông tin liên hệ và kết nối Telegram. Sau khi được duyệt, bạn có thể tạo gian hàng, đăng sản phẩm và bắt đầu kinh doanh trên nền tảng.',
  },
  {
    q: 'Phí dịch vụ và rút tiền được tính như thế nào?',
    a: 'Phí giao dịch và chính sách rút tiền được công bố trong mục Cài đặt gian hàng và Điều khoản sử dụng. Vui lòng đọc kỹ trước khi đăng bán để tránh hiểu nhầm.',
  },
];

export interface StorefrontInfoPageProps {
  initialTab?: StorefrontInfoTabId;
  onTabChange?: (tab: StorefrontInfoTabId) => void;
  /** Bù khoảng trống header guest cố định (top bar + navbar). */
  fixedHeaderOffset?: boolean;
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
      >
        <span className="font-semibold text-slate-900 text-sm sm:text-base">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

function AboutContent() {
  return (
    <div className="space-y-6 text-slate-700 leading-relaxed">
      <p className="text-base sm:text-lg text-slate-800">
        <strong className="text-slate-900">TapHoaMMO</strong> là một ứng dụng nhằm kết nối, trao đổi, mua bán trong
        cộng đồng kiếm tiền online — nơi người mua và người bán gặp nhau trên cùng một nền tảng uy tín.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          {
            icon: Store,
            title: 'Gian hàng đa dạng',
            desc: 'Sản phẩm số, phần mềm, tài khoản và dịch vụ MMO từ nhiều nhà cung cấp được xác minh.',
          },
          {
            icon: ShieldCheck,
            title: 'Giao dịch an toàn',
            desc: 'Quy trình giám sát đơn hàng, hỗ trợ khiếu nại và chính sách bảo vệ người dùng.',
          },
          {
            icon: Zap,
            title: 'Nhanh & tiện lợi',
            desc: 'Giao diện thân thiện, tìm kiếm gian hàng và sản phẩm chỉ vài thao tác.',
          },
        ].map(item => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/60 p-5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <item.icon size={20} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
            <p className="text-sm">{item.desc}</p>
          </div>
        ))}
      </div>
      <p className="text-sm">
        Chúng tôi không ngừng cải thiện trải nghiệm để cộng đồng MMO Việt Nam có thể kinh doanh và mua sắm minh bạch,
        hiệu quả hơn mỗi ngày.
      </p>
    </div>
  );
}

function PaymentContent() {
  return (
    <div className="space-y-6 text-slate-700 leading-relaxed">
      <p className="text-base sm:text-lg text-slate-800">
        <strong className="text-slate-900">Thanh toán tự động, nhận hàng ngay tức thì</strong> — đây là cam kết cốt lõi
        của TapHoaMMO đối với mọi giao dịch sản phẩm số trên nền tảng.
      </p>
      <ol className="space-y-4">
        {[
          'Bạn chọn sản phẩm và xác nhận thanh toán bằng số dư ví TapHoaMMO.',
          'Hệ thống tự động xử lý đơn hàng và giao nội dung sản phẩm (mã, tài khoản, file hoặc hướng dẫn) ngay sau khi thanh toán thành công.',
          'Đơn hàng được lưu trong mục Đơn hàng của tôi để bạn tra cứu, sao chép hoặc khiếu nại khi cần.',
          'Người bán nhận tiền theo chu kỳ đối soát sau khi đơn hàng hoàn tất, đảm bảo công bằng cho cả hai bên.',
        ].map((step, i) => (
          <li key={step} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="text-sm sm:text-base pt-1">{step}</span>
          </li>
        ))}
      </ol>
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-5 py-4 flex gap-3">
        <CreditCard size={22} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-900">
          Mọi giao dịch đều có lịch sử thanh toán minh bạch. Nếu gặp sự cố, hãy liên hệ hỗ trợ viên ngay để được xử lý
          ưu tiên.
        </p>
      </div>
    </div>
  );
}

function FaqContent() {
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map(item => (
        <FaqItem key={item.q} question={item.q} answer={item.a} />
      ))}
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-5 text-sm sm:text-base text-slate-700 leading-relaxed">
      <p>
        Bằng việc sử dụng TapHoaMMO, bạn đồng ý tuân thủ các điều khoản dưới đây. Vui lòng đọc kỹ trước khi đăng ký
        tài khoản, mua hàng hoặc mở gian hàng.
      </p>
      {[
        {
          title: '1. Tài khoản người dùng',
          body: 'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập. Mọi hoạt động phát sinh từ tài khoản được coi là do chủ tài khoản thực hiện. Cung cấp thông tin sai lệch có thể dẫn đến khóa tài khoản.',
        },
        {
          title: '2. Giao dịch & thanh toán',
          body: 'Giá sản phẩm do người bán niêm yết; TapHoaMMO đóng vai trò trung gian xử lý thanh toán và đơn hàng. Khiếu nại cần được gửi trong thời hạn quy định kèm bằng chứng hợp lệ.',
        },
        {
          title: '3. Nội dung & hành vi bị cấm',
          body: 'Nghiêm cấm đăng bán sản phẩm/dịch vụ vi phạm pháp luật, lừa đảo, phát tán mã độc hoặc xâm phạm quyền của bên thứ ba. Vi phạm sẽ bị gỡ bỏ nội dung và có thể bị khóa vĩnh viễn.',
        },
        {
          title: '4. Trách nhiệm người bán',
          body: 'Người bán cam kết mô tả sản phẩm trung thực, giao đúng hàng và hỗ trợ người mua trong phạm vi cam kết. Gian hàng không hoạt động hoặc vi phạm nhiều lần có thể bị tạm ngưng.',
        },
        {
          title: '5. Thay đổi điều khoản',
          body: 'TapHoaMMO có quyền cập nhật điều khoản để phù hợp quy định pháp luật và vận hành nền tảng. Phiên bản mới có hiệu lực khi được công bố trên trang Thông tin.',
        },
      ].map(section => (
        <section key={section.title} className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-2">{section.title}</h3>
          <p>{section.body}</p>
        </section>
      ))}
    </div>
  );
}

const TAB_ICONS: Record<StorefrontInfoTabId, typeof Store> = {
  about: Store,
  payment: CreditCard,
  faq: HelpCircle,
  terms: FileText,
};

export function StorefrontInfoPage({
  initialTab = 'about',
  onTabChange,
  fixedHeaderOffset = false,
}: StorefrontInfoPageProps) {
  const [activeTab, setActiveTab] = useState<StorefrontInfoTabId>(initialTab);

  const selectTab = (tab: StorefrontInfoTabId) => {
    setActiveTab(tab);
    onTabChange?.(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 font-sans ${fixedHeaderOffset ? 'pt-[6.75rem]' : 'pt-6 sm:pt-8'}`}
    >
      <div className="bg-gradient-to-b from-emerald-50/80 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Store size={22} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900">
              Thông tin <span className="text-emerald-600">TapHoaMMO</span>
            </h1>
          </div>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
            Tìm hiểu về nền tảng, quy trình thanh toán, câu hỏi thường gặp và điều khoản sử dụng.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-white border border-slate-200/80 shadow-lg shadow-slate-200/40 mb-8">
          {INFO_TABS.map(tab => {
            const Icon = TAB_ICONS[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => selectTab(tab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{STOREFRONT_INFO_TAB_LABELS[tab]}</span>
                <span className="sm:hidden">
                  {tab === 'about'
                    ? 'Giới thiệu'
                    : tab === 'payment'
                      ? 'Thanh toán'
                      : tab === 'faq'
                        ? 'FAQ'
                        : 'Điều khoản'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 font-display mb-6 flex items-center gap-2">
            {(() => {
              const Icon = TAB_ICONS[activeTab];
              return <Icon size={22} className="text-emerald-500" />;
            })()}
            {STOREFRONT_INFO_TAB_LABELS[activeTab]}
          </h2>
          {activeTab === 'about' && <AboutContent />}
          {activeTab === 'payment' && <PaymentContent />}
          {activeTab === 'faq' && <FaqContent />}
          {activeTab === 'terms' && <TermsContent />}
        </div>
      </div>
    </div>
  );
}
