/**
 * TopStoreManagementView - Quản lý gian hàng Top 1
 */

import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  TrendingUp,
  Wallet,
  MoreHorizontal,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { TOP_STORES } from './data';
import type { TopStore } from './types';

function accountLine(store: TopStore): string {
  if (store.category.toLowerCase().includes('facebook') || store.category.includes('FB')) {
    return `Tài khoản FB: ${store.username}`;
  }
  if (store.category.toLowerCase().includes('tiktok')) {
    return `Tài khoản TikTok: ${store.username}`;
  }
  if (store.category.toLowerCase().includes('gmail') || store.category.toLowerCase().includes('email')) {
    return `Tài khoản Email: ${store.username}`;
  }
  return `Tài khoản: ${store.username}`;
}

function RankBadge({ rank }: { rank: number }) {
  const isTop = rank === 1;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-lg text-xs font-black ${
        isTop
          ? 'bg-amber-100 text-amber-800 border border-amber-200'
          : 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}
    >
      #{rank}
    </span>
  );
}

/** Cột HÀNH ĐỘNG AUTO: trạng thái auto đẩy / giữ Top 1 (theo mock dữ liệu gian hàng). */
function AutoActionBadges({ autoPush, holdTop1 }: { autoPush: boolean; holdTop1: boolean }) {
  if (!autoPush && !holdTop1) {
    return (
      <span className="text-sm text-slate-400 italic font-medium" title="Chưa bật tự động hóa">
        Không bật
      </span>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
      {autoPush && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-blue-50 border-blue-200 text-blue-700 shadow-sm shadow-blue-500/5"
          title="Tự động đẩy tin theo lịch / quy tắc"
        >
          <Clock size={14} className="shrink-0" strokeWidth={2.25} aria-hidden />
          Auto đẩy
        </span>
      )}
      {holdTop1 && (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-500/5"
          title="Tự động duy trì vị trí Top 1 danh mục"
        >
          <CheckCircle2 size={14} className="shrink-0" strokeWidth={2.25} aria-hidden />
          Giữ Top 1
        </span>
      )}
    </div>
  );
}

function StatusToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`relative h-7 w-[52px] shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-1 ${
          on ? 'bg-emerald-500' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
            on ? 'translate-x-[22px]' : 'translate-x-0'
          }`}
        />
      </button>
      <span className={`text-[10px] font-bold uppercase tracking-wide ${on ? 'text-emerald-600' : 'text-slate-400'}`}>
        {on ? 'Bật' : 'Tắt'}
      </span>
    </div>
  );
}

export function TopStoreManagementView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [rowStatus, setRowStatus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOP_STORES.map((s) => [s.id, s.status]))
  );
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const filteredStores = useMemo(
    () =>
      TOP_STORES.filter((store) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
          store.name.toLowerCase().includes(q) ||
          store.username.toLowerCase().includes(q) ||
          store.storeCode.toLowerCase().includes(q)
        );
      }),
    [searchQuery]
  );

  const totalPush = TOP_STORES.reduce((sum, s) => sum + s.totalPushCount, 0);
  const totalPushMoney = TOP_STORES.reduce((sum, s) => {
    const n = parseInt(s.totalPushAmount.replace(/\D/g, ''), 10) || 0;
    return sum + n;
  }, 0);
  const todayPush = TOP_STORES.reduce((sum, s) => sum + s.dailyPushCount, 0);
  const todayMoney = TOP_STORES.reduce((sum, s) => {
    const n = parseInt(s.dailyPushAmount.replace(/\D/g, ''), 10) || 0;
    return sum + n;
  }, 0);

  const allFilteredIds = filteredStores.map((s) => s.id);
  const allSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selected[id]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected({});
    } else {
      setSelected(Object.fromEntries(allFilteredIds.map((id) => [id, true])));
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN').format(n).replace(/,/g, '.') + ' đ';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-y-auto bg-slate-50"
    >
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Quản lý gian hàng top 1</h2>
        <p className="text-slate-500 text-sm">Danh sách các gian hàng đang chạy dịch vụ top 1</p>
      </header>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1 min-w-[280px] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Tổng đẩy</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{totalPush.toLocaleString('vi-VN')} lượt</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Hôm nay</p>
            <p className="text-base font-bold text-blue-600">{todayPush} lượt</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1 min-w-[280px] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wallet size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Tổng tiền đẩy</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">{formatMoney(totalPushMoney)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Hôm nay</p>
            <p className="text-base font-bold text-emerald-600">{formatMoney(todayMoney)}</p>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">Tổng cộng</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
              {TOP_STORES.length} gian hàng
            </span>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              placeholder="Tìm theo tên gian hàng, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-2 py-3.5 w-12">STT</th>
                <th className="px-4 py-3.5 min-w-[240px]">Tên gian hàng</th>
                <th className="px-4 py-3.5">Tổng đẩy</th>
                <th className="px-4 py-3.5">Tổng đẩy ngày</th>
                <th className="px-4 py-3.5 text-center">Thứ hạng</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center min-w-[200px]">Hành động Auto</th>
                <th className="px-4 py-3.5 w-14 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStores.map((store, idx) => (
                <motion.tr
                  key={store.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-4 align-top">
                    <input
                      type="checkbox"
                      checked={!!selected[store.id]}
                      onChange={() =>
                        setSelected((prev) => ({ ...prev, [store.id]: !prev[store.id] }))
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-2 py-4 align-top text-sm font-bold text-slate-800">{store.stt}</td>
                  <td className="px-4 py-4 align-top">
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline block mb-1"
                    >
                      {store.name}
                    </a>
                    <p className="text-xs text-slate-500 mb-0.5">
                      Mã: <span className="font-mono font-medium text-slate-600">{store.storeCode}</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-1">{accountLine(store)}</p>
                    <p className="text-[11px] text-slate-400">{store.dateTime}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="text-sm font-bold text-slate-900">{store.totalPushCount} lượt</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-0.5">{store.totalPushAmount}</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="text-sm font-bold text-slate-900">{store.dailyPushCount} lượt</p>
                    <p className="text-sm font-semibold text-blue-600 mt-0.5">{store.dailyPushAmount}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-center">
                    <div className="inline-flex justify-center">
                      <RankBadge rank={store.rank} />
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-center">
                    <div className="flex justify-center pt-0.5">
                      <StatusToggle
                        on={rowStatus[store.id] ?? store.status}
                        onToggle={() =>
                          setRowStatus((prev) => ({
                            ...prev,
                            [store.id]: !(prev[store.id] ?? store.status),
                          }))
                        }
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 align-middle text-center">
                    <AutoActionBadges autoPush={store.autoPush} holdTop1={store.holdTop1} />
                  </td>
                  <td className="px-4 py-4 align-top text-center">
                    <button
                      type="button"
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      aria-label="Thêm hành động"
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStores.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-12">Không có gian hàng phù hợp.</p>
        )}
      </section>
    </motion.div>
  );
}
