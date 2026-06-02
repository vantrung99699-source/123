/**
 * UserManagementView - Quản lý người dùng
 */

import { useState, useEffect, useMemo, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MoreHorizontal,
  Wallet,
  ShoppingBag,
  History,
  Pencil,
  Ban,
  LogIn,
  X,
  ChevronDown,
} from 'lucide-react';
import type { AdminUser, PaymentHistory } from './types';
import type { Order } from '../ordersTypes';
import { ADMIN_USERS } from './data';
import { mergeAdminUsersWithStorefront } from './mergeStorefrontUsersForAdmin';
import { getAdminUserBalanceVnd, setStorefrontWalletVndForEmail } from '../auth/storefrontWalletByEmail';
import { appendAdminUserLedgerEntry } from './userProfileAdmin';
import {
  getUserResellerWalletVnd,
  getUserResellerCommissionTotalVnd,
  getUserSellerRoleWalletVnd,
  getUserSellerPayoutTotalVnd,
} from './userFinanceAdmin';
import {
  UserPaymentHistoryModal,
  UserEditModal,
  UserBanConfirmModal,
  UserResellerDetailModal,
  UserSellerSalesDetailModal,
} from './UserAdminModals';
import { adminLoginAsStorefrontUser } from '../auth/adminImpersonateStorefront';

