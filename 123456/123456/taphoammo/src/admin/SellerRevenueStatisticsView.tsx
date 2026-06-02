import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  BarChart2,
  Calendar,
  ChevronDown,
  Hash,
  Coins,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { Order } from '../ordersTypes';
import { formatVnd } from '../orderAmountDisplay';
import {
  REVENUE_PERIOD_LABELS,
  buildDailyRevenueChartSeries,
  buildSellerRevenueSummary,
  filterOrdersForRevenueStats,
  type RevenuePeriod,
} from './sellerRevenueStats';

function formatAxisVnd(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

function RevenueChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const orders = payload.find(p => p.dataKey === 'orderCount');
  const gross = payload.find(p => p.dataKey === 'grossVnd');
  const net = payload.find(p => p.dataKey === 'netPayoutVnd');
  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-xl min-w-[200px]">
      <p className="text-slate-800 font-bold text-sm mb-3 pb-2 border-b border-slate-100">Ngày {label}</p>
      {orders != null && (
        <div className="flex items-center justify-between gap-6 mb-2">
          <span className="text-slate-500 text-xs font-medium">Số đơn</span>
          <span className="text-blue-700 text-xs font-bold tabular-nums">{orders.value}</span>
        </div>
      )}
      {gross != null && (
        <div className="flex items-center justify-between gap-6 mb-2">
          <span className="text-slate-500 text-xs font-medium">Tổng tiền (gộp)</span>
          <span className="text-emerald-700 text-xs font-bold tabular-nums whitespace-nowrap">
            {formatVnd(gross.value)}
          </span>
        </div>
      )}
      {net != null && (
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500 text-xs font-medium">Thực nhận</span>
          <span className="text-slate-800 text-xs font-bold tabular-nums whitespace-nowrap">
            {formatVnd(net.value)}
          </span>
        </div>
      )}
    </div>
  );
}

export interface SellerRevenueStatisticsViewProps {
  orders: Order[];
  sellerIdentityKeys: Set<string>;
  isAdminSession: boolean;
  sellerDisplayName?: string;
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 border ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">{label}</p>
      <p className="text-sm font-black tabular-nums">{value}</p>
    </div>
  );
}

