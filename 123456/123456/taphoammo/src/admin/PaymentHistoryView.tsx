/**
 * PaymentHistoryView - Lịch sử giao dịch
 */

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Search, User } from 'lucide-react';
import { PAYMENT_HISTORY } from './data';
import type { PaymentHistory } from './types';
import type { Order, OrderStatus } from '../ordersTypes';
import { ORDER_STATUS_BADGE_BASE, getOrderStatusStyle } from '../orderStatusBadge';

const typeColors: Record<string, { bg: string; text: string }> = {
  'Nạp tiền': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  'Rút tiền': { bg: 'bg-red-50', text: 'text-red-600' },
  'Mua hàng': { bg: 'bg-blue-50', text: 'text-blue-600' },
  'Bán hàng': { bg: 'bg-purple-50', text: 'text-purple-600' },
  'Hoàn tiền': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

/** Map trạng thái lịch sử giao dịch admin → OrderStatus (skill taphoammo-purchased-orders-parent / badge đơn). */
const paymentHistoryStatusToOrder: Record<PaymentHistory['status'], OrderStatus> = {
  'Thành công': 'Hoàn thành',
  'Chờ duyệt': 'Chờ xác nhận',
  'Thất bại': 'Thất bại',
};

/** Lịch sử giữ tiền (variant seller): chỉ đơn tiền chưa về hẳn người bán — không gồm Hoàn thành / Đang thực hiện / Thất bại. */
const SELLER_ESCROW_ORDER_STATUSES = new Set<OrderStatus>([
  'Chờ xác nhận',
  'Tạm giữ tiền',
  'Khiếu nại',
  'Tranh chấp',
]);

function paymentHistoryStatusClasses(status: PaymentHistory['status']): string {
  return getOrderStatusStyle(paymentHistoryStatusToOrder[status]);
}

/** Mã đơn trong lý do (thanh_toan / mock) — dùng tra `Order` theo skill purchased-orders-parent. */
function extractLinkedOrderIdFromReason(reason: string): string | null {
  const t1 = reason.match(/Thanh toán cho đơn hàng\s+(\S+)/);
  if (t1) return t1[1];
  const t2 = reason.match(/mã đơn hàng:\s*(\S+)/i);
  if (t2) return t2[1];
  const t3 = reason.match(/không hoàn thành\((\S+)\)/);
  if (t3) return t3[1];
  return null;
}

function orderStatusForSellerPaymentRow(
  tx: PaymentHistory,
  orderById: Map<string, Order>
): OrderStatus | null {
  const direct = orderById.get(tx.id);
  if (direct) return direct.status;
  const linkedId = extractLinkedOrderIdFromReason(tx.reason);
  if (linkedId) {
    const linked = orderById.get(linkedId);
    if (linked) return linked.status;
  }
  return paymentHistoryStatusToOrder[tx.status] ?? null;
}

function parseVndAmount(s: string | undefined): number {
  if (!s) return 0;
  const digits = s.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function orderDateToMs(s: string): number {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const y = parseInt(m[3], 10);
  const h = parseInt(m[4], 10);
  const mi = parseInt(m[5], 10);
  const t = new Date(y, mo, d, h, mi).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function orderStatusToAdminPaymentStatus(st: OrderStatus): PaymentHistory['status'] {
  if (st === 'Hoàn thành') return 'Thành công';
  if (st === 'Thất bại') return 'Thất bại';
  return 'Chờ duyệt';
}

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN');
}

function resolvePaymentRowStatusDisplay(
  tx: PaymentHistory,
  orderById: Map<string, Order>
): { label: string; styleClass: string } {
  const direct = orderById.get(tx.id);
  if (direct) {
    return { label: direct.status, styleClass: getOrderStatusStyle(direct.status) };
  }
  const linkedId = extractLinkedOrderIdFromReason(tx.reason);
  if (linkedId) {
    const linked = orderById.get(linkedId);
    if (linked) {
      return { label: linked.status, styleClass: getOrderStatusStyle(linked.status) };
    }
  }
  return { label: tx.status, styleClass: paymentHistoryStatusClasses(tx.status) };
}

/** Parse chuỗi dạng "A + B = C đ" / "A - B = C đ" từ mock (số dùng dấu chấm nghìn). */
function parseBalanceCalculation(calc: string) {
  const trimmed = calc.trim();
  const eqParts = trimmed.split(/\s*=\s*/);
  if (eqParts.length !== 2) return null;
  const [left, result] = eqParts;
  const resultTrim = result.trim();
  const plusIdx = left.indexOf(' + ');
  if (plusIdx !== -1) {
    return {
      before: left.slice(0, plusIdx).trim(),
      op: '+' as const,
      delta: left.slice(plusIdx + 3).trim(),
      after: resultTrim,
    };
  }
  const minusIdx = left.indexOf(' - ');
  if (minusIdx !== -1) {
    return {
      before: left.slice(0, minusIdx).trim(),
      op: '-' as const,
      delta: left.slice(minusIdx + 3).trim(),
      after: resultTrim,
    };
  }
  return null;
}

function AmountBalanceFormula({ tx }: { tx: PaymentHistory }) {
  const parsed = parseBalanceCalculation(tx.calculation);
  const amountIsCredit = tx.amount.trim().startsWith('+');
  const amountClass = amountIsCredit ? 'text-emerald-600' : 'text-red-600';

  return (
    <div className="min-w-[200px] max-w-[320px] space-y-2">
      <p className={`text-sm font-bold tabular-nums tracking-tight ${amountClass}`}>{tx.amount}</p>
      {parsed ? (
        <p className="text-[11px] text-slate-600 tabular-nums leading-snug flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
          <span className="text-slate-500">{parsed.before}</span>
          <span
            className={`font-extrabold ${parsed.op === '+' ? 'text-emerald-600' : 'text-red-600'}`}
            aria-hidden
          >
            {parsed.op === '+' ? '+' : '−'}
          </span>
          <span className={parsed.op === '+' ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
            {parsed.delta}
          </span>
          <span className="text-slate-400 font-bold px-0.5">=</span>
          <span className="font-bold text-slate-800">{parsed.after}</span>
        </p>
      ) : (
        <p className="text-[11px] text-slate-500 font-mono">{tx.calculation}</p>
      )}
    </div>
  );
}

export function PaymentHistoryView({
  extraRows = [],
  orders = [],
  variant = 'all',
}: {
  extraRows?: PaymentHistory[];
  /** Đơn hệ thống (App `allOrders`) — cột Trạng thái ưu tiên `Order.status` khi khớp mã đơn. */
  orders?: Order[];
  /** `seller`: chỉ giao dịch phía người bán (nhận tiền / bán hàng). */
  variant?: 'all' | 'seller';
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('Tất cả');

  const derivedOrderHistory = useMemo<PaymentHistory[]>(() => {
    const out: PaymentHistory[] = [];
    for (const o of orders) {
      if (!o.checkoutPaid) continue;
      const amt = parseVndAmount(o.totalAmount);
      if (amt > 0) {
        out.push({
          id: o.id,
          userId: o.buyerName,
          name: o.buyerName,
          amount: `-${formatVnd(amt)} đ`,
          type: 'Mua hàng',
          status: orderStatusToAdminPaymentStatus(o.status),
          time: o.purchaseDate,
          reason: `Thanh toán cho đơn hàng ${o.id}`,
          balanceBefore: '—',
          balanceAfter: '—',
          calculation: '—',
          sellerName: o.sellerName,
        });
      }

      if (o.status === 'Thất bại') {
        const refund = parseVndAmount(o.refund || o.totalAmount);
        if (refund > 0) {
          out.push({
            id: o.id,
            userId: o.buyerName,
            name: o.buyerName,
            amount: `+${formatVnd(refund)} đ`,
            type: 'Hoàn tiền',
            status: 'Thành công',
            time: o.purchaseDate,
            reason: `Hoàn tiền cho đơn hàng không hoàn thành(${o.id})`,
            balanceBefore: '—',
            balanceAfter: '—',
            calculation: '—',
            sellerName: o.sellerName,
          });
        }
      }
    }

    out.sort((a, b) => orderDateToMs(b.time) - orderDateToMs(a.time));
    return out;
  }, [orders]);

  /** Giao dịch phía người bán (nhận tiền từ đơn đã thanh toán). */
  const derivedSellerHistory = useMemo<PaymentHistory[]>(() => {
    const out: PaymentHistory[] = [];
    for (const o of orders) {
      if (!o.checkoutPaid) continue;
      const amt = parseVndAmount(o.totalAmount);
      if (amt <= 0) continue;
      const sellerName = o.sellerName?.trim();
      if (!sellerName) continue;
      out.push({
        id: o.id,
        userId: sellerName,
        name: sellerName,
        amount: `+${formatVnd(amt)} đ`,
        type: 'Bán hàng',
        status: orderStatusToAdminPaymentStatus(o.status),
        time: o.purchaseDate,
        reason: `Nhận thanh toán đơn hàng ${o.id} từ ${o.buyerName}`,
        balanceBefore: '—',
        balanceAfter: '—',
        calculation: '—',
        sellerName: o.buyerName,
      });
    }
    out.sort((a, b) => orderDateToMs(b.time) - orderDateToMs(a.time));
    return out;
  }, [orders]);

  const orderById = useMemo(() => {
    const m = new Map<string, Order>();
    for (const o of orders) m.set(o.id, o);
    return m;
  }, [orders]);

  const mergedHistory = useMemo(() => {
    if (variant === 'seller') {
      const base = [
        ...derivedSellerHistory,
        ...extraRows.filter((tx) => tx.type === 'Bán hàng'),
        ...PAYMENT_HISTORY.filter((tx) => tx.type === 'Bán hàng'),
      ];
      return base.filter((tx) => {
        const st = orderStatusForSellerPaymentRow(tx, orderById);
        return st != null && SELLER_ESCROW_ORDER_STATUSES.has(st);
      });
    }
    return [...derivedOrderHistory, ...extraRows, ...PAYMENT_HISTORY];
  }, [variant, derivedOrderHistory, derivedSellerHistory, extraRows, orderById]);

  const filteredHistory = mergedHistory.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const seller = (tx.sellerName ?? '').toLowerCase();
    const matchesSearch =
      tx.id.toLowerCase().includes(q) ||
      tx.name.toLowerCase().includes(q) ||
      tx.userId.toLowerCase().includes(q) ||
      tx.reason.toLowerCase().includes(q) ||
      tx.time.toLowerCase().includes(q) ||
      seller.includes(q);
    const matchesType =
      variant === 'seller' ? true : typeFilter === 'Tất cả' || tx.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-y-auto"
    >
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            {variant === 'seller' ? 'Lịch sử giữ tiền' : 'Lịch sử giao dịch'}
          </h2>
          <p className="text-slate-500 text-sm">
            {variant === 'seller'
              ? 'Chỉ các khoản đang tạm giữ: Chờ xác nhận, Tạm giữ tiền, Khiếu nại, Tranh chấp (không hiển thị tiền đã về hẳn người bán).'
              : 'Theo dõi toàn bộ giao dịch trên hệ thống'}
          </p>
        </div>
      </header>

      <div className="mb-6 flex items-center gap-4">
        {variant === 'all' && (
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {['Tất cả', 'Nạp tiền', 'Rút tiền', 'Mua hàng', 'Bán hàng', 'Hoàn tiền'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        )}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={
              variant === 'seller'
                ? 'Tìm mã đơn, người bán, người mua, lý do...'
                : 'Tìm kiếm mã giao dịch, tên, lý do...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-4 py-4 border-r border-slate-100 w-14 text-center">STT</th>
                <th className="px-4 py-4 border-r border-slate-100">Người dùng</th>
                {variant === 'seller' ? (
                  <>
                    <th className="px-6 py-4 border-r border-slate-100 normal-case tracking-wider">
                      Mã đơn / Thời gian
                    </th>
                    <th className="px-4 py-4 border-r border-slate-100 normal-case tracking-wider">Người mua</th>
                  </>
                ) : (
                  <th className="px-6 py-4 border-r border-slate-100 normal-case tracking-wider">
                    Mã đơn / Thời gian / Người bán
                  </th>
                )}
                <th className="px-4 py-4 border-r border-slate-100">Loại</th>
                <th className="px-4 py-4 border-r border-slate-100 min-w-[220px]">Số tiền & phép tính số dư</th>
                <th className="px-4 py-4 border-r border-slate-100">Trạng thái</th>
                <th className="px-4 py-4 border-r border-slate-100">Lý do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((tx, idx) => {
                const typeStyle = typeColors[tx.type] || typeColors['Nạp tiền'];
                const statusDisp = resolvePaymentRowStatusDisplay(tx, orderById);
                return (
                  <motion.tr
                    key={`${tx.id}-${tx.type}-${tx.time}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-4 border-r border-slate-100 text-center">
                      <span className="text-sm font-medium text-slate-500">{idx + 1}</span>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-slate-900 font-mono">{tx.userId}</span>
                        <span className="text-[10px] text-slate-500">{tx.name}</span>
                      </div>
                    </td>
                    {variant === 'seller' ? (
                      <>
                        <td className="px-6 py-4 border-r border-slate-100">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm font-bold text-blue-600 font-mono tracking-tight hover:underline cursor-pointer">
                              {tx.id}
                            </span>
                            <span className="text-xs text-slate-600 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                              <Calendar size={13} className="text-slate-500 shrink-0" aria-hidden />
                              {tx.time}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 border-r border-slate-100">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-bold hover:underline cursor-pointer transition-all w-fit">
                            <User size={10} className="text-blue-400 shrink-0" strokeWidth={2.5} aria-hidden />
                            {tx.sellerName ?? tx.name}
                          </div>
                        </td>
                      </>
                    ) : (
                      <td className="px-6 py-4 border-r border-slate-100">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-bold text-blue-600 font-mono tracking-tight hover:underline cursor-pointer">
                            {tx.id}
                          </span>
                          <span className="text-xs text-slate-600 font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <Calendar size={13} className="text-slate-500 shrink-0" aria-hidden />
                            {tx.time}
                          </span>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-bold hover:underline cursor-pointer transition-all w-fit">
                            <User size={10} className="text-blue-400 shrink-0" strokeWidth={2.5} aria-hidden />
                            {tx.sellerName ?? tx.name}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4 border-r border-slate-100">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${typeStyle.bg} ${typeStyle.text}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100 align-top">
                      <AmountBalanceFormula tx={tx} />
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <span className={`${ORDER_STATUS_BADGE_BASE} ${statusDisp.styleClass}`}>
                        {statusDisp.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <span className="text-xs text-slate-600 line-clamp-2">{tx.reason}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}
