import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft,
  AlertCircle,
  Info,
  Package,
  Search,
  Download,
  Upload,
  FileText,
  Copy,
  CheckSquare,
  Square,
  User,
  Store,
  CreditCard,
  Clock,
  X,
} from 'lucide-react';
import type { Order } from './ordersTypes';
import {
  getOrderStatusDisplayLabel,
  getOrderStatusStyleForOrder,
  ORDER_STATUS_BADGE_BASE,
  isPreOrderAwaitingFulfillment,
} from './orderStatusBadge';
import { formatPreOrderDeadlineRemainingLabel, getPreOrderDeadlineMs, getPreOrderDeliveryDeadlineDays } from './storefront/preOrderAutoFail';
import { getOrderEffectiveNowMs } from './storefront/orderTimeSimulation';
import { getOrderFailureReasonLabel, isOrderTimerAutoFailure } from './orderFailureLabel';
import { getOrderRefundDisplay, hasPendingRefundOffer } from './orderRefund';
import { parseDefectiveUploadText } from './storefront/defectiveItemUpload';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
  onReportDefectiveItems?: (orderId: string, itemIds: string[]) => void;
  onUploadDefectiveItems?: (
    orderId: string,
    payload: { text: string }
  ) => { matched: number; skipped: number } | void;
}

const PAGE_SIZE = 25;

type AccountRow = { uid: string; content: string; reported: boolean };

