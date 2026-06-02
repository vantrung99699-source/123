/**
 * Gian hàng Top 1 — admin panel (đồng bộ lượt đẩy thật, chỉ gian có đẩy trong 30 ngày).
 */
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  TrendingUp,
  Wallet,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  CalendarRange,
} from 'lucide-react';
import type { Category } from '../gianHang/types';
import type { GianHangTop1State } from '../gianHang/gianHangTop1Storage';
import { patchGianHangBoostSettings, writeGianHangTop1State } from '../gianHang/gianHangTop1Storage';
import { BOOST_PRICE_PER_PUSH_VND } from '../gianHang/gianHangTop1Boost';
import { buildTop1AdminRows } from './top1AdminRows';

export interface TopStoreManagementViewProps {
  categories?: Category[];
  top1State?: GianHangTop1State;
  onTop1StateChange?: (next: GianHangTop1State) => void;
}

function formatMoney(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n).replace(/,/g, '.') + ' đ';
}

function RankBadge({ rank }: { rank: number }) {
  const isTop = rank === 1;
  const label = rank >= 999 ? '—' : `#${rank}`;
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[40px] px-2.5 py-1 rounded-lg text-xs font-black ${
        isTop
          ? 'bg-amber-100 text-amber-800 border border-amber-200'
          : rank < 999
            ? 'bg-slate-100 text-slate-600 border border-slate-200'
            : 'bg-slate-50 text-slate-400 border border-slate-100'
      }`}
    >
      {label}
    </span>
  );
}

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-blue-50 border-blue-200 text-blue-700">
          <Clock size={14} className="shrink-0" strokeWidth={2.25} aria-hidden />
          Auto đẩy
        </span>
      )}
      {holdTop1 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-emerald-50 border-emerald-200 text-emerald-700">
          <CheckCircle2 size={14} className="shrink-0" strokeWidth={2.25} aria-hidden />
          Giữ Top 1
        </span>
      )}
    </div>
  );
}

function StatusToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
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

export function TopStoreManagementView({
  categories = [],
  top1State = { records: {} },
  onTop1StateChange,
}: TopStoreManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoEnabled, setAutoEnabled] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    for (const [id, rec] of Object.entries(top1State.records)) {
      m[id] = Boolean(rec.isAutoBoostEnabled);
    }
    return m;
  });
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const rows = useMemo(
    () => buildTop1AdminRows(categories, top1State),
    [categories, top1State]
  );

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((row) => {
      const s = row.store;
      return (
        s.name.toLowerCase().includes(q) ||
        s.ownerName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [rows, searchQuery]);

  const totalPush30 = rows.reduce((sum, r) => sum + r.pushes30d, 0);
  const totalMoney30 = rows.reduce((sum, r) => sum + r.spend30dVnd, 0);
  const todayPush = rows.reduce((sum, r) => sum + r.dailyPushCount, 0);
  const todayMoney = rows.reduce((sum, r) => sum + r.dailySpendVnd, 0);

  const allFilteredIds = filteredRows.map((r) => r.store.id);
  const allSelected =
    allFilteredIds.length > 0 && allFilteredIds.every((id) => selected[id]);

  const toggleSelectAll = () => {
    if (allSelected) setSelected({});
    else setSelected(Object.fromEntries(allFilteredIds.map((id) => [id, true])));
  };

  const toggleAutoForRow = (gianHangId: string, next: boolean) => {
    setAutoEnabled((prev) => ({ ...prev, [gianHangId]: next }));
    if (onTop1StateChange) {
      const patched = patchGianHangBoostSettings(top1State, gianHangId, {
        isAutoBoostEnabled: next,
      });
      onTop1StateChange(patched);
      writeGianHangTop1State(patched);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-y-auto bg-slate-50"
    >
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Gian hàng Top 1</h2>
        <p className="text-slate-500 text-sm max-w-3xl">
          Đồng bộ với dữ liệu đẩy top trên hệ thống ({BOOST_PRICE_PER_PUSH_VND.toLocaleString('vi-VN')}đ / lượt).
          Chỉ hiển thị gian hàng <b className="text-slate-700">có ít nhất 1 lượt đẩy trong 30 ngày gần nhất</b>.
          Xếp hạng Top 1–3 vẫn tính theo <b className="text-slate-700">tổng lượt 3 ngày liên tiếp</b> trong từng danh mục.
        </p>
      </header>

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1 min-w-[280px] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
              <CalendarRange size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">
                Tổng lượt đẩy 30 ngày
              </p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {totalPush30.toLocaleString('vi-VN')} lượt
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">
              {rows.length} gian
            </p>
            <p className="text-base font-bold text-violet-600">{formatMoney(totalMoney30)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1 min-w-[280px] flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Đẩy hôm nay</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {todayPush.toLocaleString('vi-VN')} lượt
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">Tiền hôm nay</p>
            <p className="text-base font-bold text-blue-600">{formatMoney(todayMoney)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-1 min-w-[200px] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Phí / lượt</p>
            <p className="text-lg font-black text-slate-900">{formatMoney(BOOST_PRICE_PER_PUSH_VND)}</p>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">Đang hiển thị</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">
              {filteredRows.length} gian (có đẩy 30 ngày)
            </span>
          </div>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="search"
              placeholder="Tìm tên gian, chủ shop, mã ID, danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1100px]">
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
                <th className="px-4 py-3.5 text-center min-w-[120px]">Lượt đẩy 30 ngày</th>
                <th className="px-4 py-3.5">Tiền đẩy 30 ngày</th>
                <th className="px-4 py-3.5">Đẩy hôm nay</th>
                <th className="px-4 py-3.5 text-center">Lượt 3 ngày</th>
                <th className="px-4 py-3.5 text-center">Thứ hạng</th>
                <th className="px-4 py-3.5 text-center">Trạng thái</th>
                <th className="px-4 py-3.5 text-center min-w-[200px]">Hành động Auto</th>
                <th className="px-4 py-3.5 w-14 text-center">⋯</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row, idx) => {
                const s = row.store;
                const autoOn = autoEnabled[s.id] ?? row.autoPush;
                return (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-4 align-top">
                      <input
                        type="checkbox"
                        checked={!!selected[s.id]}
                        onChange={() =>
                          setSelected((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 py-4 align-top text-sm font-bold text-slate-800">{row.stt}</td>
                    <td className="px-4 py-4 align-top">
                      <span className="text-sm font-bold text-blue-600 block mb-1">{s.name}</span>
                      <p className="text-xs text-slate-500 mb-0.5">
                        Mã: <span className="font-mono font-medium text-slate-600">{s.id}</span>
                      </p>
                      <p className="text-xs text-slate-500 mb-0.5">
                        Danh mục: <span className="font-medium">{s.category}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Chủ shop: <span className="font-bold text-slate-700">{s.ownerName}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {s.status} · {s.createdAt}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-center">
                      <p className="text-lg font-black text-violet-700 tabular-nums">{row.pushes30d}</p>
                      <p className="text-[10px] font-bold text-violet-500 uppercase">lượt / 30 ngày</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-bold text-emerald-700 tabular-nums">
                        {formatMoney(row.spend30dVnd)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-bold text-slate-900">{row.dailyPushCount} lượt</p>
                      <p className="text-sm font-semibold text-blue-600 mt-0.5">
                        {formatMoney(row.dailySpendVnd)}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-center">
                      <p className="text-sm font-bold text-slate-800">{s.daysAtTop1}</p>
                      <p className="text-[10px] text-slate-400">3 ngày liên tiếp</p>
                    </td>
                    <td className="px-4 py-4 align-top text-center">
                      <div className="inline-flex justify-center">
                        <RankBadge rank={row.rankNum} />
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-center">
                      <div className="flex justify-center pt-0.5">
                        <StatusToggle
                          on={autoOn}
                          onToggle={() => toggleAutoForRow(s.id, !autoOn)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-center">
                      <AutoActionBadges autoPush={row.autoPush} holdTop1={row.holdTop1} />
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
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <p className="text-center text-sm text-slate-500 py-12 px-6">
            Chưa có gian hàng nào có lượt đẩy trong 30 ngày gần nhất.
            <br />
            Gian đẩy top từ menu «Gian hàng Top 1» (admin gian hàng) hoặc seller sẽ xuất hiện tại đây sau khi có lượt
            đẩy.
          </p>
        )}
      </section>
    </motion.div>
  );
}