export function SellerRevenueStatisticsView({
  orders,
  sellerIdentityKeys,
  isAdminSession,
  sellerDisplayName = '',
}: SellerRevenueStatisticsViewProps) {
  const [period, setPeriod] = useState<RevenuePeriod>('month');

  const scopedOrders = useMemo(
    () =>
      filterOrdersForRevenueStats(orders, {
        period,
        sellerKeys: isAdminSession ? undefined : sellerIdentityKeys,
      }),
    [orders, period, isAdminSession, sellerIdentityKeys]
  );

  const summary = useMemo(() => buildSellerRevenueSummary(scopedOrders), [scopedOrders]);
  const chartSeries = useMemo(
    () => buildDailyRevenueChartSeries(scopedOrders, period),
    [scopedOrders, period]
  );

  const title = isAdminSession ? 'Thống kê doanh thu người bán' : 'Thống kê doanh thu cửa hàng';
  const subtitle = isAdminSession
    ? 'Tổng quan doanh thu theo shop — từ đơn đã thanh toán trên sàn'
    : sellerDisplayName
      ? `Shop: ${sellerDisplayName} — đơn đã thanh toán`
      : 'Doanh thu thực nhận sau phí sàn và Reseller';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className="relative shrink-0">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as RevenuePeriod)}
            className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer min-w-[200px]"
          >
            {(Object.keys(REVENUE_PERIOD_LABELS) as RevenuePeriod[]).map(p => (
              <option key={p} value={p}>
                {REVENUE_PERIOD_LABELS[p]}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={16}
          />
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Biểu đồ tổng quan</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo ngày trong kỳ — {REVENUE_PERIOD_LABELS[period]}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 min-w-[140px]">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Hash size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Tổng đơn</p>
                  <p className="text-2xl font-black text-blue-900 tabular-nums leading-none mt-0.5">
                    {summary.orderCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 min-w-[180px]">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Coins size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Tổng tiền (gộp)</p>
                  <p className="text-lg font-black text-emerald-900 tabular-nums leading-tight mt-0.5">
                    {formatVnd(summary.grossVnd)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {chartSeries.every(d => d.orderCount === 0 && d.grossVnd === 0) ? (
            <div className="h-[320px] flex flex-col items-center justify-center text-slate-400 text-sm">
              <BarChart2 size={40} className="mb-3 text-slate-200" />
              Chưa có đơn trong kỳ — biểu đồ sẽ hiện khi có dữ liệu
            </div>
          ) : (
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartSeries} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grossVndGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                    dy={8}
                    interval={chartSeries.length > 14 ? Math.floor(chartSeries.length / 10) : 0}
                  />
                  <YAxis
                    yAxisId="orders"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#3b82f6', fontSize: 11, fontWeight: 600 }}
                    allowDecimals={false}
                    width={36}
                  />
                  <YAxis
                    yAxisId="money"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#059669', fontSize: 11, fontWeight: 600 }}
                    tickFormatter={formatAxisVnd}
                    width={52}
                  />
                  <Tooltip content={<RevenueChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 12 }}
                    formatter={value =>
                      value === 'orderCount'
                        ? 'Số đơn'
                        : value === 'grossVnd'
                          ? 'Tổng tiền (gộp)'
                          : String(value)
                    }
                  />
                  <Bar
                    yAxisId="orders"
                    dataKey="orderCount"
                    name="orderCount"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                    opacity={0.9}
                  />
                  <Line
                    yAxisId="money"
                    type="monotone"
                    dataKey="grossVnd"
                    name="grossVnd"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Số đơn theo ngày</h3>
              <p className="text-[11px] text-slate-500">Tổng: {summary.orderCount} đơn</p>
            </div>
            <Hash size={18} className="text-blue-500" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  interval={chartSeries.length > 12 ? Math.floor(chartSeries.length / 8) : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip content={<RevenueChartTooltip />} />
                <Bar dataKey="orderCount" name="orderCount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tổng tiền theo ngày</h3>
              <p className="text-[11px] text-slate-500">Gộp: {formatVnd(summary.grossVnd)}</p>
            </div>
            <Coins size={18} className="text-emerald-500" />
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  interval={chartSeries.length > 12 ? Math.floor(chartSeries.length / 8) : 0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={formatAxisVnd}
                  width={48}
                />
                <Tooltip content={<RevenueChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="grossVnd"
                  name="grossVnd"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#areaGross)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatusPill
          label="Sản phẩm"
          value={String(summary.productCount)}
          tone="bg-blue-50 border-blue-100 text-blue-800"
        />
        <StatusPill
          label="Dịch vụ"
          value={String(summary.serviceCount)}
          tone="bg-violet-50 border-violet-100 text-violet-800"
        />
        <StatusPill
          label="Khiếu nại / tranh chấp"
          value={String(summary.complaintCount)}
          tone="bg-rose-50 border-rose-100 text-rose-800"
        />
        <StatusPill
          label="Thất bại"
          value={String(summary.failedCount)}
          tone="bg-slate-50 border-slate-200 text-slate-700"
        />
        <StatusPill
          label="Hoàn 1 phần (giữ phần còn)"
          value={formatVnd(summary.partialRefundVnd)}
          tone="bg-amber-50 border-amber-100 text-amber-900 col-span-2 sm:col-span-1"
        />
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed px-1">
        * Chỉ tính đơn đã thanh toán qua sàn. Thực nhận = doanh thu gộp − phí sàn − hoa hồng Reseller. Đơn bảo
        hành thay thế (0đ) không tính. Số liệu tạm giữ / giải ngân theo trạng thái đơn trên hệ thống.
      </p>
    </motion.div>
  );
}
