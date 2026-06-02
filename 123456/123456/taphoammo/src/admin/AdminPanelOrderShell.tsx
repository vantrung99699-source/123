/**
 * Khung trang đơn hàng admin panel — toàn hệ thống, mọi người bán.
 */
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Store } from 'lucide-react';
import type { Order } from '../ordersTypes';

export interface AdminPanelOrderShellProps {
  title: string;
  subtitle: string;
  orders: Order[];
  children: (filteredOrders: Order[]) => React.ReactNode;
}

function uniqueSellers(orders: Order[]): string[] {
  const set = new Set<string>();
  for (const o of orders) {
    const s = o.sellerName?.trim();
    if (s) set.add(s);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'vi'));
}

export function AdminPanelOrderShell({ title, subtitle, orders, children }: AdminPanelOrderShellProps) {
  const [sellerFilter, setSellerFilter] = useState('Tất cả người bán');
  const sellers = useMemo(() => uniqueSellers(orders), [orders]);

  const filteredOrders = useMemo(() => {
    if (sellerFilter === 'Tất cả người bán') return orders;
    return orders.filter(o => o.sellerName?.trim() === sellerFilter);
  }, [orders, sellerFilter]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full overflow-y-auto"
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{title}</h2>
          <p className="text-slate-500 text-sm max-w-2xl">{subtitle}</p>
        </div>
        {sellers.length > 0 ? (
          <div className="relative min-w-[220px]">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select
              value={sellerFilter}
              onChange={e => setSellerFilter(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer"
            >
              <option value="Tất cả người bán">Tất cả người bán ({orders.length})</option>
              {sellers.map(s => (
                <option key={s} value={s}>
                  {s} ({orders.filter(o => o.sellerName?.trim() === s).length})
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>
        ) : null}
      </header>

      {sellerFilter !== 'Tất cả người bán' ? (
        <p className="mb-4 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 w-fit">
          Đang lọc người bán: {sellerFilter} · {filteredOrders.length} đơn
        </p>
      ) : null}

      {children(filteredOrders)}
    </motion.div>
  );
}
