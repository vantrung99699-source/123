import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Trophy,
  ShieldCheck,
  Copy,
  User,
  ChevronUp,
  X,
  Clock,
  Settings,
  Minus,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Category } from '../gianHang/types';
import {
  BOOST_INSTANT_TOP1_PUSH_COUNT,
  BOOST_PRICE_PER_PUSH_VND,
  buildBoostStoresFromCategories,
  type BoostStore,
} from '../gianHang/gianHangTop1Boost';
import {
  patchGianHangBoostSettings,
  recordGianHangBoost,
  type BoostRank,
  type GianHangBoostSettingsPatch,
  type GianHangTop1State,
} from '../gianHang/gianHangTop1Storage';

export interface GianHangTop1ViewProps {
  categories: Category[];
  top1State: GianHangTop1State;
  onTop1StateChange: (next: GianHangTop1State) => void;
  /** Số dư ví người bán (admin shell) — trừ khi đẩy top. */
  walletBalanceVnd: number;
  onWalletBalanceChange: (next: number) => void;
}

type BoostTab = 'manual' | 'auto' | 'keep-top';

export function GianHangTop1View({
  categories,
  top1State,
  onTop1StateChange,
  walletBalanceVnd,
  onWalletBalanceChange,
}: GianHangTop1ViewProps) {
  const stores = useMemo(
    () => buildBoostStoresFromCategories(categories, top1State),
    [categories, top1State]
  );
  const [selectedStore, setSelectedStore] = useState<BoostStore | null>(null);
  const [isBoostModalOpen, setIsBoostModalOpen] = useState(false);
  const [isBoostLeaderboardOpen, setIsBoostLeaderboardOpen] = useState(false);
  const [activeBoostTab, setActiveBoostTab] = useState<BoostTab>('manual');

  const openBoostModal = (store: BoostStore, tab: BoostTab = 'manual') => {
    setSelectedStore(store);
    setActiveBoostTab(tab);
    setIsBoostModalOpen(true);
  };

  const applyBoost = (gianHangId: string, count: number): boolean => {
    const pushes = Math.max(1, Math.round(count));
    const costVnd = pushes * BOOST_PRICE_PER_PUSH_VND;
    if (walletBalanceVnd < costVnd) {
      if (typeof window !== 'undefined') {
        window.alert(
          `Số dư ví không đủ.\nCần ${costVnd.toLocaleString('vi-VN')}đ (${pushes} lượt × ${BOOST_PRICE_PER_PUSH_VND.toLocaleString('vi-VN')}đ).\nHiện có: ${walletBalanceVnd.toLocaleString('vi-VN')}đ.`
        );
      }
      return false;
    }
    onWalletBalanceChange(walletBalanceVnd - costVnd);
    onTop1StateChange(recordGianHangBoost(top1State, gianHangId, pushes));
    if (typeof window !== 'undefined') {
      window.alert(
        `Đã đẩy ${pushes} lần (−${costVnd.toLocaleString('vi-VN')}đ, còn ${(walletBalanceVnd - costVnd).toLocaleString('vi-VN')}đ).\nChỉ cạnh tranh trong cùng danh mục: tổng lượt 3 ngày cao nhất trong danh mục giữ Top 1; nếu vẫn Top 1 sẽ có tag Tài trợ trên trang danh mục đó.`
      );
    }
    return true;
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
          <Trophy size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
            <Zap size={32} className="text-yellow-300 fill-yellow-300" />
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              <ShieldCheck size={20} className="text-green-400" />
              Gian hàng Top 1 & Tài trợ
            </h2>
            <p className="text-blue-50 leading-relaxed font-medium">
              Đẩy top tăng lượt hiển thị trên storefront —{' '}
              <b className="text-white">{BOOST_PRICE_PER_PUSH_VND.toLocaleString('vi-VN')}đ / lượt</b> trừ ví.
              Xếp hạng theo <b className="text-white">từng danh mục</b> (vd. tài khoản, tăng tương tác): mỗi danh mục
              có trang riêng nên có thể cùng lúc nhiều gian <b className="text-white">Top 1 + Tài trợ</b>.
              Gian có <b className="text-white">tổng lượt đẩy 3 ngày liên tiếp cao nhất trong danh mục</b> giữ Top 1
              (hòa điểm thì <b className="text-white">ai đẩy sau</b> thắng); lượt đẩy ở danh mục khác không ảnh hưởng.
            </p>
            <p className="text-sm font-bold text-blue-100">
              Số dư ví: {walletBalanceVnd.toLocaleString('vi-VN')}đ
            </p>
            <div className="pt-2 flex items-center gap-2">
              <div className="bg-yellow-400 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                Đồng bộ
              </div>
              <p className="text-sm font-bold text-white">
                Dữ liệu lưu trên trình duyệt — khách vào trang chủ sẽ thấy gian Top 1 ngay sau khi đẩy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBoostLeaderboardOpen(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap shrink-0"
          >
            <Trophy size={18} />
            Bảng xếp hạng
          </button>
        </div>
      </motion.div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Hành động</th>
                <th className="px-6 py-4 font-semibold">Gian hàng / Danh mục</th>
                <th className="px-6 py-4 font-semibold text-center">Hạng</th>
                <th className="px-6 py-4 font-semibold text-center">Đẩy hôm nay</th>
                <th className="px-6 py-4 font-semibold text-center">Tổng lượt đẩy 3 ngày liên tiếp</th>
                <th className="px-6 py-4 font-semibold text-center">Hành động Auto</th>
                <th className="px-6 py-4 font-semibold text-center">Lên Top 1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                    Chưa có gian hàng «Đang bán». Tạo hoặc duyệt gian trong Quản lý gian hàng trước.
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <BoostStoreRow
                    key={store.id}
                    store={store}
                    onBoost={() => openBoostModal(store, 'manual')}
                    onOpenSettings={(tab) => openBoostModal(store, tab)}
                    onQuickTop1={() => applyBoost(store.id, BOOST_INSTANT_TOP1_PUSH_COUNT)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isBoostLeaderboardOpen && (
          <BoostLeaderboardModal stores={stores} onClose={() => setIsBoostLeaderboardOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBoostModalOpen && selectedStore && (
          <BoostModal
            store={selectedStore}
            activeTab={activeBoostTab}
            setActiveTab={setActiveBoostTab}
            onClose={() => setIsBoostModalOpen(false)}
            walletBalanceVnd={walletBalanceVnd}
            onManualBoost={(count) => {
              if (applyBoost(selectedStore.id, count)) setIsBoostModalOpen(false);
            }}
            onInstantTop1={() => {
              if (applyBoost(selectedStore.id, BOOST_INSTANT_TOP1_PUSH_COUNT)) {
                setIsBoostModalOpen(false);
              }
            }}
            onSaveSettings={(patch) => {
              onTop1StateChange(patchGianHangBoostSettings(top1State, selectedStore.id, patch));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BoostStoreRow({
  store,
  onBoost,
  onOpenSettings,
  onQuickTop1,
}: {
  store: BoostStore;
  onBoost: () => void;
  onOpenSettings: (tab: BoostTab) => void;
  onQuickTop1: () => void;
}) {
  const isTop1 = store.rank === 'Top 1';
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="px-6 py-5">
        <button
          type="button"
          onClick={onBoost}
          className="w-10 h-10 rounded-full border border-blue-100 flex items-center justify-center text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm"
        >
          <Zap size={18} />
        </button>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">{store.name}</span>
            <Copy size={14} className="text-gray-300 cursor-pointer hover:text-gray-500 shrink-0" />
            <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500 font-medium shrink-0">
              <User size={10} />
              <span>{store.ownerName}</span>
            </div>
          </div>
          <span className="text-xs text-gray-400">
            {store.category} · ID: {store.id} · {store.createdAt}
          </span>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex justify-center">
          <BoostRankBadge rank={store.rank} isSponsored={store.status === 'Tài trợ'} />
        </div>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="font-bold">{store.boostsToday}</span>
        <span className="text-xs text-gray-400 ml-1">lần</span>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="font-bold">{store.daysAtTop1}</span>
        <span className="text-xs text-gray-400 ml-1">lượt</span>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col items-center gap-1">
          {store.isAutoBoostEnabled ? (
            <button
              type="button"
              onClick={() => onOpenSettings('auto')}
              className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors"
              title="Mở cài đặt Auto đẩy"
            >
              <Clock size={10} />
              <span>
                Auto {store.autoBoostDailyCount}/ngày · {String(store.autoBoostRunHour).padStart(2, '0')}:00
              </span>
            </button>
          ) : null}
          {store.isKeepTopEnabled ? (
            <button
              type="button"
              onClick={() => onOpenSettings('keep-top')}
              className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100 hover:bg-green-100 transition-colors"
              title="Mở cài đặt Giữ Top 1"
            >
              <ShieldCheck size={10} />
              <span>Giữ Top 1 · min {store.keepTopMinDailyBoosts} lượt</span>
            </button>
          ) : null}
          {!store.isAutoBoostEnabled && !store.isKeepTopEnabled && (
            <button
              type="button"
              onClick={() => onOpenSettings('auto')}
              className="text-[10px] text-gray-400 italic hover:text-blue-600 hover:underline"
            >
              Cài đặt Auto
            </button>
          )}
        </div>
      </td>
      <td className="px-6 py-5 text-center">
        {store.status === 'Tài trợ' ? (
          <div className="flex items-center justify-center gap-1 text-orange-500 font-bold text-sm">
            <span>Top 1 · Tài trợ</span>
            <Trophy size={16} />
          </div>
        ) : isTop1 ? (
          <div className="flex items-center justify-center gap-1 text-blue-600 font-bold text-sm">
            <span>Đang giữ Top 1</span>
            <Trophy size={16} className="text-blue-500" />
          </div>
        ) : (
          <button
            type="button"
            onClick={onQuickTop1}
            className="flex items-center justify-center gap-1 text-blue-500 text-sm font-medium hover:underline mx-auto"
          >
            <ChevronUp size={16} />
            <span>
              Đẩy top ngay ·{' '}
              {(BOOST_INSTANT_TOP1_PUSH_COUNT * store.boostPrice).toLocaleString('vi-VN')}đ
            </span>
          </button>
        )}
      </td>
    </tr>
  );
}

function BoostRankBadge({ rank, isSponsored }: { rank: BoostRank; isSponsored?: boolean }) {
  if (rank === 'Top 1') {
    return (
      <div className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm">
        <Trophy size={12} />
        <span>Top 1</span>
        {isSponsored && (
          <>
            <span className="mx-1 opacity-50">•</span>
            <Zap size={10} />
            <span>Tài trợ</span>
          </>
        )}
      </div>
    );
  }
  if (rank === 'Top 2') {
    return (
      <div className="flex items-center gap-1 bg-slate-300 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
        <Trophy size={12} />
        <span>Top 2</span>
      </div>
    );
  }
  if (rank === 'Top 3') {
    return (
      <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase">
        <Trophy size={12} />
        <span>Top 3</span>
      </div>
    );
  }
  return (
    <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-bold">
      #{typeof rank === 'number' ? rank : '—'}
    </div>
  );
}

function formatVnd(n: number): string {
  return `${Math.round(n).toLocaleString('vi-VN')}đ`;
}

function BoostStepper({
  value,
  onChange,
  min = 1,
  max = 500,
  unit = 'lần',
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50"
      >
        <Minus size={18} />
      </button>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tabular-nums">{value}</span>
        <span className="text-gray-400 text-sm">{unit}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

function BoostModal({
  store,
  activeTab,
  setActiveTab,
  onClose,
  walletBalanceVnd,
  onManualBoost,
  onInstantTop1,
  onSaveSettings,
}: {
  store: BoostStore;
  activeTab: BoostTab;
  setActiveTab: (t: BoostTab) => void;
  onClose: () => void;
  walletBalanceVnd: number;
  onManualBoost: (count: number) => void;
  onInstantTop1: () => void;
  onSaveSettings: (patch: GianHangBoostSettingsPatch) => void;
}) {
  const [boostCount, setBoostCount] = useState(1);
  const [isAutoEnabled, setIsAutoEnabled] = useState(store.isAutoBoostEnabled);
  const [autoBoostCount, setAutoBoostCount] = useState(store.autoBoostDailyCount);
  const [autoRunHour, setAutoRunHour] = useState(store.autoBoostRunHour);
  const [isPauseAtTop1, setIsPauseAtTop1] = useState(store.autoBoostPauseAtTop1);
  const [isProtectEnabled, setIsProtectEnabled] = useState(store.isKeepTopEnabled);
  const [keepMinDaily, setKeepMinDaily] = useState(store.keepTopMinDailyBoosts);
  const [keepMaxSpend, setKeepMaxSpend] = useState(store.keepTopMaxSpendVnd);
  const [keepReactWhenLost, setKeepReactWhenLost] = useState(store.keepTopReactWhenLost);
  const [saveNotice, setSaveNotice] = useState<{ text: string; tone: 'success' | 'info' } | null>(null);
  const saveNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current);
    };
  }, []);

  const flashSaveNotice = (text: string, tone: 'success' | 'info' = 'success') => {
    setSaveNotice({ text, tone });
    if (saveNoticeTimerRef.current) clearTimeout(saveNoticeTimerRef.current);
    saveNoticeTimerRef.current = setTimeout(() => setSaveNotice(null), 4500);
  };

  useEffect(() => {
    setIsAutoEnabled(store.isAutoBoostEnabled);
    setAutoBoostCount(store.autoBoostDailyCount);
    setAutoRunHour(store.autoBoostRunHour);
    setIsPauseAtTop1(store.autoBoostPauseAtTop1);
    setIsProtectEnabled(store.isKeepTopEnabled);
    setKeepMinDaily(store.keepTopMinDailyBoosts);
    setKeepMaxSpend(store.keepTopMaxSpendVnd);
    setKeepReactWhenLost(store.keepTopReactWhenLost);
  }, [store.id, store.isAutoBoostEnabled, store.autoBoostDailyCount, store.autoBoostRunHour, store.autoBoostPauseAtTop1, store.isKeepTopEnabled, store.keepTopMinDailyBoosts, store.keepTopMaxSpendVnd, store.keepTopReactWhenLost]);

  useEffect(() => {
    setSaveNotice(null);
  }, [activeTab]);

  const manualCostVnd = boostCount * store.boostPrice;
  const instantCostVnd = BOOST_INSTANT_TOP1_PUSH_COUNT * store.boostPrice;
  const autoEstCost = autoBoostCount * store.boostPrice;
  const keepEstCost = Math.min(keepMaxSpend, keepMinDaily * store.boostPrice);
  const canAffordManual = walletBalanceVnd >= manualCostVnd;
  const canAffordInstant = walletBalanceVnd >= instantCostVnd;

  const saveAuto = () => {
    onSaveSettings({
      isAutoBoostEnabled: isAutoEnabled,
      autoBoostDailyCount: autoBoostCount,
      autoBoostRunHour: autoRunHour,
      autoBoostPauseAtTop1: isPauseAtTop1,
    });
    if (isAutoEnabled) {
      flashSaveNotice(
        `Đã lưu Auto đẩy thành công — ${autoBoostCount} lượt/ngày lúc ${String(autoRunHour).padStart(2, '0')}:00` +
          (isPauseAtTop1 ? ', tạm dừng khi đã Top 1.' : '.'),
        'success'
      );
    } else {
      flashSaveNotice('Đã lưu cài đặt Auto đẩy (đang tắt).', 'info');
    }
  };

  const saveKeepTop = () => {
    onSaveSettings({
      isKeepTopEnabled: isProtectEnabled,
      keepTopMinDailyBoosts: keepMinDaily,
      keepTopMaxSpendVnd: keepMaxSpend,
      keepTopReactWhenLost: keepReactWhenLost,
    });
    if (isProtectEnabled) {
      flashSaveNotice(
        `Đã lưu Giữ Top 1 thành công — tối thiểu ${keepMinDaily} lượt/ngày, trần ${keepMaxSpend.toLocaleString('vi-VN')}đ` +
          (keepReactWhenLost ? ', tự đẩy khi mất Top 1.' : '.'),
        'success'
      );
    } else {
      flashSaveNotice('Đã lưu cài đặt Giữ Top 1 (đang tắt).', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 pb-4 flex justify-between items-start sticky top-0 bg-white z-10 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0">
              <Zap size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{store.name}</h3>
              <p className="text-xs text-gray-400">
                {store.category} · {store.location}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0 ml-2">
            <X size={22} />
          </button>
        </div>

        <div className="px-6 pt-5 grid grid-cols-3 gap-3 mb-5">
          {[
            {
              icon: <Trophy size={18} className="text-orange-500" />,
              label: 'Hạng',
              value: store.rank.toString(),
            },
            { label: 'Đẩy hôm nay', value: store.boostsToday.toString() },
            { label: '3 ngày LT', value: store.daysAtTop1.toString() },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-xl p-3 flex flex-col items-center justify-center text-center border border-gray-100"
            >
              {s.icon && <div className="mb-1">{s.icon}</div>}
              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">{s.label}</p>
              <p className="font-bold text-lg">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="px-6 mb-5">
          <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
            {(
              [
                ['manual', 'Đẩy thủ công', null],
                ['auto', 'Auto đẩy', <Clock size={13} key="c" />],
                ['keep-top', 'Giữ Top 1', <ShieldCheck size={13} key="s" />],
              ] as [BoostTab, string, React.ReactNode][]
            ).map(([key, label, icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-8">
          <AnimatePresence>
            {saveNotice && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold ${
                  saveNotice.tone === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {saveNotice.tone === 'success' ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="shrink-0 text-slate-500 mt-0.5" />
                )}
                <span>{saveNotice.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'manual' && (
            <div className="space-y-5">
              <p className="text-xs text-center text-gray-500 font-medium">
                Phí: <span className="font-bold text-blue-600">{formatVnd(store.boostPrice)}</span>/lượt · Số dư:{' '}
                <span className="font-bold">{formatVnd(walletBalanceVnd)}</span>
              </p>
              <div className="border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-bold mb-4">Số lần đẩy</p>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setBoostCount(Math.max(1, boostCount - 1))}
                    className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{boostCount}</span>
                    <span className="text-gray-400 text-sm">lần</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBoostCount(Math.min(500, boostCount + 1))}
                    className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-center text-sm font-bold text-slate-700 mt-2">
                  Tổng: {formatVnd(manualCostVnd)}
                </p>
              </div>
              <button
                type="button"
                disabled={!canAffordManual}
                onClick={() => onManualBoost(boostCount)}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={16} />
                Đẩy {boostCount} lần · {formatVnd(manualCostVnd)}
              </button>
              {!canAffordManual && (
                <p className="text-xs text-center text-rose-600 font-medium">Số dư không đủ để đẩy.</p>
              )}
              <button
                type="button"
                disabled={!canAffordInstant}
                onClick={onInstantTop1}
                className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trophy size={16} />
                Lên Top 1 ngay (+{BOOST_INSTANT_TOP1_PUSH_COUNT} lượt · {formatVnd(instantCostVnd)})
              </button>
            </div>
          )}

          {activeTab === 'auto' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                <div>
                  <p className="font-bold">Bật Auto đẩy hằng ngày</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isAutoEnabled
                      ? `Chạy lúc ${String(autoRunHour).padStart(2, '0')}:00 mỗi ngày`
                      : 'Tắt — không tự đẩy'}
                  </p>
                </div>
                <BoostToggle enabled={isAutoEnabled} setEnabled={setIsAutoEnabled} />
              </div>

              <div
                className={`space-y-4 transition-opacity ${isAutoEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
              >
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-bold mb-3">Số lượt đẩy mỗi ngày</p>
                  <BoostStepper value={autoBoostCount} onChange={setAutoBoostCount} min={1} max={100} />
                  <p className="text-[11px] text-gray-400 mt-3 text-center">
                    Gợi ý: 15–30 lượt/ngày để cạnh tranh Top 3 ngày
                  </p>
                </div>

                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-bold mb-2">Giờ chạy auto</p>
                  <select
                    value={autoRunHour}
                    onChange={(e) => setAutoRunHour(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>
                        {String(h).padStart(2, '0')}:00 — {h < 12 ? 'sáng' : h < 18 ? 'chiều' : 'tối'}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-start gap-3 border border-blue-100 rounded-xl p-4 bg-blue-50/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPauseAtTop1}
                    onChange={(e) => setIsPauseAtTop1(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-800">Tạm dừng khi đã Top 1</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Không đẩy thêm trong ngày nếu gian đang giữ Top 1 (tiết kiệm phí).
                    </p>
                  </div>
                </label>

                <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wide mb-1">
                    Ước tính chi phí / ngày
                  </p>
                  <p className="text-lg font-black text-blue-700">
                    {formatVnd(autoEstCost)}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {autoBoostCount} lượt × {formatVnd(store.boostPrice)}/lượt
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={saveAuto}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={16} />
                Lưu cài đặt Auto đẩy
              </button>
            </div>
          )}

          {activeTab === 'keep-top' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                <div>
                  <p className="font-bold">Bật Giữ Top 1</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isProtectEnabled
                      ? 'Tự duy trì lượt đẩy để không bị vượt hạng'
                      : 'Tắt — chỉ đẩy thủ công'}
                  </p>
                </div>
                <BoostToggle enabled={isProtectEnabled} setEnabled={setIsProtectEnabled} />
              </div>

              <div
                className={`space-y-4 transition-opacity ${isProtectEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
              >
                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-bold mb-3">Lượt đẩy tối thiểu mỗi ngày</p>
                  <BoostStepper value={keepMinDaily} onChange={setKeepMinDaily} min={5} max={200} />
                  <p className="text-[11px] text-gray-400 mt-3 text-center">
                    Hệ thống ưu tiên đạt ít nhất số lượt này khi bật Giữ Top 1
                  </p>
                </div>

                <div className="border border-gray-100 rounded-xl p-4">
                  <p className="text-sm font-bold mb-2">Trần chi tiêu / ngày (VND)</p>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={keepMaxSpend}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setKeepMaxSpend(Number.isFinite(n) ? Math.max(0, n) : 0);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-bold text-gray-800 tabular-nums focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[500_000, 1_200_000, 2_000_000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setKeepMaxSpend(preset)}
                        className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        {formatVnd(preset)}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-start gap-3 border border-emerald-100 rounded-xl p-4 bg-emerald-50/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepReactWhenLost}
                    onChange={(e) => setKeepReactWhenLost(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-800">Đẩy ngay khi mất Top 1</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Khi gian khác vượt tổng lượt 3 ngày, tự đẩy thêm (trong giới hạn ngân sách).
                    </p>
                  </div>
                </label>

                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/30 p-3 text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wide mb-1">
                    Ngân sách ước tính / ngày
                  </p>
                  <p className="text-lg font-black text-emerald-800">{formatVnd(keepEstCost)}</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tối đa {formatVnd(keepMaxSpend)} hoặc {keepMinDaily} lượt × {formatVnd(store.boostPrice)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={saveKeepTop}
                className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} />
                Lưu cài đặt Giữ Top 1
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function BoostLeaderboardModal({ stores, onClose }: { stores: BoostStore[]; onClose: () => void }) {
  const categories = ['Tất cả', ...Array.from(new Set(stores.map((s) => s.category)))];
  const [selectedCat, setSelectedCat] = useState('Tất cả');
  const filtered = stores
    .filter((s) => selectedCat === 'Tất cả' || s.category === selectedCat)
    .sort((a, b) => b.daysAtTop1 - a.daysAtTop1);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="flex items-center gap-3">
            <Trophy size={26} />
            <div>
              <h3 className="font-black text-xl uppercase tracking-tight">Bảng xếp hạng Top 3 ngày</h3>
              <p className="text-xs opacity-80">3 ngày liên tiếp — hòa điểm: gian đẩy sau (mới nhất) lên Top 1</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.map((store, i) => (
            <div
              key={store.id}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 mb-3"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 font-black text-xl shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-800 truncate">{store.name}</h4>
                <p className="text-xs text-gray-400">{store.category}</p>
              </div>
              <div className="text-orange-500 font-black shrink-0">{store.daysAtTop1} lượt</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function BoostToggle({
  enabled,
  setEnabled,
}: {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${enabled ? 'left-7' : 'left-1'}`}
      />
    </button>
  );
}
