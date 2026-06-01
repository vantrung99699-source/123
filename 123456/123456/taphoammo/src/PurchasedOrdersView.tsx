import React, { useState, useEffect } from 'react';
import {
  Filter,
  Package,
  Search,
  ChevronDown,
  MessageCircle,
  Star,
  MessageSquareX,
  ShieldX,
  XCircle,
  Calendar,
  Facebook,
  Music,
  Globe,
  Folder,
  X,
  AlertCircle,
  User,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Order } from './ordersTypes';
import { patchWhenCancellingComplaint, patchWhenEnteringComplaint } from './storefront/complaintAutoFail';
import { fastForwardOrderTimeThreeDays, getFastForwardResultMessage } from './storefront/orderTimers';
import { OrderStatusCell } from './components/OrderStatusCell';
import { isPreOrderAwaitingFulfillment } from './orderStatusBadge';
import { OrderReviewModal } from './components/OrderReviewModal';
import { OrderTotalAmountCell } from './components/OrderTotalAmountCell';
import { OrderRefundCell } from './components/OrderRefundCell';
import { getOrderRefundDisplay, hasPendingRefundOffer } from './orderRefund';
import type { OrderBuyerReview } from './ordersTypes';

function canRateOrder(order: Order): boolean {
  if (isPreOrderAwaitingFulfillment(order)) return false;
  return order.status === 'Hoàn thành' || order.status === 'Tạm giữ tiền';
}

function canSubmitComplaint(order: Order): boolean {
  if (isPreOrderAwaitingFulfillment(order)) return false;
  if (order.hasComplained) return false;
  if (order.status === 'Khiếu nại' || order.status === 'Tranh chấp') return false;
  return order.status === 'Tạm giữ tiền' || order.status === 'Đang thực hiện';
}

function isActiveComplaintStatus(order: Order): boolean {
  return order.status === 'Khiếu nại' || order.status === 'Tranh chấp';
}

function ComplaintUsedOnceButton() {
  return (
    <button
      type="button"
      disabled
      title="Đã khiếu nại 1 lần — không thể gửi thêm"
      className="relative p-1.5 text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed opacity-90"
      aria-label="Đã khiếu nại 1 lần"
    >
      <MessageSquareX size={14} />
      <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold leading-none flex items-center justify-center ring-2 ring-white">
        1
      </span>
    </button>
  );
}

