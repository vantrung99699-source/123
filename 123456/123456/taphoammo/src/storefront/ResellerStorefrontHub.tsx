import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Handshake,
  Package,
  TrendingUp,
  CheckCircle2,
  Wallet,
  CircleDollarSign,
  Banknote,
} from 'lucide-react';
import type { Order } from '../ordersTypes';
import { formatVnd } from '../orderAmountDisplay';
import {
  formatOrderResellerFeeDisplay,
  getOrderResellerFeeVnd,
  isOrderForResellerReferrer,
} from './orderResellerFee';
import {
  formatResellerWithdrawDate,
  getResellerWithdrawHistory,
  getResellerWithdrawnVnd,
  type ResellerWithdrawRecord,
} from './resellerWithdraw';
import { ResellerWithdrawModal } from './ResellerWithdrawModal';
import {
  formatResellerRequestDate,
  getResellerApprovedPercent,
  type ResellerRequest,
} from '../reseller/resellerRequests';

export interface ResellerStorefrontHubProps {
  referrerEmail: string;
  referrerName: string;
  referrerLoginName?: string;
  orders: Order[];
  requests: ResellerRequest[];
  onBack: () => void;
  /** Sau khi rút thành công — trừ ví & ghi lịch sử giao dịch storefront. */
  onResellerWithdrawSuccess?: (record: ResellerWithdrawRecord) => void;
}

