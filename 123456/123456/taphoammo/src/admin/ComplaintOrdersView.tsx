import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter, ChevronDown, Search, Package, Folder, Calendar, Users, Clock,
  Gavel, MessageSquareX, XCircle, Shield, MessageSquareWarning, X, AlertCircle,
} from 'lucide-react';
import type { Order, OrderStatus } from '../ordersTypes';
import { fastForwardOrderTimeThreeDays, getFastForwardResultMessage } from '../storefront/orderTimers';
import { OrderStatusCell } from '../components/OrderStatusCell';
import {
  ComplaintProcessingCell,
  getComplaintAdminProcessing,
  isComplaintRowHighlighted,
  type ComplaintResolveDraft,
} from '../components/ComplaintProcessingCell';
import { buildPartialRefundOfferPatch, computePartialRefundVnd } from '../orderRefund';
import { sendSellerResolveNotifyToBuyer } from '../storefront/sellerResolveBuyerMessage';
import { buildWarrantyOfferPatch } from '../storefront/warrantyOffer';
import { formatVnd } from '../orderAmountDisplay';
import { getComplaintEventDisplay } from '../orderDateDisplay';
import { patchWhenEnteringDispute } from '../storefront/disputeAutoRefund';
export function ComplaintOrdersView({
  onOrderClick,
  orders,
  setOrders,
  messagingOwnerEmail = '',
}: {
  onOrderClick: (id: string) => void;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  messagingOwnerEmail?: string;
}) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');

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

  const filters = ['Tất cả', 'Khiếu nại', 'Tranh chấp'];
  const orderTypeFilters = ['Tất cả', 'Sản phẩm', 'Dịch vụ'];
  const [activeOrderTypeFilter, setActiveOrderTypeFilter] = useState('Tất cả');

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedOrderForResolve, setSelectedOrderForResolve] = useState<any>(null);
  const [resolveAction, setResolveAction] = useState<'cancel' | 'warranty' | 'dispute' | null>(null);
  const [resolveMessage, setResolveMessage] = useState('');
  const [resolveRefundType, setResolveRefundType] = useState<'full' | 'partial'>('full');
  const [resolveWarrantyQuantity, setResolveWarrantyQuantity] = useState<number>(0);
  const [resolveCancelQuantity, setResolveCancelQuantity] = useState<number>(0);

  const filteredComplaints = orders.filter(item => {
    const isComplaint = item.status === 'Khiếu nại' || item.status === 'Tranh chấp';
    if (!isComplaint) return false;
    
    const matchesFilter = activeFilter === 'Tất cả' || item.status === activeFilter;
    const matchesOrderType = activeOrderTypeFilter === 'Tất cả' || 
                            (activeOrderTypeFilter === 'Sản phẩm' && item.order_type === 'product') ||
                            (activeOrderTypeFilter === 'Dịch vụ' && item.order_type === 'service');
    const matchesSearch = item.id.toLowerCase().includes(search.toLowerCase()) || 
                         item.buyerName.toLowerCase().includes(search.toLowerCase()) ||
                         item.productName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesOrderType && matchesSearch;
  });

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-[#4caf50] text-white border-transparent';
      case 'Đang thực hiện': return 'bg-[#42a5f5] text-white border-transparent';
      case 'Khiếu nại': return 'bg-[#ef5350] text-white border-transparent';
      case 'Tranh chấp': return 'bg-[#ef5350] text-white border-transparent';
      case 'Tạm giữ tiền': return 'bg-[#2d6a61] text-white border-transparent';
      case 'Thất bại': return 'bg-[#1c2331] text-white border-transparent';
      case 'Chờ xác nhận': return 'bg-[#ffb300] text-amber-900 border-transparent';
      default: return 'bg-slate-500 text-white border-transparent';
    }
  };

  const handleConfirmResolve = () => {
    if (!selectedOrderForResolve || !resolveAction) return;
    const source = selectedOrderForResolve as Order;
    const sellerNote = resolveMessage.trim();

    if (resolveAction === 'warranty' && !resolveMessage.trim()) {
      window.alert('Vui lòng ghi nội dung cần thiết cho đơn bảo hành.');
      return;
    }

    if (resolveAction === 'cancel') {
      setOrders(prev =>
        prev.map(order => {
          if (order.id !== source.id) return order;
          if (resolveRefundType === 'full') {
            return {
              ...order,
              status: 'Thất bại',
              refund: order.totalAmount,
              partialRefundQuantity: undefined,
              refundOfferStatus: undefined,
              failureKind: 'admin_resolve_complaint',
            };
          }
          return {
            ...order,
            ...buildPartialRefundOfferPatch(order, resolveCancelQuantity),
            failureKind: undefined,
          };
        })
      );
      if (resolveRefundType === 'full') {
        sendSellerResolveNotifyToBuyer({
          sessionFallbackEmail: messagingOwnerEmail,
          order: source,
          kind: 'full_refund',
          sellerNote,
        });
      } else {
        sendSellerResolveNotifyToBuyer({
          sessionFallbackEmail: messagingOwnerEmail,
          order: source,
          kind: 'partial_refund',
          sellerNote,
          partialQuantity: resolveCancelQuantity,
        });
      }
    } else if (resolveAction === 'warranty') {
      if (source.isWarrantyProcessed) {
        alert('Đơn hàng này đã được bảo hành');
        return;
      }
      setOrders(prev =>
        prev.map(order =>
          order.id === source.id
            ? { ...order, ...buildWarrantyOfferPatch(order, resolveWarrantyQuantity) }
            : order
        )
      );
      sendSellerResolveNotifyToBuyer({
        sessionFallbackEmail: messagingOwnerEmail,
        order: source,
        kind: 'warranty_offer',
        sellerNote,
        partialQuantity: resolveWarrantyQuantity,
      });
    } else if (resolveAction === 'dispute') {
      setOrders(prev =>
        prev.map(order =>
          order.id === source.id ? { ...order, ...patchWhenEnteringDispute(order) } : order
        )
      );
      sendSellerResolveNotifyToBuyer({
        sessionFallbackEmail: messagingOwnerEmail,
        order: source,
        kind: 'dispute',
        sellerNote,
      });
    }

    setIsResolveModalOpen(false);
    setResolveMessage('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[150px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
          >
            {filters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
        <div className="relative min-w-[150px]">
          <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={activeOrderTypeFilter}
            onChange={(e) => setActiveOrderTypeFilter(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none cursor-pointer"
          >
            {orderTypeFilters.map(filter => (
              <option key={filter} value={filter}>{filter}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mã đơn, tên người mua, sản phẩm..." 
            className="w-full pl-11 pr-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-12 text-center">STT</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-32 shrink-0">HÀNH ĐỘNG</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-44 shrink-0">MÃ ĐƠN / NGÀY MUA</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-56 max-w-56">GIAN HÀNG / SẢN PHẨM</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-36 shrink-0">NGƯỜI MUA</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center w-16 shrink-0">SỐ LƯỢNG</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-52 max-w-52">NỘI DUNG</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center w-36 shrink-0">NGÀY GIỜ KHIẾU NẠI</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center w-[200px] min-w-[200px] sticky right-[200px] z-20 bg-slate-50 shadow-[-8px_0_16px_-8px_rgba(15,23,42,0.12)]">TIẾN ĐỘ XỬ LÝ</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display text-center w-[200px] min-w-[200px] sticky right-0 z-20 bg-slate-50 border-l border-slate-200 shadow-[-8px_0_16px_-8px_rgba(15,23,42,0.12)]">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.map((item, idx) => {
                const resolveDraft: ComplaintResolveDraft | null =
                  isResolveModalOpen &&
                  selectedOrderForResolve?.id === item.id &&
                  resolveAction
                    ? {
                        resolveAction,
                        refundType: resolveAction === 'cancel' ? resolveRefundType : undefined,
                        quantity:
                          resolveAction === 'warranty'
                            ? resolveWarrantyQuantity
                            : resolveCancelQuantity,
                      }
                    : null;
                const rowHighlight = isComplaintRowHighlighted(item, resolveDraft);
                return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    rowHighlight
                      ? 'bg-amber-50/60 ring-1 ring-inset ring-amber-300/80 hover:bg-amber-50/80'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <td className="py-4 px-4 border-r border-slate-100 text-center text-xs font-bold text-slate-600">{idx + 1}</td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedOrderForResolve(item);
                          setResolveAction(null);
                          setResolveRefundType('full');
                          setResolveMessage('');
                          setResolveWarrantyQuantity(item.quantity);
                          setResolveCancelQuantity(item.quantity);
                          setIsResolveModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Gavel size={14} />
                        Giải quyết
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <div className="flex flex-col gap-1.5">
                      <span 
                        onClick={() => onOrderClick(item.id)}
                        className="text-sm font-bold text-blue-600 font-mono tracking-tight hover:underline cursor-pointer"
                      >
                        {item.id}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold whitespace-nowrap">
                        <Calendar size={13} className="text-slate-500" />
                        {item.purchaseDate}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline cursor-pointer transition-colors">
                        <Users size={12} className="text-blue-400" />
                        {item.sellerName}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 max-w-56 overflow-hidden">
                    <div className="flex flex-col gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                          <Folder size={14} />
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer transition-colors uppercase tracking-wider truncate block min-w-0">{item.storeName || 'GIAN HÀNG'}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/50">
                          <Package size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[13px] font-bold text-slate-800 leading-tight block line-clamp-2 break-words">{item.productName}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100">
                    <span className="text-sm font-bold text-blue-600 hover:underline cursor-pointer transition-colors">
                      {item.buyerName}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center">
                    <span className="text-xs font-bold text-slate-900">{item.quantity.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 w-52 max-w-52 overflow-hidden align-top">
                    <p
                      className="text-xs text-slate-600 line-clamp-3 break-words leading-snug overflow-hidden"
                      title={item.complaintReason || item.content || item.productName}
                    >
                      {item.complaintReason || item.content || item.productName}
                    </p>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center w-36 shrink-0">
                    {(() => {
                      const ev = getComplaintEventDisplay(item);
                      const fullLabel = `${ev.formatted}${!ev.isExactTimestamp ? ' (ước tính từ ngày mua)' : ''}`;
                      return (
                        <p
                          className="mx-auto max-w-[150px] text-xs font-semibold text-slate-800 leading-snug line-clamp-2 break-words text-center"
                          title={fullLabel}
                        >
                          <span className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                            <Clock size={12} className="text-slate-500 shrink-0" />
                            {ev.formatted}
                          </span>
                          {!ev.isExactTimestamp && (
                            <span className="block text-[9px] text-amber-700 font-medium">(ước tính)</span>
                          )}
                        </p>
                      );
                    })()}
                  </td>
                  <td
                    className={`py-4 px-4 border-r border-slate-100 text-center w-[200px] min-w-[200px] sticky right-[200px] z-10 shadow-[-8px_0_16px_-8px_rgba(15,23,42,0.08)] ${
                      rowHighlight ? 'bg-amber-50/95' : 'bg-white group-hover:bg-slate-50/95'
                    }`}
                  >
                    <ComplaintProcessingCell order={item} draft={resolveDraft} />
                  </td>
                  <td
                    className={`py-4 px-4 text-center w-[200px] min-w-[200px] sticky right-0 z-10 border-l border-slate-100 shadow-[-8px_0_16px_-8px_rgba(15,23,42,0.08)] ${
                      rowHighlight ? 'bg-amber-50/95' : 'bg-white group-hover:bg-slate-50/95'
                    }`}
                  >
                    <OrderStatusCell
                      order={item}
                      badgeClassName={`px-3 py-1 rounded-xl text-[11px] font-bold border whitespace-nowrap ${getStatusStyle(item.status)}`}
                      getStatusStyle={getStatusStyle}
                      showTimeTest
                      onFastForward={handleFastForwardTime}
                    />
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isResolveModalOpen && selectedOrderForResolve && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <Gavel size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Giải quyết khiếu nại</h3>
                    <p className="text-xs text-slate-400 font-medium">Đơn hàng: {selectedOrderForResolve.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsResolveModalOpen(false)} 
                  className="p-2 hover:bg-white rounded-xl transition-all text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {resolveAction && (() => {
                const modalDraft: ComplaintResolveDraft = {
                  resolveAction,
                  refundType: resolveAction === 'cancel' ? resolveRefundType : undefined,
                  quantity:
                    resolveAction === 'warranty' ? resolveWarrantyQuantity : resolveCancelQuantity,
                };
                const proc = getComplaintAdminProcessing(selectedOrderForResolve, modalDraft);
                return (
                  <div className="mx-6 mt-4 px-4 py-3 rounded-xl border border-violet-200 bg-violet-50/80 text-center">
                    <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">
                      Bảng đang hiển thị cùng nội dung — cột «Tiến độ xử lý»
                    </p>
                    <p className="text-sm font-bold text-violet-900 mt-1">{proc.title}</p>
                    {proc.detail && (
                      <p className="text-xs font-semibold text-violet-800 mt-0.5 tabular-nums">{proc.detail}</p>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const o = selectedOrderForResolve as Order;
                const ev = getComplaintEventDisplay(o);
                const complaintText =
                  o.complaintReason?.trim() || o.content?.trim() || 'Khách chưa ghi nội dung khiếu nại.';
                return (
                  <div className="px-6 pb-5 border-b border-slate-100">
                    <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-4 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                          <MessageSquareX size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                            Nội dung chi tiết khiếu nại
                          </p>
                          <p className="text-sm text-slate-800 font-medium mt-2 leading-relaxed whitespace-pre-wrap break-words">
                            {complaintText}
                          </p>
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
                        <div>
                          <dt className="text-[10px] font-bold text-slate-400 uppercase">Ngày giờ khiếu nại</dt>
                          <dd className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                            <Clock size={12} className="text-slate-500" />
                            {ev.formatted}
                            {!ev.isExactTimestamp && (
                              <span className="text-[9px] text-amber-700 font-semibold">(ước tính)</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</dt>
                          <dd className="mt-0.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${getStatusStyle(o.status)}`}
                            >
                              {o.status}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold text-slate-400 uppercase">Ngày mua</dt>
                          <dd className="font-bold text-slate-800 mt-0.5">{o.purchaseDate}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold text-slate-400 uppercase">Người mua</dt>
                          <dd className="font-bold text-blue-600 mt-0.5">{o.buyerName}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold text-slate-400 uppercase">Người bán</dt>
                          <dd className="font-bold text-slate-800 mt-0.5">{o.sellerName}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] font-bold text-slate-400 uppercase">Tổng tiền</dt>
                          <dd className="font-bold text-slate-800 mt-0.5">{o.totalAmount}</dd>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <dt className="text-[10px] font-bold text-slate-400 uppercase">Sản phẩm</dt>
                          <dd className="font-bold text-slate-800 mt-0.5 line-clamp-2">{o.productName}</dd>
                        </div>
                        {o.previousStatus && (
                          <div>
                            <dt className="text-[10px] font-bold text-slate-400 uppercase">Trước khiếu nại</dt>
                            <dd className="font-bold text-slate-600 mt-0.5">{o.previousStatus}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-[10px] font-bold text-slate-400 uppercase">Số lượng</dt>
                          <dd className="font-bold text-slate-800 mt-0.5">{o.quantity.toLocaleString('vi-VN')}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                );
              })()}

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setResolveAction('cancel')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${
                    resolveAction === 'cancel' 
                      ? 'border-rose-500 bg-rose-50/50 ring-4 ring-rose-500/5' 
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600">
                    <XCircle size={18} />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Hủy đơn</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">Hoàn tiền và hủy đơn hàng</p>
                </button>

                <button
                  onClick={() => setResolveAction('warranty')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${
                    resolveAction === 'warranty' 
                      ? 'border-amber-500 bg-amber-50/50 ring-4 ring-amber-500/5' 
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                    <Shield size={18} />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Bảo hành</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">Gửi lại sản phẩm thay thế</p>
                </button>

                <button
                  onClick={() => setResolveAction('dispute')}
                  className={`p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${
                    resolveAction === 'dispute' 
                      ? 'border-blue-500 bg-blue-50/50 ring-4 ring-blue-500/5' 
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <MessageSquareWarning size={18} />
                  </div>
                  <p className="text-sm font-bold text-slate-800">Tranh chấp</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">Gửi phản hồi tranh chấp</p>
                </button>
              </div>

              <div className="px-6 pb-6 space-y-6">
                {resolveAction === 'cancel' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hình thức hoàn tiền</label>
                        <select
                          value={resolveRefundType}
                          onChange={(e) => {
                            const type = e.target.value as 'full' | 'partial';
                            setResolveRefundType(type);
                            if (type === 'full') {
                              setResolveCancelQuantity(selectedOrderForResolve.quantity);
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 outline-none transition-all"
                        >
                          <option value="full">Hoàn tất cả</option>
                          <option value="partial">Hoàn một phần</option>
                        </select>
                      </div>
                      {resolveRefundType === 'partial' && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượng hủy</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={resolveCancelQuantity}
                              onChange={(e) => setResolveCancelQuantity(Number(e.target.value))}
                              max={selectedOrderForResolve.quantity}
                              min={1}
                              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:ring-4 outline-none transition-all ${
                                resolveCancelQuantity > selectedOrderForResolve.quantity 
                                  ? 'border-rose-500 focus:ring-rose-500/5 focus:border-rose-500' 
                                  : 'border-slate-200 focus:ring-rose-500/5 focus:border-rose-500'
                              }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              Tối đa: {selectedOrderForResolve.quantity}
                            </div>
                          </div>
                          {resolveCancelQuantity > selectedOrderForResolve.quantity && (
                            <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                              <AlertCircle size={10} /> Không được vượt quá {selectedOrderForResolve.quantity}
                            </p>
                          )}
                          {resolveCancelQuantity >= 1 &&
                            resolveCancelQuantity <= selectedOrderForResolve.quantity && (
                              <p className="text-[10px] text-blue-700 font-bold bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                                Số tiền hoàn đề xuất:{' '}
                                {formatVnd(
                                  computePartialRefundVnd(
                                    selectedOrderForResolve,
                                    resolveCancelQuantity
                                  )
                                )}{' '}
                                ({resolveCancelQuantity}/{selectedOrderForResolve.quantity} SP) — khách phải
                                xác nhận trước khi hoàn vào ví.
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {resolveAction === 'warranty' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
                      Đơn bảo hành: tổng <span className="font-bold">0đ</span> — sàn và Reseller{' '}
                      <span className="font-bold">không</span> được chiết khấu trên đơn thay thế.
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượng bảo hành</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={resolveWarrantyQuantity}
                          onChange={(e) => setResolveWarrantyQuantity(Number(e.target.value))}
                          max={selectedOrderForResolve.quantity}
                          min={1}
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-bold focus:ring-4 outline-none transition-all ${
                            resolveWarrantyQuantity > selectedOrderForResolve.quantity 
                              ? 'border-rose-500 focus:ring-amber-500/5 focus:border-amber-500' 
                              : 'border-slate-200 focus:ring-amber-500/5 focus:border-amber-500'
                          }`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          Tối đa: {selectedOrderForResolve.quantity}
                        </div>
                      </div>
                      {resolveWarrantyQuantity > selectedOrderForResolve.quantity && (
                        <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                          <AlertCircle size={10} /> Không được vượt quá {selectedOrderForResolve.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {resolveAction && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {resolveAction === 'warranty' ? (
                        <>
                          Nội dung cần thiết <span className="text-rose-600">*</span>
                        </>
                      ) : (
                        'Nội dung nhắn khách'
                      )}
                    </label>
                    <textarea
                      value={resolveMessage}
                      onChange={(e) => setResolveMessage(e.target.value)}
                      placeholder={
                        resolveAction === 'warranty'
                          ? 'Ghi rõ lý do bảo hành, hướng dẫn nhận hàng thay thế, thời gian giao… (bắt buộc)'
                          : 'Nhập nội dung phản hồi cho khách hàng...'
                      }
                      rows={3}
                      className={`w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium focus:ring-4 outline-none transition-all resize-none ${
                        resolveAction === 'warranty' && !resolveMessage.trim()
                          ? 'border-amber-300 focus:ring-amber-500/10 focus:border-amber-500'
                          : 'border-slate-200 focus:ring-blue-500/5 focus:border-blue-500'
                      }`}
                    />
                    {resolveAction === 'warranty' && !resolveMessage.trim() && (
                      <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                        <AlertCircle size={10} /> Vui lòng ghi nội dung trước khi gửi đề xuất bảo hành
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsResolveModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                >
                  Đóng
                </button>
                <button
                  onClick={handleConfirmResolve}
                  disabled={
                    !resolveAction || 
                    (resolveAction === 'cancel' && resolveRefundType === 'partial' && (resolveCancelQuantity > selectedOrderForResolve.quantity || resolveCancelQuantity < 1)) ||
                    (resolveAction === 'warranty' &&
                      (!resolveMessage.trim() ||
                        resolveWarrantyQuantity > selectedOrderForResolve.quantity ||
                        resolveWarrantyQuantity < 1))
                  }
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận giải quyết
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
