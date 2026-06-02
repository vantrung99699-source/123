import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ShoppingBag,
  AlertCircle,
  Gavel,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { Order } from '../ordersTypes';
import type { Product } from './types';
import {
  buildProductOrderStatsSummary,
  buildTwoMonthProductOrderChart,
  filterOrdersForProduct,
} from './productOrderStats';

export interface ProductStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  orders: Order[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  subLabel,
  subValue,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: 'blue' | 'indigo' | 'orange' | 'violet';
  subLabel?: string;
  subValue?: string | number;
}) {
  const tones = {
    blue: {
      card: 'bg-blue-50 text-blue-600 border-blue-100',
      subBorder: 'border-blue-200/60',
      subAccent: 'text-blue-700',
    },
    indigo: {
      card: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      subBorder: 'border-indigo-200/60',
      subAccent: 'text-indigo-700',
    },
    orange: {
      card: 'bg-orange-50 text-orange-600 border-orange-100',
      subBorder: 'border-orange-200/60',
      subAccent: 'text-orange-700',
    },
    violet: {
      card: 'bg-violet-50 text-violet-600 border-violet-100',
      subBorder: 'border-violet-200/60',
      subAccent: 'text-violet-700',
    },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${t.card}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{label}</span>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{value}</p>
      {subLabel != null && subValue != null && (
        <p
          className={`text-[11px] font-bold text-slate-700 leading-snug pt-0.5 border-t ${t.subBorder} mt-1`}
        >
          {subLabel}: <span className={`tabular-nums ${t.subAccent}`}>{subValue}</span>
        </p>
      )}
    </div>
  );
}

export function ProductStatsModal({ isOpen, onClose, product, orders }: ProductStatsModalProps) {
  const productOrders = useMemo(
    () => (product ? filterOrdersForProduct(orders, product) : []),
    [orders, product]
  );

  const summary = useMemo(() => buildProductOrderStatsSummary(productOrders), [productOrders]);
  const chartData = useMemo(() => buildTwoMonthProductOrderChart(productOrders), [productOrders]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl relative overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <LayoutDashboard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Thống kê mặt hàng</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{product.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Đơn hàng"
                  value={summary.ordersAllTime}
                  subLabel="Hôm nay"
                  subValue={summary.ordersToday}
                  icon={ShoppingBag}
                  tone="blue"
                />
                <StatCard
                  label="Khiếu nại"
                  value={summary.complaintTotal}
                  subLabel="Hôm nay"
                  subValue={summary.complaintsToday}
                  icon={AlertCircle}
                  tone="orange"
                />
                <StatCard
                  label="Tổng tranh chấp"
                  value={summary.disputeTotal}
                  icon={Gavel}
                  tone="violet"
                />
              </div>

              <section className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <ShoppingBag size={16} className="text-indigo-500" />
                      Số lượng đơn hàng — 2 tháng gần nhất
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Chỉ đơn đã thanh toán · theo ngày
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg">
                    {chartData.reduce((s, d) => s + d.orderCount, 0)} đơn trong biểu đồ
                  </span>
                </div>
                <div className="h-[320px] w-full">
                  {chartData.every(d => d.orderCount === 0) ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400">
                      Chưa có đơn trong 2 tháng gần nhất
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                          interval={Math.max(0, Math.floor(chartData.length / 14))}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                          allowDecimals={false}
                          width={28}
                        />
                        <Tooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{
                            borderRadius: 16,
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                          formatter={(value: number) => [`${value} đơn`, 'Số lượng']}
                          labelFormatter={(_, payload) => {
                            const row = payload?.[0]?.payload as { monthLabel?: string; label?: string };
                            return row?.monthLabel ? `${row.label} · ${row.monthLabel}` : String(_);
                          }}
                        />
                        <Bar
                          dataKey="orderCount"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={28}
                          name="Số đơn"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