type HubTab = 'stats' | 'orders' | 'requests' | 'withdraw';

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function ResellerStorefrontHub({
  referrerEmail,
  referrerName,
  referrerLoginName,
  orders,
  requests,
  onBack,
  onResellerWithdrawSuccess,
}: ResellerStorefrontHubProps) {
  const [activeTab, setActiveTab] = useState<HubTab>('stats');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawRevision, setWithdrawRevision] = useState(0);

  const referrerIdentityExtras = useMemo(() => {
    const extras: string[] = [];
    if (referrerLoginName?.trim()) extras.push(referrerLoginName.trim());
    for (const r of requests) {
      if (normEmail(r.requesterEmail) !== normEmail(referrerEmail)) continue;
      if (r.requesterName?.trim()) extras.push(r.requesterName.trim());
    }
    return extras;
  }, [requests, referrerEmail, referrerLoginName]);

  const myOrders = useMemo(
    () =>
      orders
        .filter(o =>
          isOrderForResellerReferrer(
            o,
            referrerEmail,
            referrerName,
            referrerLoginName,
            referrerIdentityExtras
          )
        )
        .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0)),
    [orders, referrerEmail, referrerName, referrerLoginName, referrerIdentityExtras]
  );

  /** Chỉ đơn hoàn thành mới hiện trong bảng giới thiệu (đã nhận hoa hồng). */
  const myCompletedOrders = useMemo(
    () => myOrders.filter(o => o.status === 'Hoàn thành'),
    [myOrders]
  );

  const myRequests = useMemo(
    () =>
      requests
        .filter(r => normEmail(r.requesterEmail) === normEmail(referrerEmail))
        .sort((a, b) => b.updatedAtMs - a.updatedAtMs),
    [requests, referrerEmail]
  );

  const stats = useMemo(() => {
    let totalCommission = 0;
    let completedCommission = 0;
    for (const o of myOrders) {
      const fee = getOrderResellerFeeVnd(o);
      totalCommission += fee;
      if (o.status === 'Hoàn thành') completedCommission += fee;
    }
    const withdrawnVnd = getResellerWithdrawnVnd(referrerEmail);
    const withdrawableVnd = Math.max(0, completedCommission - withdrawnVnd);
    const pendingRequests = myRequests.filter(r => r.status === 'pending').length;
    const approvedGians = new Set(
      myRequests.filter(r => r.status === 'approved').map(r => r.gianHangId)
    ).size;
    return {
      orderCount: myCompletedOrders.length,
      totalCommission,
      completedCommission,
      withdrawnVnd,
      withdrawableVnd,
      pendingRequests,
      approvedGians,
    };
  }, [myOrders, myCompletedOrders, myRequests, referrerEmail, withdrawRevision]);

  const withdrawHistory = useMemo(
    () => getResellerWithdrawHistory(referrerEmail),
    [referrerEmail, withdrawRevision]
  );

  const tabs: { id: HubTab; label: string }[] = [
    { id: 'stats', label: 'Thống kê' },
    { id: 'orders', label: `Đơn giới thiệu (${myCompletedOrders.length})` },
    { id: 'requests', label: `Yêu cầu % (${myRequests.length})` },
    { id: 'withdraw', label: 'Rút tiền' },
  ];

  const handleWithdrawSuccess = (record: ResellerWithdrawRecord) => {
    setWithdrawRevision((n) => n + 1);
    onResellerWithdrawSuccess?.(record);
  };

  const statusLabel = (s: ResellerRequest['status']) => {
    if (s === 'pending') return 'Chờ duyệt';
    if (s === 'approved') return 'Đã duyệt';
    return 'Từ chối';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm mb-8"
        >
          <ArrowLeft size={16} />
          Về trang mua hàng
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center border border-violet-200">
              <Handshake size={22} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Quản lý Reseller
              </h1>
              <p className="text-slate-500 text-sm">
                {referrerName} · {referrerEmail}
              </p>
            </div>
          </div>
          <p className="text-slate-600 text-sm max-w-2xl">
            Theo dõi hoa hồng từ đơn khách mua qua link của bạn và trạng thái yêu cầu tăng % chiết khấu.
          </p>
        </div>

        <div className="flex gap-6 border-b border-slate-200 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-semibold transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-violet-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <SummaryCard
                label="Tổng hoa hồng"
                value={formatVnd(stats.totalCommission)}
                icon={TrendingUp}
                tone="violet"
              />
              <SummaryCard
                label="Đã nhận (hoàn thành)"
                value={formatVnd(stats.completedCommission)}
                icon={CheckCircle2}
                tone="emerald"
              />
              <SummaryCard
                label="Số tiền đã rút"
                value={formatVnd(stats.withdrawnVnd)}
                icon={Wallet}
                tone="slate"
              />
              <SummaryCard
                label="Số tiền rút được"
                value={formatVnd(stats.withdrawableVnd)}
                icon={CircleDollarSign}
                tone="amber"
              />
              <SummaryCard
                label="Đơn giới thiệu"
                value={String(stats.orderCount)}
                icon={Package}
                tone="blue"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(true)}
                disabled={stats.withdrawableVnd <= 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-500/25 disabled:opacity-45 disabled:cursor-not-allowed transition-all"
              >
                <Banknote size={18} />
                Rút tiền
                <span className="text-violet-200 font-semibold tabular-nums">
                  ({formatVnd(stats.withdrawableVnd)})
                </span>
              </button>
              <p className="text-xs text-slate-500">
                Chỉ rút trong hạn mức <strong className="text-amber-700">Số tiền rút được</strong>.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Yêu cầu chờ duyệt
                </p>
                <p className="text-2xl font-black text-amber-600">{stats.pendingRequests}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Gian đã được duyệt %
                </p>
                <p className="text-2xl font-black text-violet-700">{stats.approvedGians}</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'withdraw' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Số tiền rút được
                </p>
                <p className="text-3xl font-black text-amber-600 tabular-nums">
                  {formatVnd(stats.withdrawableVnd)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Đã rút: <span className="font-bold text-slate-700">{formatVnd(stats.withdrawnVnd)}</span>
                  {' · '}
                  Hoa hồng hoàn thành:{' '}
                  <span className="font-bold text-slate-700">{formatVnd(stats.completedCommission)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(true)}
                disabled={stats.withdrawableVnd <= 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-45 shrink-0"
              >
                <Wallet size={18} />
                Rút tiền ngay
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">Lịch sử rút tiền Reseller</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[480px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase">Ngày</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase text-right">
                        Số tiền
                      </th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase">Ngân hàng</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {withdrawHistory.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {formatResellerWithdrawDate(row.createdAtMs)}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-violet-700 text-right tabular-nums">
                          {formatVnd(row.amountVnd)}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-700">
                          {row.bankName}
                          <span className="block text-[10px] text-slate-400 font-mono">{row.accountNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Thành công
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {withdrawHistory.length === 0 && (
                <p className="py-12 text-center text-sm text-slate-500">Chưa có lần rút tiền nào.</p>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[280px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase">Ngày</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase text-center">
                      % CK
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase text-right">
                      Hoa hồng
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myCompletedOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {order.purchaseDate}
                      </td>
                      <td className="py-3 px-4 text-xs text-center tabular-nums">
                        {order.resellerPercent != null ? `${order.resellerPercent}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-violet-700 text-right tabular-nums">
                        {formatOrderResellerFeeDisplay(order)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {myCompletedOrders.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-500 max-w-md mx-auto">
                Chưa có đơn <strong className="font-semibold text-slate-600">Hoàn thành</strong> có hoa
                hồng Reseller từ link của bạn. Khách cần mua ở chế độ <strong className="font-semibold text-slate-600">Người mua</strong>{' '}
                qua link COPY; đơn tự mua hoặc không có cột Reseller trên admin sẽ không hiện ở đây.
              </p>
            )}
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase">Gian hàng</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase">Ngày</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase">Từ % → Xin %</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase text-center">
                      Trạng thái
                    </th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-600 uppercase text-center">
                      % đang dùng
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myRequests.map(row => {
                    const activePct = getResellerApprovedPercent(
                      requests,
                      referrerEmail,
                      row.gianHangId,
                      row.baselinePercent
                    );
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-xs font-bold text-slate-800">{row.gianHangName}</td>
                        <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {formatResellerRequestDate(row.updatedAtMs)}
                        </td>
                        <td className="py-3 px-4 text-xs tabular-nums">
                          <span className="font-bold text-slate-600">{row.baselinePercent}%</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="font-bold text-violet-700">{row.requestedPercent}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : row.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-bold text-violet-700 tabular-nums">
                          {activePct != null ? `${activePct}%` : `${row.baselinePercent}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {myRequests.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-500">
                Chưa gửi yêu cầu tăng %. Mở sản phẩm có Reseller → Đăng kí Reseller → Tạo yêu cầu.
              </p>
            )}
          </motion.div>
        )}

        <ResellerWithdrawModal
          open={withdrawModalOpen}
          onClose={() => setWithdrawModalOpen(false)}
          referrerEmail={referrerEmail}
          withdrawableVnd={stats.withdrawableVnd}
          onSuccess={handleWithdrawSuccess}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof TrendingUp;
  tone: 'violet' | 'emerald' | 'amber' | 'blue' | 'slate';
}) {
  const tones = {
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 border ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}
