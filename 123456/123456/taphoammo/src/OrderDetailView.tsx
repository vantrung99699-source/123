import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  AlertCircle,
  Info,
  Package,
  Search,
  Download,
  Copy,
  CheckSquare,
  User,
  Store,
  CreditCard
} from 'lucide-react';
import type { Order } from './ordersTypes';
import {
  getOrderStatusDisplayLabel,
  getOrderStatusStyleForOrder,
  ORDER_STATUS_BADGE_BASE,
  isPreOrderAwaitingFulfillment,
} from './orderStatusBadge';
import { formatPreOrderDeadlineRemainingLabel } from './storefront/preOrderAutoFail';
import { getOrderFailureReasonLabel, isOrderTimerAutoFailure } from './orderFailureLabel';
import { getOrderRefundDisplay, hasPendingRefundOffer } from './orderRefund';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
}

export const OrderDetailView = ({ order, onBack }: OrderDetailViewProps) => {
  const [search, setSearch] = useState('');
  const awaitingPreOrderDelivery = isPreOrderAwaitingFulfillment(order);
  const preOrderDeadlineHint = awaitingPreOrderDelivery
    ? formatPreOrderDeadlineRemainingLabel(order)
    : null;

  const accounts = useMemo(() => {
    if (order.deliveredItems && order.deliveredItems.length > 0) {
      return order.deliveredItems.map(item => ({
        uid: item.id,
        content: item.content,
      }));
    }
    return [];
  }, [order.deliveredItems]);

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      a =>
        a.uid.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const copyAll = () => {
    const text = filteredAccounts.map(a => a.content).join('\n');
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col font-sans w-full">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm mb-4">
        <div className="max-w-[1400px] w-full mx-auto px-6 py-4 space-y-3">
          
          {/* Top Row: Title, Badge, Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors shadow-sm"
                title="Quay lại danh sách"
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-[20px] font-extrabold text-slate-900 leading-none tracking-tight">
                    Đơn hàng <span className="text-blue-600">#{order.id}</span>
                  </h1>
                  <span className={`${ORDER_STATUS_BADGE_BASE} ${getOrderStatusStyleForOrder(order)}`}>
                    {getOrderStatusDisplayLabel(order)}
                  </span>
                  {getOrderFailureReasonLabel(order) && (
                    <span
                      className={
                        isOrderTimerAutoFailure(order)
                          ? 'text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg whitespace-nowrap'
                          : 'text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg whitespace-nowrap'
                      }
                    >
                      {getOrderFailureReasonLabel(order)}
                    </span>
                  )}
                </div>
                {hasPendingRefundOffer(order) && (
                  <p className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 max-w-xl">
                    Admin đề xuất hoàn một phần:{' '}
                    <span className="font-bold tabular-nums">{getOrderRefundDisplay(order).main}</span>
                    {getOrderRefundDisplay(order).sub ? ` (${getOrderRefundDisplay(order).sub})` : ''}. Vào
                    danh sách đơn đã mua để chấp nhận hoặc từ chối.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12px] font-bold transition-colors">
                Liên hệ hỗ trợ
              </button>
              <button className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95 border border-blue-500">
                Xem hóa đơn
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Buyer Card */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <User size={15} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Người mua</p>
                <p className="text-[13px] font-bold text-slate-800 leading-none">{order.buyerName}</p>
              </div>
            </div>

            {/* Seller Card */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100/60 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                <Store size={15} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Người bán</p>
                <div className="flex items-center gap-1.5 leading-none">
                  <p className="text-[13px] font-bold text-slate-800">{order.sellerName}</p>
                  <span className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline">(Xem shop)</span>
                </div>
              </div>
            </div>

            {/* Quantity Card */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100/60 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <Package size={15} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                  Số lượng mua
                </p>
                <p className="text-[15px] font-extrabold text-emerald-600 tabular-nums leading-none">{order.quantity}</p>
              </div>
            </div>

            {/* Total Card */}
            <div className="p-3 rounded-xl border border-rose-100/60 bg-rose-50/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100/60 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <CreditCard size={15} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider leading-none mb-1">Tổng thanh toán</p>
                <p className="text-[15px] font-extrabold text-rose-600 tabular-nums leading-none">{order.totalAmount}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6 space-y-6">
        {/* Notice Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-4 shadow-sm border border-transparent">
          <div className="flex items-center gap-2 text-white mb-2.5">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Info size={14} className="text-white" />
            </div>
            <span className="text-[14px] font-bold tracking-wide uppercase drop-shadow-sm">Thông báo từ hệ thống</span>
          </div>
          <ul className="list-disc list-outside text-[13px] text-blue-50 space-y-1.5 ml-6 font-medium">
            <li>
              Hệ thống dự kiến bảo trì nạp tiền trong khoảng thời gian từ <span className="font-bold text-white bg-white/20 px-1.5 py-0.5 rounded shadow-sm">02:00 - 04:00 ngày 15/10/2025</span>.
            </li>
            <li className="text-blue-100">
              Chính sách biểu phí sàn mới sẽ chính thức được áp dụng cho toàn bộ ngành hàng Dịch vụ bắt đầu từ tháng sau.
            </li>
          </ul>
        </div>

        {/* Extra buttons */}
        <div className="flex justify-end gap-3 mt-4 mb-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
            <Info size={14} />
            Báo lỗi SP đã chọn
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-white rounded-lg text-[12px] font-bold text-red-500 hover:bg-red-50 transition-colors">
            <AlertCircle size={14} />
            Tải lên SP lỗi
          </button>
        </div>

        {/* Action Bar & Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header Actions */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-slate-900 leading-snug">
                  {order.productName}
                </h2>
                <p className="text-[12px] text-slate-500 font-medium">
                  {order.categoryName} · {order.purchaseDate}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 w-[200px]"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors bg-white">
                <Download size={14} className="text-slate-400" />
                Tải đơn hàng
              </button>
              <button
                type="button"
                onClick={copyAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors bg-white"
              >
                <Copy size={14} className="text-slate-400" />
                Copy
              </button>
              <button
                type="button"
                onClick={copyAll}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
              >
                <Copy size={14} />
                Copy toàn bộ
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 w-12 text-center border border-slate-200">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-48 border border-slate-200">
                    UID
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                    TÀI KHOẢN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[13px] text-slate-500 border border-slate-200">
                      {order.deliveredItems?.length
                        ? 'Không có dòng nào khớp tìm kiếm.'
                        : awaitingPreOrderDelivery
                          ? `Đơn đặt trước — shop chưa giao hàng từ kho.${preOrderDeadlineHint ? ` ${preOrderDeadlineHint}.` : ''} Quá hạn → Thất bại và hoàn tiền.`
                          : 'Chưa có sản phẩm trong kho đơn hàng.'}
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc, index) => (
                    <tr key={`${acc.uid}-${index}`} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3.5 text-center border border-slate-200">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-bold text-slate-700 font-mono border border-slate-200">
                        {acc.uid}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-600 font-mono border border-slate-200">
                        <span className="bg-slate-50/50 px-2 py-1 rounded inline-block w-auto border border-transparent hover:border-slate-200 transition-colors">
                          {acc.content}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-[12px] text-slate-500 font-medium">
              Hiển thị {filteredAccounts.length} / {order.quantity} sản phẩm
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 rounded text-[12px] font-medium text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50">
                Previous
              </button>
              <button className="w-7 h-7 rounded flex items-center justify-center bg-blue-600 text-white text-[12px] font-bold shadow-sm shadow-blue-500/20">
                1
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