function downloadAccountRows(
  rows: AccountRow[],
  orderId: string,
  suffix: string
) {
  if (rows.length === 0) return;
  const lines = rows.map(a => `${a.uid}|${a.content}`);
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `don-${orderId}-san-pham${suffix}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const OrderDetailView = ({
  order,
  onBack,
  onReportDefectiveItems,
  onUploadDefectiveItems,
}: OrderDetailViewProps) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const awaitingPreOrderDelivery = isPreOrderAwaitingFulfillment(order);
  const preOrderDeadlineHint = awaitingPreOrderDelivery
    ? formatPreOrderDeadlineRemainingLabel(order)
    : null;
  const preOrderEmptyDetails = useMemo(() => {
    if (!awaitingPreOrderDelivery) return null;
    const deadlineMs = getPreOrderDeadlineMs(order);
    const deadlineDays = getPreOrderDeliveryDeadlineDays(order);
    if (deadlineMs == null) {
      return {
        deadlineDays,
        deadlineDateLabel: null,
        countdownLabel: preOrderDeadlineHint,
        isOverdue: false,
      };
    }
    const remaining = deadlineMs - getOrderEffectiveNowMs(order);
    const deadlineDateLabel = new Date(deadlineMs).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      deadlineDays,
      deadlineDateLabel,
      countdownLabel: preOrderDeadlineHint,
      isOverdue: remaining <= 0,
    };
  }, [awaitingPreOrderDelivery, order, preOrderDeadlineHint]);

  const accounts = useMemo(() => {
    if (order.deliveredItems && order.deliveredItems.length > 0) {
      return order.deliveredItems.map(item => ({
        uid: item.id,
        content: item.content,
        reported: Boolean(item.buyerReportedDefective),
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

  const knownUids = useMemo(() => new Set(accounts.map(a => a.uid)), [accounts]);

  const filteredIds = useMemo(() => filteredAccounts.map(a => a.uid), [filteredAccounts]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedAccounts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, safePage]);

  const pageStart = filteredAccounts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, filteredAccounts.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toggleAccount = (uid: string) => {
    setSelectedIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const toggleAllFiltered = () => {
    if (filteredIds.length === 0) return;
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const selectedRows = useMemo(
    () => accounts.filter(a => selectedIds.includes(a.uid)),
    [accounts, selectedIds]
  );

  const copyPageOrSelected = () => {
    const rows =
      selectedIds.length > 0 ? selectedRows : paginatedAccounts;
    const text = rows.map(a => a.content).join('\n');
    if (text) navigator.clipboard.writeText(text);
  };

  const copyAllOrder = () => {
    const text = accounts.map(a => a.content).join('\n');
    if (text) navigator.clipboard.writeText(text);
  };

  const downloadSelected = () => {
    if (selectedRows.length === 0) return;
    downloadAccountRows(selectedRows, order.id, '-da-chon');
  };

  const downloadAllOrder = () => {
    downloadAccountRows(accounts, order.id, '-toan-bo');
  };

  const downloadCurrentPage = () => {
    downloadAccountRows(paginatedAccounts, order.id, `-trang-${safePage}`);
  };

  const confirmReport = () => {
    if (selectedIds.length === 0) return;
    onReportDefectiveItems?.(order.id, selectedIds);
    setIsReportModalOpen(false);
    setSelectedIds([]);
    setReportSuccess(true);
    window.setTimeout(() => setReportSuccess(false), 4000);
  };

  const canReport = Boolean(onReportDefectiveItems) && accounts.length > 0;
  const canUpload = Boolean(onUploadDefectiveItems) && accounts.length > 0;

  const uploadPreview = useMemo(() => {
    if (!uploadText.trim()) return { matched: 0, lines: [] as ReturnType<typeof parseDefectiveUploadText> };
    const lines = parseDefectiveUploadText(uploadText, knownUids);
    return { matched: lines.length, lines };
  }, [uploadText, knownUids]);

  const confirmUpload = () => {
    if (!onUploadDefectiveItems) return;
    const lines = parseDefectiveUploadText(uploadText, knownUids);
    if (lines.length === 0) {
      setUploadError('Không có UID trùng với đơn. Mỗi dòng: UID hoặc UID|nội dung tài khoản.');
      return;
    }
    const totalLines = uploadText.split(/\r?\n/).filter(l => l.trim()).length;
    const result = onUploadDefectiveItems(order.id, { text: uploadText });
    const matched = result?.matched ?? lines.length;
    const skipped = result?.skipped ?? Math.max(0, totalLines - matched);
    setUploadError(null);
    setIsUploadModalOpen(false);
    setUploadText('');
    setUploadSuccess(
      `Đã tải ${matched} SP lỗi (khớp UID)${skipped > 0 ? ` · bỏ qua ${skipped} dòng không khớp` : ''}.`
    );
    window.setTimeout(() => setUploadSuccess(null), 5000);
  };

  const handleUploadFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setUploadText(text);
      setUploadError(null);
    };
    reader.readAsText(file, 'utf-8');
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
                {reportSuccess && (
                  <p className="text-[11px] font-semibold text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mt-2 max-w-xl">
                    Đã gửi báo lỗi. Người bán sẽ thấy sản phẩm lỗi trong kho đã bán.
                  </p>
                )}
                {uploadSuccess && (
                  <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-2 max-w-xl">
                    {uploadSuccess}
                  </p>
                )}
              </div>
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
          <button
            type="button"
            disabled={!canReport || selectedIds.length === 0}
            onClick={() => setIsReportModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[12px] font-bold transition-colors ${
              canReport && selectedIds.length > 0
                ? 'border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100'
                : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
            }`}
          >
            <Info size={14} />
            Báo lỗi SP đã chọn{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
          </button>
          <button
            type="button"
            disabled={!canUpload}
            onClick={() => {
              setUploadError(null);
              setIsUploadModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[12px] font-bold transition-colors ${
              canUpload
                ? 'border-red-200 bg-white text-red-500 hover:bg-red-50'
                : 'border-slate-200 bg-white text-slate-400 cursor-not-allowed'
            }`}
          >
            <Upload size={14} />
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
              <button
                type="button"
                onClick={downloadAllOrder}
                disabled={accounts.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Tải tất cả sản phẩm trong đơn (mọi trang)"
              >
                <Download size={14} />
                Tải toàn bộ ({accounts.length})
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={downloadSelected}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors bg-white"
                >
                  <Download size={14} className="text-slate-400" />
                  Tải đã chọn ({selectedIds.length})
                </button>
              )}
              {totalPages > 1 && selectedIds.length === 0 && (
                <button
                  type="button"
                  onClick={downloadCurrentPage}
                  disabled={paginatedAccounts.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors bg-white disabled:opacity-50"
                >
                  <Download size={14} className="text-slate-400" />
                  Tải trang {safePage}
                </button>
              )}
              <button
                type="button"
                onClick={copyPageOrSelected}
                disabled={
                  selectedIds.length === 0
                    ? paginatedAccounts.length === 0
                    : selectedRows.length === 0
                }
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors bg-white disabled:opacity-50"
              >
                <Copy size={14} className="text-slate-400" />
                {selectedIds.length > 0 ? 'Copy đã chọn' : 'Copy trang'}
              </button>
              <button
                type="button"
                onClick={copyAllOrder}
                disabled={accounts.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20 disabled:opacity-50"
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
                    <button
                      type="button"
                      onClick={toggleAllFiltered}
                      disabled={filteredIds.length === 0}
                      className="inline-flex disabled:opacity-40"
                      title="Chọn tất cả"
                    >
                      {filteredIds.length > 0 &&
                      filteredIds.every(id => selectedIds.includes(id)) ? (
                        <CheckSquare size={16} className="text-blue-600" />
                      ) : (
                        <Square size={16} className="text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-48 border border-slate-200">
                    UID
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200">
                    TÀI KHOẢN
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-28 border border-slate-200 text-center">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 border border-slate-200 bg-slate-50/40">
                      {order.deliveredItems?.length ? (
                        <p className="text-center text-[13px] text-slate-500 py-2">
                          Không có dòng nào khớp tìm kiếm.
                        </p>
                      ) : awaitingPreOrderDelivery && preOrderEmptyDetails ? (
                        <div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto text-center py-4">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                            <Package size={26} className="text-emerald-600" strokeWidth={1.75} />
                          </div>
                          <span
                            className={`${ORDER_STATUS_BADGE_BASE} ${getOrderStatusStyleForOrder(order)} text-[12px] px-3.5 py-1`}
                          >
                            {getOrderStatusDisplayLabel(order)}
                          </span>
                          <div>
                            <p className="text-[15px] font-bold text-slate-800">Shop chưa giao hàng từ kho</p>
                            <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">
                              Đơn đặt trước đã thanh toán — đang chờ shop xuất kho và giao sản phẩm cho bạn.
                            </p>
                          </div>
                          <div className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Trạng thái
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Chờ shop giao hàng
                              </span>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Hạn giao
                              </span>
                              <span className="text-[12px] font-bold text-slate-700 tabular-nums">
                                {preOrderEmptyDetails.deadlineDays} ngày kể từ khi đặt
                              </span>
                            </div>
                            {preOrderEmptyDetails.deadlineDateLabel ? (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Hết hạn
                                </span>
                                <span
                                  className={`text-[12px] font-bold tabular-nums ${
                                    preOrderEmptyDetails.isOverdue ? 'text-rose-600' : 'text-slate-700'
                                  }`}
                                >
                                  {preOrderEmptyDetails.deadlineDateLabel}
                                </span>
                              </div>
                            ) : null}
                            {preOrderEmptyDetails.countdownLabel ? (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  Còn lại
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold tabular-nums px-2.5 py-0.5 rounded-lg border ${
                                    preOrderEmptyDetails.isOverdue
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  <Clock size={12} />
                                  {preOrderEmptyDetails.countdownLabel}
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Nếu shop không giao đúng hạn, đơn chuyển{' '}
                            <span className="font-bold text-rose-600">Thất bại</span> và bạn được{' '}
                            <span className="font-bold text-slate-700">hoàn tiền</span>.
                          </p>
                        </div>
                      ) : (
                        <p className="text-center text-[13px] text-slate-500 py-2">
                          Chưa có sản phẩm trong kho đơn hàng.
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedAccounts.map((acc, index) => (
                    <tr
                      key={`${acc.uid}-${index}`}
                      className={`hover:bg-blue-50/30 transition-colors ${selectedIds.includes(acc.uid) ? 'bg-blue-50/50' : ''} ${acc.reported ? 'bg-orange-50/30' : ''}`}
                      onClick={() => toggleAccount(acc.uid)}
                    >
                      <td
                        className="px-4 py-3.5 text-center border border-slate-200"
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => toggleAccount(acc.uid)}
                          className="inline-flex mx-auto"
                          title={acc.reported ? 'Đã báo lỗi — vẫn chọn để tải' : 'Chọn dòng'}
                        >
                          {selectedIds.includes(acc.uid) ? (
                            <CheckSquare
                              size={16}
                              className={acc.reported ? 'text-orange-600' : 'text-blue-600'}
                            />
                          ) : (
                            <Square size={16} className="text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] font-bold text-slate-700 font-mono border border-slate-200">
                        {acc.uid}
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-600 font-mono border border-slate-200">
                        <span className="bg-slate-50/50 px-2 py-1 rounded inline-block w-auto border border-transparent hover:border-slate-200 transition-colors">
                          {acc.content}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center border border-slate-200">
                        {acc.reported ? (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                            SP lỗi
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <span className="text-[12px] text-slate-500 font-medium">
              {filteredAccounts.length === 0
                ? `0 / ${accounts.length} sản phẩm`
                : `Hiển thị ${pageStart}–${pageEnd} / ${filteredAccounts.length} dòng${
                    search.trim() ? '' : ` · ${accounts.length} SP trong đơn`
                  }`}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded text-[12px] font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => {
                    if (totalPages <= 7) return true;
                    if (p === 1 || p === totalPages) return true;
                    return Math.abs(p - safePage) <= 1;
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev != null && p - prev > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-slate-400 text-xs">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[28px] h-7 px-1.5 rounded flex items-center justify-center text-[12px] font-bold transition-colors ${
                            p === safePage
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded text-[12px] font-medium text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isReportModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReportModalOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Xác nhận báo lỗi</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Bạn chắc chắn muốn báo lỗi{' '}
                  <span className="font-bold text-orange-600">{selectedIds.length}</span> sản phẩm?
                  Người bán sẽ thấy trong <span className="font-bold">kho đã bán</span>.
                </p>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmReport}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-700 transition-all"
                >
                  Xác nhận báo lỗi
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Tải lên SP lỗi</h3>
                    <p className="text-[11px] text-slate-500">Khớp theo cột UID — mỗi dòng một tài khoản</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/80 cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors">
                  <FileText size={28} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">Chọn file .txt</span>
                  <span className="text-[11px] text-slate-500">UTF-8, mỗi dòng: UID hoặc UID|nội dung</span>
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    className="sr-only"
                    onChange={e => handleUploadFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <div>
                  <label
                    htmlFor="defective-upload-text"
                    className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5"
                  >
                    Hoặc dán nhiều tài khoản (mỗi dòng một dòng)
                  </label>
                  <textarea
                    id="defective-upload-text"
                    value={uploadText}
                    onChange={e => {
                      setUploadText(e.target.value);
                      if (uploadError) setUploadError(null);
                    }}
                    rows={8}
                    placeholder={'WH-123456|user|pass|...\nWH-789012\nhoặc chỉ UID nếu chỉ đánh dấu lỗi'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-[13px] font-mono text-slate-800 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20 resize-y"
                  />
                </div>

                {uploadPreview.matched > 0 && (
                  <p className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    Sẽ áp dụng <b>{uploadPreview.matched}</b> UID trùng đơn (đánh dấu SP lỗi).
                  </p>
                )}
                {uploadError && (
                  <p className="text-[12px] font-semibold text-rose-600" role="alert">
                    {uploadError}
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmUpload}
                  disabled={uploadPreview.matched === 0}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác nhận tải lên
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
