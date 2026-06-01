/**
 * Chi tiết đơn hàng dịch vụ — layout tham chiếu màn quản lý (stepper + banner).
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  Check,
  Headphones,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { Order, OrderStatus } from './ordersTypes';
import { formatServiceDeadlineRemainingLabel } from './storefront/serviceOrderAutoFail';
import { clampDeliveryDeadlineDays } from './storefront/deliveryDeadlineDays';

function serviceStatusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'Hoàn thành':
      return 'bg-[#4caf50] text-white border-transparent';
    case 'Đang thực hiện':
      return 'bg-[#42a5f5] text-white border-transparent';
    case 'Thất bại':
      return 'bg-[#1c2331] text-white border-transparent';
    case 'Khiếu nại':
    case 'Tranh chấp':
      return 'bg-[#ef5350] text-white border-transparent';
    case 'Chờ xác nhận':
      return 'bg-[#ffb300] text-amber-900 border-transparent';
    case 'Tạm giữ tiền':
      return 'bg-[#2d6a61] text-white border-transparent';
    default:
      return 'bg-slate-500 text-white border-transparent';
  }
}

function serviceStepState(status: OrderStatus) {
  if (status === 'Chờ xác nhận') {
    return { step1: 'done' as const, step2: 'current' as const, step3: 'todo' as const };
  }
  if (status === 'Hoàn thành' || status === 'Tạm giữ tiền') {
    return { step1: 'done' as const, step2: 'done' as const, step3: 'done' as const };
  }
  if (status === 'Thất bại') {
    return { step1: 'done' as const, step2: 'todo' as const, step3: 'todo' as const };
  }
  return { step1: 'done' as const, step2: 'done' as const, step3: 'current' as const };
}

function StepDot({
  n,
  label,
  state,
}: {
  n: number;
  label: string;
  state: 'done' | 'current' | 'todo';
}) {
  const circle =
    state === 'done'
      ? 'bg-emerald-500 text-white border-emerald-600 ring-4 ring-emerald-500/20'
      : state === 'current'
        ? 'bg-white text-slate-700 border-2 border-slate-300 ring-4 ring-slate-200/80'
        : 'bg-slate-100 text-slate-400 border border-slate-200';
  return (
    <div className="flex flex-col items-center gap-2 min-w-[88px] z-[1]">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black ${circle}`}>{n}</div>
      <span className={`text-[10px] font-bold uppercase tracking-wide text-center ${state === 'todo' ? 'text-slate-400' : 'text-slate-700'}`}>
        {label}
      </span>
    </div>
  );
}

export function ServiceOrderDetailView({
  order,
  onBack,
  variant = 'seller',
  onAcceptServiceOrder,
  onDeliverServiceOrder,
  onCancelServiceProcessing,
}: {
  order: Order;
  onBack: () => void;
  /** Người mua: chỉ xem tiến độ + chi tiết, không thao tác shop. */
  variant?: 'seller' | 'buyer';
  onAcceptServiceOrder?: (orderId: string) => void;
  onDeliverServiceOrder?: (orderId: string, deliveryContent: string) => void;
  /** Hủy đơn dịch vụ → `Thất bại` khi đơn ở trạng thái Chờ xác nhận hoặc Đang thực hiện. */
  onCancelServiceProcessing?: (orderId: string) => void;
}) {
  const isBuyerView = variant === 'buyer';
  const showSellerActions = !isBuyerView;
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [deliveryDraft, setDeliveryDraft] = useState(order.deliveryContent ?? '');
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const steps = serviceStepState(order.status);

  useEffect(() => {
    setDeliveryDraft(order.deliveryContent ?? '');
    setDeliveryError(null);
  }, [order.id, order.deliveryContent, order.status]);
  const platformLabel = order.categoryName?.toUpperCase() || 'DỊCH VỤ';
  const requestSnippet =
    order.content?.trim() ||
    '— Chưa có nội dung yêu cầu (đơn tạo trước khi bổ sung form).';
  const resellerDisplay = order.resellerFee && order.resellerFee !== '0đ' ? order.resellerFee : order.reseller || '0';

  const leftBlurb = isBuyerView
    ? order.status === 'Chờ xác nhận'
      ? 'Đơn dịch vụ đã được tạo — shop sẽ xác nhận và thực hiện (vd. tăng like, follow…)'
      : order.status === 'Đang thực hiện'
        ? 'Shop đang thực hiện dịch vụ cho bạn'
        : order.status === 'Tạm giữ tiền'
          ? 'Dịch vụ đã giao — xem nội dung bên phải'
          : order.status === 'Hoàn thành'
            ? 'Dịch vụ đã hoàn tất'
            : 'Theo dõi tiến độ đơn dịch vụ bên dưới'
    : order.status === 'Chờ xác nhận'
      ? 'Đơn hàng đang đợi chủ shop xác nhận'
      : order.status === 'Đang thực hiện'
        ? 'Đơn hàng đang được tiến hành'
        : order.status === 'Tạm giữ tiền'
          ? 'Đã giao nội dung — tiền đang tạm giữ chờ xác nhận / hoàn tất.'
          : order.status === 'Tranh chấp'
            ? 'Đơn hàng đang trong quá trình tranh chấp — vui lòng phối hợp xử lý với sàn.'
            : order.status === 'Khiếu nại'
              ? 'Đơn hàng có khiếu nại từ một trong hai bên.'
              : order.status === 'Hoàn thành'
                ? 'Đơn đã hoàn tất theo thỏa thuận dịch vụ.'
                : 'Theo dõi tiến độ thực hiện dịch vụ bên dưới.';

  const serviceDeadlineHint = formatServiceDeadlineRemainingLabel(order);
  const serviceDeadlineDays = clampDeliveryDeadlineDays(order.deliveryDeadlineDays ?? 7);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
      {/* Ảnh 3 — header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-full border border-slate-200 text-slate-600 transition-colors shrink-0" aria-label="Quay lại">
            <ChevronLeft size={22} />
          </button>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Đơn hàng #{order.id}</h2>
            <span className={`shrink-0 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wide ${serviceStatusBadgeClass(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2"
          >
            <Headphones size={16} className="text-slate-500" />
            Liên hệ hỗ trợ
          </button>
        </div>
      </div>

      {/* Stepper + hai cột */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-8 py-6 border-b border-slate-100 bg-slate-50/40">
          <div className="relative flex items-start justify-center gap-0 sm:gap-4 max-w-2xl mx-auto">
            <div className="hidden sm:block absolute top-[18px] left-[15%] right-[15%] h-1 rounded-full bg-slate-200 z-0 overflow-hidden" aria-hidden>
              <motion.div
                className="h-full bg-emerald-400 rounded-full"
                initial={false}
                animate={{
                  width:
                    steps.step3 === 'done'
                      ? '100%'
                      : steps.step2 === 'done'
                        ? '50%'
                        : '0%',
                }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </div>
            <StepDot n={1} label="Đặt hàng" state={steps.step1} />
            <StepDot n={2} label="Xác nhận" state={steps.step2} />
            <StepDot n={3} label="Giao hàng" state={steps.step3} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-slate-100">
          <div className="p-6 sm:p-8 flex flex-col items-center text-center border-b lg:border-b-0 border-slate-100">
            {order.status === 'Hoàn thành' ? (
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" strokeWidth={1.25} />
            ) : order.status === 'Tạm giữ tiền' ? (
              <CheckCircle2 className="w-16 h-16 text-[#2d6a61] mb-4" strokeWidth={1.25} />
            ) : order.status === 'Đang thực hiện' ? (
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/35">
                <Check className="w-8 h-8 text-white" strokeWidth={3} aria-hidden />
              </div>
            ) : order.status === 'Tranh chấp' || order.status === 'Khiếu nại' ? (
              <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" strokeWidth={1.25} />
            ) : (
              <Clock className="w-16 h-16 text-slate-300 mb-4" strokeWidth={1.25} />
            )}
            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border mb-2 ${serviceStatusBadgeClass(order.status)}`}>{order.status}</span>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed px-1">{leftBlurb}</p>
            {serviceDeadlineHint &&
              (order.status === 'Chờ xác nhận' || order.status === 'Đang thực hiện') && (
                <p className="text-xs font-semibold text-violet-800 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 max-w-md mt-3">
                  Hạn tối đa {serviceDeadlineDays} ngày — {serviceDeadlineHint}
                </p>
              )}
            {showSellerActions && order.status === 'Chờ xác nhận' && (
              <div className="flex flex-wrap gap-3 mt-6 w-full max-w-sm justify-center">
                <button
                  type="button"
                  onClick={() => setAcceptModalOpen(true)}
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                >
                  Chấp nhận
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined' && !window.confirm('Hủy đơn hàng này?')) return;
                    onCancelServiceProcessing?.(order.id);
                  }}
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
                >
                  Hủy đơn
                </button>
              </div>
            )}
            {isBuyerView && order.deliveryContent && (
              <div className="mt-6 w-full max-w-md text-left space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kết quả / nội dung từ shop</p>
                <div className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 whitespace-pre-wrap leading-relaxed">
                  {order.deliveryContent}
                </div>
              </div>
            )}
            {showSellerActions && order.status === 'Đang thực hiện' && (
              <div className="mt-6 w-full max-w-md text-left space-y-2">
                <label htmlFor="service-delivery-content" className="block text-xs font-bold text-slate-700">
                  Nội dung giao hàng:
                </label>
                <textarea
                  id="service-delivery-content"
                  rows={5}
                  value={deliveryDraft}
                  onChange={(e) => {
                    setDeliveryDraft(e.target.value);
                    if (deliveryError) setDeliveryError(null);
                  }}
                  placeholder="Nhập nội dung / bằng chứng đã giao dịch vụ cho người mua…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 resize-y min-h-[120px]"
                />
                {deliveryError && <p className="text-xs font-semibold text-red-600">{deliveryError}</p>}
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const t = deliveryDraft.trim();
                      if (!t) {
                        setDeliveryError('Vui lòng nhập nội dung giao hàng.');
                        return;
                      }
                      setDeliveryError(null);
                      onDeliverServiceOrder?.(order.id, t);
                    }}
                    className="min-w-[120px] flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
                  >
                    Giao hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && !window.confirm('Hủy đơn hàng này?')) return;
                      onCancelServiceProcessing?.(order.id);
                    }}
                    className="min-w-[120px] flex-1 py-2.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors"
                  >
                    Hủy đơn
                  </button>
                </div>
              </div>
            )}
            {(order.status === 'Tạm giữ tiền' || order.status === 'Hoàn thành') &&
              order.deliveryContent &&
              showSellerActions && (
              <div className="mt-6 w-full max-w-md text-left space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nội dung đã giao</p>
                <div className="text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 whitespace-pre-wrap leading-relaxed">
                  {order.deliveryContent}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            {!isBuyerView && (
              <div className="flex gap-2 text-red-600">
                <Clock size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Bên mua yêu cầu hoàn thành trong 7 ngày</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    *Tính từ ngày tạo đơn, quá thời gian đơn hàng sẽ tự hủy và hoàn tiền.
                  </p>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Chi tiết yêu cầu:</p>
              <p className="text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 whitespace-pre-wrap leading-relaxed">
                {requestSnippet}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
              <table className="w-full text-xs border-collapse table-fixed">
                <colgroup>
                  <col className="w-[38%] sm:w-[34%]" />
                  <col />
                </colgroup>
                <tbody className="text-slate-800">
                  <tr className="border-b border-slate-200">
                    <th
                      scope="row"
                      className="align-top px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200"
                    >
                      Số lượng
                    </th>
                    <td className="align-top px-3 py-2.5 font-semibold text-slate-900 tabular-nums">{order.quantity}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th
                      scope="row"
                      className="align-top px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200"
                    >
                      Giá
                    </th>
                    <td className="align-top px-3 py-2.5 font-semibold text-slate-900 tabular-nums">{order.unitPrice}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th
                      scope="row"
                      className="align-top px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200"
                    >
                      Mặt hàng
                    </th>
                    <td className="align-top px-3 py-2.5">
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5 tracking-wide">{platformLabel}</span>
                      <span className="text-slate-800 font-medium leading-snug">{order.productName}</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th
                      scope="row"
                      className="align-top px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200"
                    >
                      Người mua
                    </th>
                    <td className="align-top px-3 py-2.5">
                      <button type="button" className="font-bold text-blue-600 hover:underline text-left">
                        {order.buyerName}
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th
                      scope="row"
                      className="align-top px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200"
                    >
                      Ngày đặt
                    </th>
                    <td className="align-top px-3 py-2.5 text-slate-700 tabular-nums">{order.purchaseDate}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th
                      scope="row"
                      className="align-top px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200"
                    >
                      Giảm
                    </th>
                    <td className="align-top px-3 py-2.5 tabular-nums">{order.discount || '—'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th
                      scope="row"
                      className="align-top px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200"
                    >
                      Reseller
                    </th>
                    <td className="align-top px-3 py-2.5 tabular-nums">{resellerDisplay}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <th
                      scope="row"
                      className="align-top px-3 py-2.5 text-left text-[11px] font-bold text-slate-500 bg-slate-50 border-r border-slate-200"
                    >
                      Hoàn tiền
                    </th>
                    <td className="align-top px-3 py-2.5 tabular-nums">
                      {order.refund && order.refund !== '0đ' ? order.refund : '—'}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/80">
                    <th
                      scope="row"
                      className="align-top px-3 py-3 text-left text-[11px] font-bold text-slate-600 bg-slate-100/90 border-r border-slate-200"
                    >
                      Tổng thanh toán
                    </th>
                    <td className="align-top px-3 py-3">
                      <span className="text-sm font-black text-slate-900 tabular-nums tracking-tight">{order.totalAmount}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSellerActions && acceptModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              role="presentation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px] cursor-pointer"
              onClick={() => setAcceptModalOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="accept-order-title"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-300/40 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 bg-slate-50/80">
                <div>
                  <h3 id="accept-order-title" className="text-base font-bold text-slate-900">
                    Chấp nhận đơn hàng
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono font-semibold">{order.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAcceptModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-700 transition-colors shrink-0"
                  aria-label="Đóng hộp thoại"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-3 text-sm text-slate-600 leading-relaxed">
                <p>
                  Bạn xác nhận <span className="font-semibold text-slate-800">chấp nhận</span> đơn dịch vụ này? Sau khi xác nhận, đơn chuyển sang trạng thái{' '}
                  <span className="font-bold text-sky-700">Đang thực hiện</span> và bước <span className="font-bold text-emerald-600">Xác nhận</span> trên tiến trình sẽ hoàn tất.
                </p>
                <p className="text-xs text-slate-500">Người mua: {order.buyerName} · {order.productName}</p>
              </div>
              <div className="flex gap-3 p-5 pt-0">
                <button
                  type="button"
                  onClick={() => setAcceptModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAcceptServiceOrder?.(order.id);
                    setAcceptModalOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/25 transition-colors"
                >
                  Xác nhận chấp nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