export const PurchasedOrdersView = ({
  onOrderClick,
  orders,
  setOrders,
  patchOrderById,
  onNavigateToComplaint,
  statusFilter,
  onStatusFilterChange,
  buyerDisplayName = 'Khách',
}: {
  onOrderClick: (id: string) => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  /**
   * Cập nhật đơn theo id trên `allOrders` (App) — đồng bộ Admin → Đơn hàng khiếu nại.
   * Nếu không truyền, fallback `setOrders` (map theo danh sách hiện tại).
   */
  patchOrderById?: (orderId: string, patch: Partial<Order>) => void;
  /** Sau gửi khiếu nại — storefront không chuyển tab/trang admin. */
  onNavigateToComplaint?: (orderId: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (filter: string) => void;
  /** Tên hiển thị khi gửi đánh giá đơn. */
  buyerDisplayName?: string;
}) => {
  const isStatusFilterControlled = onStatusFilterChange != null;
  const [internalFilter, setInternalFilter] = useState(statusFilter ?? 'Tất cả');
  const activeFilter = isStatusFilterControlled ? (statusFilter ?? 'Tất cả') : internalFilter;
  const setActiveFilter = isStatusFilterControlled ? onStatusFilterChange! : setInternalFilter;

  useEffect(() => {
    if (isStatusFilterControlled && statusFilter != null) {
      setInternalFilter(statusFilter);
    }
  }, [isStatusFilterControlled, statusFilter]);
  const [search, setSearch] = useState('');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null);

  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [selectedOrderForComplaint, setSelectedOrderForComplaint] = useState<Order | null>(null);
  const [complaintReason, setComplaintReason] = useState('');
  const [reviewModalOrder, setReviewModalOrder] = useState<Order | null>(null);

  const applyOrderPatch = (orderId: string, patch: Partial<Order>) => {
    if (patchOrderById) {
      patchOrderById(orderId, patch);
      return;
    }
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, ...patch } : o)));
  };

  const handleOpenReview = (order: Order) => {
    if (!canRateOrder(order)) return;
    setReviewModalOrder(order);
  };

  const handleSubmitReview = (orderId: string, review: OrderBuyerReview) => {
    applyOrderPatch(orderId, { buyerReview: review });
    setReviewModalOrder(prev =>
      prev && prev.id === orderId ? { ...prev, buyerReview: review } : prev
    );
  };

  const handleComplain = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    if (!canSubmitComplaint(order)) {
      window.alert('Thất bại: Chỉ khiếu nại được 1 lần cho mỗi đơn hàng.');
      return;
    }
    setSelectedOrderForComplaint(order);
    setComplaintReason('');
    setIsComplaintModalOpen(true);
  };

  const applyComplaintPatch = (orderId: string, patch: Partial<Order>) => {
    if (patchOrderById) {
      patchOrderById(orderId, patch);
      return;
    }
    setOrders(prev =>
      prev.map(order => (order.id === orderId ? { ...order, ...patch } : order))
    );
  };

  const confirmComplaint = () => {
    if (!selectedOrderForComplaint || !complaintReason.trim()) return;
    const orderId = selectedOrderForComplaint.id;
    const source = orders.find(o => o.id === orderId) ?? selectedOrderForComplaint;
    applyComplaintPatch(
      orderId,
      patchWhenEnteringComplaint(source, {
        previousStatus: source.status,
        hasComplained: true,
        complaintReason: complaintReason.trim(),
      })
    );
    setIsComplaintModalOpen(false);
    setSelectedOrderForComplaint(null);
    setComplaintReason('');
    onNavigateToComplaint?.(orderId);
  };

  const handleCancelComplain = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const restored =
      order.previousStatus === 'Khiếu nại' || order.previousStatus === 'Tranh chấp'
        ? 'Tạm giữ tiền'
        : order.previousStatus ?? 'Tạm giữ tiền';
    applyComplaintPatch(orderId, patchWhenCancellingComplaint(order, restored));
  };

  const handleAcceptPartialRefund = (order: Order) => {
    const { main } = getOrderRefundDisplay(order);
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        `Chấp nhận hoàn ${main}? Đơn sẽ chuyển Thất bại và tiền về ví (nếu đã thanh toán).`
      )
    ) {
      return;
    }
    applyOrderPatch(order.id, {
      status: 'Thất bại',
      refundOfferStatus: 'accepted',
      failureKind: 'buyer_accepted_partial_refund',
    });
  };

  const handleRejectPartialRefund = (order: Order) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        'Từ chối đề xuất hoàn một phần? Đơn vẫn ở trạng thái khiếu nại — admin sẽ xử lý lại (hoàn toàn bộ, bảo hành hoặc tranh chấp).'
      )
    ) {
      return;
    }
    applyOrderPatch(order.id, {
      refundOfferStatus: 'rejected',
      refund: '0đ',
      partialRefundQuantity: undefined,
      status: 'Khiếu nại',
    });
  };

  const handleCancelOrder = (orderId: string) => {
    const patch: Partial<Order> = {
      status: 'Thất bại',
      failureKind: 'buyer_cancel',
    };
    const target = orders.find(o => o.id === orderId);
    if (target) {
      patch.refund = target.checkoutPaid ? target.totalAmount : '0đ';
    }
    applyOrderPatch(orderId, patch);
    setIsCancelModalOpen(false);
    setSelectedOrderForCancel(null);
  };

  const handleFastForwardTime = (orderId: string) => {
    const before = orders.find(o => o.id === orderId);
    if (!before) return;
    const after = fastForwardOrderTimeThreeDays(before);
    setOrders(prev => prev.map(o => (o.id === orderId ? after : o)));
    if (before.status !== after.status) {
      window.alert(`Đã cập nhật: ${before.status} → ${after.status}`);
      return;
    }
    window.alert(getFastForwardResultMessage(before, after));
  };

  const filters = [
    'Tất cả',
    'Hoàn thành',
    'Đang thực hiện',
    'Khiếu nại',
    'Tranh chấp',
    'Tạm giữ tiền',
    'Thất bại',
    'Chờ xác nhận',
    'Đặt trước',
  ];
  const orderTypeFilters = ['Tất cả', 'Sản phẩm', 'Dịch vụ'];
  const [activeOrderTypeFilter, setActiveOrderTypeFilter] = useState('Tất cả');

  const filteredOrders = orders.filter(order => {
    const matchesFilter =
      activeFilter === 'Tất cả' ||
      (activeFilter === 'Đặt trước' && order.isPreOrder === true) ||
      order.status === activeFilter;
    const matchesOrderType =
      activeOrderTypeFilter === 'Tất cả' ||
      (activeOrderTypeFilter === 'Sản phẩm' && order.order_type === 'product') ||
      (activeOrderTypeFilter === 'Dịch vụ' && order.order_type === 'service');
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.productName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesOrderType && matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative min-w-[150px]">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={activeFilter}
                onChange={e => setActiveFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
              >
                {filters.map(filter => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
              />
            </div>
            <div className="relative min-w-[150px]">
              <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={activeOrderTypeFilter}
                onChange={e => setActiveOrderTypeFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
              >
                {orderTypeFilters.map(filter => (
                  <option key={filter} value={filter}>
                    {filter}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                size={16}
              />
            </div>
            <div className="relative flex-1 max-w-md group">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                size={16}
              />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm mã đơn, sản phẩm..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] w-32 font-display border-r border-slate-200">
                  Hành động
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">
                  Mã đơn / Ngày / Người bán
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 min-w-[450px]">
                  Danh mục / Mặt hàng
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display w-20 border-r border-slate-200 text-center">
                  SL
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-right">
                  Đơn giá
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">
                  Giảm
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-right">
                  Tổng tiền
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">
                  Hoàn tiền
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display text-center min-w-[200px]">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredOrders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-4 border-r border-slate-300">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                        title="Nhắn tin"
                      >
                        <MessageCircle size={14} />
                      </button>

                      {canRateOrder(order) && (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(order)}
                          className={`p-1.5 rounded-lg transition-all ${
                            order.buyerReview
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                          }`}
                          title={order.buyerReview ? 'Xem đánh giá của bạn' : 'Đánh giá'}
                        >
                          <Star size={14} className={order.buyerReview ? 'fill-emerald-500' : undefined} />
                        </button>
                      )}

                      {canSubmitComplaint(order) && order.status === 'Đang thực hiện' && (
                        <button
                          type="button"
                          onClick={() => handleComplain(order.id)}
                          className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all"
                          title="Khiếu nại"
                        >
                          <MessageSquareX size={14} />
                        </button>
                      )}

                      {order.hasComplained &&
                        !isActiveComplaintStatus(order) &&
                        order.status === 'Đang thực hiện' && <ComplaintUsedOnceButton />}

                      {isActiveComplaintStatus(order) && (
                        <button
                          type="button"
                          onClick={() => handleCancelComplain(order.id)}
                          className="p-1.5 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-all border border-amber-200/80"
                          title="Hủy khiếu nại"
                        >
                          <ShieldX size={14} />
                        </button>
                      )}

                      {(order.status === 'Chờ xác nhận' || isPreOrderAwaitingFulfillment(order)) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForCancel(order);
                            setIsCancelModalOpen(true);
                          }}
                          className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 hover:scale-110 transition-all"
                          title="Hủy đơn"
                        >
                          <XCircle size={14} />
                        </button>
                      )}

                      {hasPendingRefundOffer(order) && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptPartialRefund(order)}
                            className="p-1.5 text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-200/80"
                            title="Chấp nhận hoàn một phần"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectPartialRefund(order)}
                            className="p-1.5 text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all border border-rose-200/80"
                            title="Từ chối đề xuất hoàn — chờ admin xử lý lại"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}

                      {order.status === 'Tạm giữ tiền' && !isPreOrderAwaitingFulfillment(order) && (
                        <>
                          {canSubmitComplaint(order) ? (
                            <button
                              type="button"
                              onClick={() => handleComplain(order.id)}
                              className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all"
                              title="Khiếu nại"
                            >
                              <MessageSquareX size={14} />
                            </button>
                          ) : order.hasComplained ? (
                            <ComplaintUsedOnceButton />
                          ) : null}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-300">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-col">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => onOrderClick(order.id)}
                          onKeyDown={e => e.key === 'Enter' && onOrderClick(order.id)}
                          className="text-sm font-bold text-blue-600 font-mono tracking-tight hover:underline cursor-pointer"
                        >
                          {order.id}
                        </span>
                        {order.warrantedFromId && (
                          <span className="text-[10px] text-rose-500 font-bold italic mt-0.5">
                            đơn hàng bảo hành từ đơn (
                            <span
                              className="underline cursor-pointer"
                              onClick={() => onOrderClick(order.warrantedFromId!)}
                            >
                              xem ngay
                            </span>
                            )
                          </span>
                        )}
                        {order.isWarrantyProcessed && (
                          <span className="text-[10px] text-amber-600 font-bold italic mt-0.5">
                            đơn hàng đã hỗ trợ bảo hành{' '}
                            {order.warrantedToId && (
                              <>
                                ( mã đơn :
                                <span
                                  className="underline cursor-pointer"
                                  onClick={() => onOrderClick(order.warrantedToId!)}
                                >
                                  {order.warrantedToId}
                                </span>
                                )
                              </>
                            )}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-600 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <Calendar size={13} className="text-slate-500" /> {order.purchaseDate}
                      </span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-bold hover:underline cursor-pointer transition-all w-fit">
                        <User size={10} className="text-blue-400 shrink-0" strokeWidth={2.5} aria-hidden />
                        {order.sellerName}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-300">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                          {order.categoryName === 'Facebook' ? (
                            <Facebook size={12} />
                          ) : order.categoryName === 'Tiktok' ? (
                            <Music size={12} />
                          ) : order.categoryName === 'Google' ? (
                            <Globe size={12} />
                          ) : (
                            <Folder size={12} />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer transition-colors uppercase tracking-wider truncate block">
                          {order.categoryName}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                          <Package size={12} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 whitespace-normal line-clamp-2 leading-relaxed">
                          {order.productName}
                        </span>
                      </div>
                      {order.warrantedFromId && (
                        <div className="flex items-center gap-1 mt-1 ml-6.5">
                          <span className="text-[10px] text-rose-500 font-bold italic">
                            đơn hàng bảo hành từ đơn (
                            <span
                              className="underline cursor-pointer hover:text-rose-600"
                              onClick={() => onOrderClick(order.warrantedFromId!)}
                            >
                              xem ngay
                            </span>
                            )
                          </span>
                        </div>
                      )}
                      {order.isWarrantyProcessed && (
                        <div className="flex items-center gap-1 mt-1 ml-6.5">
                          <span className="text-[10px] text-amber-600 font-bold italic">
                            đơn hàng đã hỗ trợ bảo hành{' '}
                            {order.warrantedToId && (
                              <>
                                ( mã đơn :
                                <span
                                  className="underline cursor-pointer hover:text-amber-700"
                                  onClick={() => onOrderClick(order.warrantedToId!)}
                                >
                                  {order.warrantedToId}
                                </span>
                                )
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-600 border-r border-slate-300 text-center">
                    {order.quantity}
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-900 border-r border-slate-300 text-right">
                    {order.unitPrice}
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-rose-500 border-r border-slate-300 text-center">
                    {order.discount}
                  </td>
                  <td className="py-4 px-4 border-r border-slate-300">
                    <OrderTotalAmountCell order={order} />
                  </td>
                  <td className="py-4 px-4 border-r border-slate-300 text-center">
                    <OrderRefundCell order={order} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <OrderStatusCell
                      order={order}
                      showTimeTest
                      onFastForward={handleFastForwardTime}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isCancelModalOpen && selectedOrderForCancel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Hủy đơn hàng</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Mã đơn:{' '}
                      <span className="font-mono font-bold text-slate-700">{selectedOrderForCancel.id}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-900">Xác nhận hủy đơn hàng</p>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      {isPreOrderAwaitingFulfillment(selectedOrderForCancel) ? (
                        <>
                          Shop chưa giao hàng từ kho — bạn có thể hủy đặt trước. Đơn chuyển sang{' '}
                          <span className="font-bold">Thất bại</span>
                          {selectedOrderForCancel.checkoutPaid ? (
                            <>
                              ; số tiền <span className="font-bold">{selectedOrderForCancel.totalAmount}</span> sẽ
                              hoàn về ví.
                            </>
                          ) : (
                            <> — chưa thanh toán nên không có khoản hoàn.</>
                          )}
                        </>
                      ) : (
                        <>
                          Việc hủy đơn hàng sẽ hoàn tất cả và hoàn số tiền{' '}
                          <span className="font-bold">{selectedOrderForCancel.totalAmount}</span> về tài khoản
                          của bạn.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => handleCancelOrder(selectedOrderForCancel.id)}
                  className="px-6 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                >
                  Xác nhận hủy đơn
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isComplaintModalOpen && selectedOrderForComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Khiếu nại đơn hàng</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Mã đơn:{' '}
                      <span className="font-mono font-bold text-slate-700">{selectedOrderForComplaint.id}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nội dung khiếu nại</label>
                    <textarea
                      value={complaintReason}
                      onChange={e => setComplaintReason(e.target.value)}
                      placeholder="Vui lòng nhập lý do khiếu nại chi tiết..."
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none min-h-[120px] resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsComplaintModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmComplaint}
                  disabled={!complaintReason.trim()}
                  className="px-6 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Gửi khiếu nại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <OrderReviewModal
        order={reviewModalOrder}
        buyerDisplayName={buyerDisplayName}
        onClose={() => setReviewModalOrder(null)}
        onSubmitReview={handleSubmitReview}
      />
    </motion.div>
  );
};
