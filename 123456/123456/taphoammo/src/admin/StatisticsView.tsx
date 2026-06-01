/**
 * StatisticsView - Thống kê hệ thống Admin Dashboard
 */
import React from 'react';

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ShoppingBag,
  Users,
  LayoutDashboard,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const ALL_MONTHS = [
  'Tháng 04/2026', 'Tháng 03/2026', 'Tháng 02/2026', 'Tháng 01/2026',
  'Tháng 12/2025', 'Tháng 11/2025', 'Tháng 10/2025', 'Tháng 09/2025',
  'Tháng 08/2025', 'Tháng 07/2025', 'Tháng 06/2025', 'Tháng 05/2025',
];

interface ChartData {
  name: string;
  sales: number;
  reseller: number;
  platform: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-xl min-w-[200px]">
      <p className="text-slate-800 font-bold text-sm mb-3 pb-2 border-b border-slate-100">Ngày {label}</p>
      {[
        { color: '#3b82f6', name: 'Bán hàng', key: 'sales' },
        { color: '#6366f1', name: 'Reseller', key: 'reseller' },
        { color: '#10b981', name: 'Tiền sàn', key: 'platform' },
      ].map((item) => {
        const entry = payload.find((p) => p.name === item.key);
        return (
          <div key={item.key} className="flex items-center justify-between gap-6 mb-2 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-500 text-xs font-medium">{item.name}</span>
            </div>
            <span className="text-slate-800 text-xs font-bold whitespace-nowrap">
              {entry ? formatCurrency(entry.value) : formatCurrency(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const generateChartData = (month: string): ChartData[] => {
  const seed = month.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: 30 }, (_, i) => ({
    name: `${i + 1}`,
    sales: Math.floor(Math.abs(Math.sin(seed + i) * 50000000) + 20000000),
    reseller: Math.floor(Math.abs(Math.cos(seed + i) * 20000000) + 5000000),
    platform: Math.floor(Math.abs(Math.tan(seed + i) * 10000000) + 2000000),
  }));
};

const CombinedStatCard = ({
  title,
  totalValue,
  todayValue,
  icon: Icon,
  colorClass = 'text-blue-600',
}: {
  title: string;
  totalValue: string;
  todayValue: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass?: string;
}) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 flex-1 min-w-[240px]">
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.replace('text-', 'bg-').replace('600', '50')} ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div className="text-right">
        <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase block mb-0.5">Hôm nay</span>
        <span className={`text-base font-bold ${colorClass}`}>{todayValue}</span>
      </div>
    </div>
    <div>
      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-0.5">{title}</span>
      <div className="text-2xl font-black text-slate-900 tracking-tight">{totalValue}</div>
    </div>
  </div>
);

export function StatisticsView() {
  const [selectedMonth, setSelectedMonth] = useState('Tháng 04/2026');

  const chartData = useMemo(() => generateChartData(selectedMonth), [selectedMonth]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-y-auto"
    >
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Thống kê hệ thống</h2>
          <p className="text-slate-500 text-sm">Tổng quan về doanh thu và hoạt động kinh doanh</p>
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer min-w-[180px]"
          >
            {ALL_MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
      </header>

      {/* Revenue cards */}
      <div className="flex flex-wrap gap-4 mb-8">
        <CombinedStatCard title="Tổng tiền bán hàng" totalValue="1.245.800.000 đ" todayValue="42.500.000 đ" icon={ShoppingBag} colorClass="text-blue-600" />
        <CombinedStatCard title="Tổng tiền reseller" totalValue="458.200.000 đ" todayValue="15.800.000 đ" icon={Users} colorClass="text-indigo-600" />
        <CombinedStatCard title="Tổng tiền sàn" totalValue="185.600.000 đ" todayValue="6.200.000 đ" icon={LayoutDashboard} colorClass="text-emerald-600" />
      </div>

      {/* Chart */}
      <section className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Biểu đồ doanh thu 30 ngày</h3>
            <p className="text-slate-400 text-xs font-medium mt-1">Dữ liệu chi tiết theo từng ngày trong {selectedMonth}</p>
          </div>
          <div className="flex items-center gap-6">
            {[
              { color: 'bg-blue-500', label: 'Bán hàng' },
              { color: 'bg-indigo-500', label: 'Reseller' },
              { color: 'bg-emerald-500', label: 'Tiền sàn' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full shadow-sm ${item.color}`} />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReseller" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPlatform" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickFormatter={(value) => `${value / 1000000}M`} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="reseller" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorReseller)" />
              <Area type="monotone" dataKey="platform" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPlatform)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </motion.div>
  );
}