const parseVndAmount = (s: string) => Number(String(s).replace(/\D/g, '')) || 0;
const formatVnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)} đ`;

const StatusBadge = ({ status }: { status: AdminUser['status'] }) => {
  const styles: Record<string, string> = {
    'Hoạt động': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Bị cấm': 'bg-red-50 text-red-600 border-red-100',
    'Chờ xác nhận': 'bg-amber-50 text-amber-600 border-amber-100',
    'Nghi spam': 'bg-orange-50 text-orange-600 border-orange-100',
    'Khóa chat': 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${styles[status] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
      {status}
    </span>
  );
};

type BalanceOp = 'Cộng tiền' | 'Trừ tiền' | 'Đặt lại số dư';

const BalanceModal = ({
  user,
  onClose,
  onApplied,
}: {
  user: AdminUser;
  onClose: () => void;
  onApplied: () => void;
}) => {
  const [activeTab, setActiveTab] = useState('Thanh toán');
  const [op, setOp] = useState<BalanceOp>('Cộng tiền');
  const [amountStr, setAmountStr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fallbackStatic = parseVndAmount(user.balance);
  const currentVnd = getAdminUserBalanceVnd(user.email, fallbackStatic);

  const transactions = [
    { id: '#181', date: '2026-03-17 10:00', amount: '+1.000.000 đ', desc: 'Cộng bởi admin cho người dùng', tag: 'BONUS', tagColor: 'bg-emerald-50 text-emerald-600' },
    { id: '#108', date: '2026-03-10 16:35', amount: '+11.000.000 đ', desc: 'Nạp qua Manual: 10tr + bonus 10% = 11tr', tag: 'Manual', tagColor: 'bg-slate-100 text-slate-600' },
    { id: '#107', date: '2026-03-10 16:35', amount: '+10.000.000 đ', desc: 'Cộng bởi admin cho người dùng', tag: 'BONUS', tagColor: 'bg-emerald-50 text-emerald-600' },
    { id: '#95', date: '2026-03-09 15:52', amount: '-5.000.000 đ', desc: 'Trừ thủ công bởi admin', tag: 'Trừ', tagColor: 'bg-red-50 text-red-600' },
    { id: '#88', date: '2026-03-05 09:14', amount: '+3.000.000 đ', desc: 'Nạp qua VNPay', tag: 'VNPay', tagColor: 'bg-blue-50 text-blue-600' },
  ];

  const handleConfirm = () => {
    const delta = parseVndAmount(amountStr);
    if (op === 'Đặt lại số dư') {
      if (amountStr.trim() === '' || Number.isNaN(delta)) {
        setFormError('Nhập số dư mới (VND).');
        return;
      }
      setStorefrontWalletVndForEmail(user.email, delta);
      appendAdminUserLedgerEntry(user.email, {
        kind: 'set_balance',
        amountVnd: delta - currentVnd,
        label: 'Admin đặt lại số dư',
        detail: formatVnd(delta),
      });
    } else {
      if (delta <= 0) {
        setFormError('Nhập số tiền lớn hơn 0.');
        return;
      }
      if (op === 'Cộng tiền') {
        setStorefrontWalletVndForEmail(user.email, currentVnd + delta);
        appendAdminUserLedgerEntry(user.email, {
          kind: 'topup',
          amountVnd: delta,
          label: 'Admin cộng tiền ví',
        });
      } else {
        setStorefrontWalletVndForEmail(user.email, Math.max(0, currentVnd - delta));
        appendAdminUserLedgerEntry(user.email, {
          kind: 'deduct',
          amountVnd: -delta,
          label: 'Admin trừ tiền ví',
        });
      }
    }
    setFormError(null);
    onApplied();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Wallet size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Chỉnh sửa số dư</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-center text-[11px] text-slate-500 mb-1 font-medium">{user.email}</p>
          <div className="text-center mb-6">
            <div className="text-4xl font-extrabold text-blue-600 tracking-tight">{formatVnd(currentVnd)}</div>
            <p className="text-[10px] text-slate-400 mt-1">Số dư hiện tại (đồng bộ ví theo email)</p>
          </div>

          <div className="space-y-6 mb-8">
            <div>
              <label htmlFor="balance-op" className="block text-sm font-bold text-slate-700 mb-2">
                Phương thức
              </label>
              <div className="relative">
                <select
                  id="balance-op"
                  value={op}
                  onChange={(e) => {
                    setOp(e.target.value as BalanceOp);
                    setFormError(null);
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="Cộng tiền">Cộng tiền</option>
                  <option value="Trừ tiền">Trừ tiền</option>
                  <option value="Đặt lại số dư">Đặt lại số dư</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label htmlFor="balance-amount" className="block text-sm font-bold text-slate-700 mb-2">
                {op === 'Đặt lại số dư' ? 'Số dư mới (VND)' : 'Số tiền (VND)'}
              </label>
              <input
                id="balance-amount"
                type="text"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder={op === 'Đặt lại số dư' ? 'Ví dụ: 500000' : 'Ví dụ: 1000000'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none"
              />
            </div>
            {formError && (
              <p className="text-[11px] font-semibold text-rose-600" role="alert">
                {formError}
              </p>
            )}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Ghi chú</label>
              <textarea rows={3} placeholder="Nhập ghi chú (tùy chọn)..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 transition-all outline-none resize-none" />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-700">Lịch sử giao dịch (mẫu)</h4>
              <div className="flex gap-1 flex-wrap">
                {['Thanh toán', 'Bonus', 'Manual'].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-white'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tx.tagColor}`}>{tx.tag}</span>
                    <div>
                      <p className="text-xs font-medium text-slate-700">{tx.desc}</p>
                      <p className="text-[10px] text-slate-400">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${tx.amount.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Xác nhận
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const UserCombinedStatCard = ({
  title,
  todayLabel,
  totalValue,
  todayValue,
  icon: Icon,
  colorClass = 'text-blue-600',
}: {
  title: string;
  todayLabel: string;
  totalValue: string;
  todayValue: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  colorClass?: string;
}) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 flex-1 min-w-[240px]">
    <div className="flex items-center justify-between gap-2">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass.replace('text-', 'bg-').replace('600', '50')} ${colorClass}`}
      >
        <Icon size={20} />
      </div>
      <div className="text-right min-w-0">
        <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase block mb-0.5 leading-tight">
          {todayLabel}
        </span>
        <span className={`text-base font-bold ${colorClass} whitespace-nowrap`}>{todayValue}</span>
      </div>
    </div>
    <div>
      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-0.5">{title}</span>
      <div className="text-2xl font-black text-slate-900 tracking-tight">{totalValue}</div>
    </div>
  </div>
);

const STATUS_OPTIONS: Array<'Tất cả' | AdminUser['status']> = [
  'Tất cả',
  'Hoạt động',
  'Bị cấm',
  'Chờ xác nhận',
  'Khóa chat',
  'Nghi spam',
];

type UserModalKind =
  | 'payment-history'
  | 'edit'
  | 'ban'
  | 'reseller-detail'
  | 'seller-detail'
  | null;

export interface UserManagementViewProps {
  orders?: Order[];
  extraPaymentHistory?: PaymentHistory[];
}

export function UserManagementView({
  orders = [],
  extraPaymentHistory = [],
}: UserManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tất cả' | AdminUser['status']>('Tất cả');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalUser, setModalUser] = useState<AdminUser | null>(null);
  const [modalKind, setModalKind] = useState<UserModalKind>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [listRevision, setListRevision] = useState(0);

  const openModal = (user: AdminUser, kind: Exclude<UserModalKind, null>) => {
    setActiveDropdown(null);
    setModalUser(user);
    setModalKind(kind);
  };

  const handleLoginAsUser = (user: AdminUser) => {
    setActiveDropdown(null);
    const result = adminLoginAsStorefrontUser(user);
    if (!result.ok) {
      window.alert(result.message);
    }
  };

  useEffect(() => {
    const bump = () => setListRevision((r) => r + 1);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'taphoammo_storefront_demo_accounts' ||
        e.key === 'taphoammo_storefront_wallet_by_email' ||
        e.key === 'taphoammo_admin_user_ban_by_email' ||
        e.key === 'taphoammo_storefront_ho_va_ten_by_email' ||
        e.key === 'taphoammo_storefront_wallet_by_role_v1'
      ) {
        bump();
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', bump);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', bump);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as HTMLElement;
      if (!t.closest('[data-user-action-menu]')) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mergedUsers = useMemo(() => mergeAdminUsersWithStorefront(ADMIN_USERS), [listRevision]);

  const filteredUsers = mergedUsers.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Tất cả' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { totalDeposit, totalSpent, todayDeposit, todaySpent } = useMemo(() => {
    let td = 0;
    let ts = 0;
    for (const u of mergedUsers) {
      td += parseVndAmount(u.totalDeposit);
      ts += parseVndAmount(u.totalSpent);
    }
    const roundNice = (n: number) => Math.max(0, Math.round(n / 50_000) * 50_000);
    return {
      totalDeposit: td,
      totalSpent: ts,
      todayDeposit: roundNice(td * 0.055),
      todaySpent: roundNice(ts * 0.052),
    };
  }, [mergedUsers]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-y-auto"
    >
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Quản lý người dùng</h2>
          <p className="text-slate-500 text-sm">Danh sách tài khoản và thông tin người dùng</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 mb-6">
        <UserCombinedStatCard
          title="Tổng tiền nạp"
          todayLabel="Tổng nạp hôm nay"
          totalValue={formatVnd(totalDeposit)}
          todayValue={formatVnd(todayDeposit)}
          icon={Wallet}
          colorClass="text-blue-600"
        />
        <UserCombinedStatCard
          title="Tổng tiêu"
          todayLabel="Tổng tiêu hôm nay"
          totalValue={formatVnd(totalSpent)}
          todayValue={formatVnd(todaySpent)}
          icon={ShoppingBag}
          colorClass="text-emerald-600"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative shrink-0 w-full min-[480px]:w-auto min-[480px]:min-w-[200px]">
          <label htmlFor="user-status-filter" className="sr-only">
            Lọc theo trạng thái
          </label>
          <select
            id="user-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="w-full appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm username, tên, email..."
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
                <th className="px-6 py-4 border-r border-slate-100">STT / ID</th>
                <th className="px-4 py-4 border-r border-slate-100">Người dùng</th>
                <th className="px-4 py-4 border-r border-slate-100">Số dư</th>
                <th className="px-4 py-4 border-r border-slate-100">Tổng nạp / Tổng tiêu</th>
                <th className="px-4 py-4 border-r border-slate-100 text-right min-w-[140px]">Ví Reseller / Tổng HH</th>
                <th className="px-4 py-4 border-r border-slate-100 text-right min-w-[140px]">Ví rút / Đã bán</th>
                <th className="px-4 py-4 border-r border-slate-100 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user, idx) => {
                const resellerWalletVnd = getUserResellerWalletVnd(user.email);
                const resellerTotalVnd = getUserResellerCommissionTotalVnd(user, orders);
                const sellerWalletVnd = getUserSellerRoleWalletVnd(user.email);
                const sellerSoldTotalVnd = getUserSellerPayoutTotalVnd(user, orders);
                return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 border-r border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900">#{user.stt}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{user.userId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-r border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${user.avatarColor} flex items-center justify-center text-xs font-bold`}>
                        {(user.username[0] || user.name[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <p className="text-sm font-bold text-slate-900 font-mono">{user.username}</p>
                        <p className="text-xs text-slate-400 font-medium break-all">
                          <span className="text-slate-600">{user.email}</span>
                          <span className="text-slate-300 mx-1">·</span>
                          <span>{user.createdAt}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-r border-slate-100">
                    <span className="text-sm font-bold text-emerald-600">{user.balance}</span>
                  </td>
                  <td className="px-4 py-4 border-r border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-600">Nạp: <b className="text-emerald-600">{user.totalDeposit}</b></span>
                      <span className="text-xs font-medium text-slate-600">Tiêu: <b className="text-slate-700">{user.totalSpent}</b></span>
                    </div>
                  </td>
                  <td className="px-4 py-4 border-r border-slate-100 text-right">
                    <button
                      type="button"
                      onClick={() => openModal(user, 'reseller-detail')}
                      className="w-full text-right hover:bg-violet-50/80 rounded-lg px-1 py-0.5 transition-colors"
                      title="Xem chi tiết Reseller"
                    >
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-xs font-medium text-slate-600">
                          Ví: <b className="text-violet-600">{formatVnd(resellerWalletVnd)}</b>
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          Tổng: <b className="text-violet-700">{formatVnd(resellerTotalVnd)}</b>
                        </span>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-4 border-r border-slate-100 text-right">
                    <button
                      type="button"
                      onClick={() => openModal(user, 'seller-detail')}
                      className="w-full text-right hover:bg-emerald-50/80 rounded-lg px-1 py-0.5 transition-colors"
                      title="Xem chi tiết đã bán"
                    >
                      <div className="flex flex-col gap-1 items-end">
                        <span className="text-xs font-medium text-slate-600">
                          Ví rút: <b className="text-emerald-600">{formatVnd(sellerWalletVnd)}</b>
                        </span>
                        <span className="text-xs font-medium text-slate-600">
                          Đã bán: <b className="text-emerald-700">{formatVnd(sellerSoldTotalVnd)}</b>
                        </span>
                      </div>
                    </button>
                  </td>
                  <td className="px-4 py-4 border-r border-slate-100 text-center">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-4 text-center relative">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all"
                        title="Quản lý số dư"
                      >
                        <Wallet size={18} />
                      </button>
                      <div className="relative" data-user-action-menu>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === user.id ? null : user.id);
                          }}
                          className={`p-2 rounded-lg transition-all ${activeDropdown === user.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        <AnimatePresence>
                          {activeDropdown === user.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() => openModal(user, 'payment-history')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <History size={16} /> Lịch sử thanh toán
                              </button>
                              <div className="h-px bg-slate-50 my-1 mx-2" />
                              <button
                                type="button"
                                onClick={() => openModal(user, 'edit')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <Pencil size={16} /> Chỉnh sửa người dùng
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLoginAsUser(user)}
                                disabled={user.status === 'Bị cấm'}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  user.status === 'Bị cấm'
                                    ? 'Tài khoản bị cấm'
                                    : 'Mở storefront đăng nhập thay người dùng này'
                                }
                              >
                                <LogIn size={16} /> Đăng nhập với tư cách người dùng
                              </button>
                              <div className="h-px bg-slate-50 my-1 mx-2" />
                              <button
                                type="button"
                                onClick={() => openModal(user, 'ban')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-orange-500 hover:bg-orange-50 transition-colors"
                              >
                                <Ban size={16} /> Cấm tài khoản
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </td>
                </motion.tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {selectedUser && (
          <BalanceModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onApplied={() => setListRevision((r) => r + 1)}
          />
        )}
        {modalUser && modalKind === 'payment-history' && (
          <UserPaymentHistoryModal
            user={modalUser}
            orders={orders}
            extraPaymentHistory={extraPaymentHistory}
            onClose={() => {
              setModalUser(null);
              setModalKind(null);
            }}
          />
        )}
        {modalUser && modalKind === 'edit' && (
          <UserEditModal
            user={modalUser}
            onClose={() => {
              setModalUser(null);
              setModalKind(null);
            }}
            onSaved={() => setListRevision((r) => r + 1)}
          />
        )}
        {modalUser && modalKind === 'ban' && (
          <UserBanConfirmModal
            user={modalUser}
            onClose={() => {
              setModalUser(null);
              setModalKind(null);
            }}
            onBanned={() => setListRevision((r) => r + 1)}
          />
        )}
        {modalUser && modalKind === 'reseller-detail' && (
          <UserResellerDetailModal
            user={modalUser}
            orders={orders}
            onClose={() => {
              setModalUser(null);
              setModalKind(null);
            }}
          />
        )}
        {modalUser && modalKind === 'seller-detail' && (
          <UserSellerSalesDetailModal
            user={modalUser}
            orders={orders}
            onClose={() => {
              setModalUser(null);
              setModalKind(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
