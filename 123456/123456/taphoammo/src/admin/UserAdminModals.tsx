/**
 * Modals cho Quản lý người dùng (admin).
 */
import { useState, type ComponentType, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  History,
  Pencil,
  Ban,
  X,
  User,
  Phone,
  Mail,
  ExternalLink,
  ShieldOff,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import type { AdminUser } from './types';
import type { Order } from '../ordersTypes';
import type { PaymentHistory } from './types';
import {
  getAdminUserPhone,
  getAdminUserFacebook,
  saveAdminUserProfile,
  adminRemoveUser2FA,
  setAdminUserBanned,
  type SaveAdminUserProfileResult,
} from './userProfileAdmin';
import { getStorefrontHoVaTenForEmail } from '../auth/storefrontHoVaTenByEmail';
import { isStorefront2FAEnabled } from '../auth/storefront2FA';
import {
  buildUserPaymentLedgerLines,
  getUserResellerWalletVnd,
  getUserResellerOrderDetails,
  getUserSellerPayoutRows,
  getUserSellerPayoutTotalVnd,
  type UserLedgerLine,
} from './userFinanceAdmin';

const formatVnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(n)))} đ`;

const ModalShell = ({
  title,
  icon: Icon,
  accent = 'blue',
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  accent?: 'blue' | 'emerald' | 'orange';
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) => {
  const accentMap = {
    blue: 'bg-blue-600 shadow-blue-200',
    emerald: 'bg-emerald-600 shadow-emerald-200',
    orange: 'bg-orange-500 shadow-orange-200',
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${accentMap[accent]}`}
            >
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer ? <div className="p-6 border-t border-slate-100 shrink-0">{footer}</div> : null}
      </motion.div>
    </div>
  );
};

export function UserPaymentHistoryModal({
  user,
  orders,
  extraPaymentHistory,
  onClose,
}: {
  user: AdminUser;
  orders: Order[];
  extraPaymentHistory: PaymentHistory[];
  onClose: () => void;
}) {
  const lines = buildUserPaymentLedgerLines(user, orders, extraPaymentHistory);

  return (
    <ModalShell title="Lịch sử thanh toán" icon={History} accent="blue" onClose={onClose} wide>
      <p className="text-center text-[11px] text-slate-500 mb-4 font-medium">
        {user.username} · {user.email}
      </p>
      <p className="text-[10px] text-slate-400 mb-4 text-center">
        Nạp tiền, mua hàng, bán hàng, hoa hồng Reseller, rút tiền (theo đơn và ví demo).
      </p>
      {lines.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">Chưa có giao dịch.</p>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {lines.map((row: UserLedgerLine) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0"
            >
              <div className="min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 mb-1">
                  {row.typeLabel}
                </span>
                <p className="text-xs font-medium text-slate-700 truncate">{row.reason}</p>
                <p className="text-[10px] text-slate-400">
                  {row.date} · {row.code}
                </p>
              </div>
              <span
                className={`text-sm font-bold shrink-0 ${row.amountVnd >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {row.amountVnd >= 0 ? '+' : ''}
                {formatVnd(Math.abs(row.amountVnd))}
              </span>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

export function UserEditModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(
    () => getStorefrontHoVaTenForEmail(user.email) || user.name
  );
  const [phone, setPhone] = useState(() => getAdminUserPhone(user.email));
  const [email, setEmail] = useState(user.email);
  const [facebook, setFacebook] = useState(() => getAdminUserFacebook(user.email));
  const [username, setUsername] = useState(user.username);
  const [error, setError] = useState<string | null>(null);
  const has2FA = isStorefront2FAEnabled(user.email);

  const save = () => {
    const result: SaveAdminUserProfileResult = saveAdminUserProfile(user.email, {
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      facebook: facebook.trim(),
      username: username.trim(),
    });
    if (result === 'email_exists') {
      setError('Email mới đã được dùng bởi tài khoản khác.');
      return;
    }
    if (result === 'invalid') {
      setError('Email không hợp lệ.');
      return;
    }
    setError(null);
    onSaved();
    onClose();
  };

  const fields = [
    { key: 'fullName', label: 'Họ và tên', value: fullName, set: setFullName, icon: User, type: 'text' },
    { key: 'phone', label: 'Số điện thoại', value: phone, set: setPhone, icon: Phone, type: 'tel' },
    { key: 'email', label: 'Email', value: email, set: setEmail, icon: Mail, type: 'email' },
    { key: 'username', label: 'Tên đăng nhập', value: username, set: setUsername, icon: User, type: 'text' },
    {
      key: 'facebook',
      label: 'Facebook',
      value: facebook,
      set: setFacebook,
      icon: ExternalLink,
      type: 'url',
    },
  ] as const;

  return (
    <ModalShell
      title="Chỉnh sửa người dùng"
      icon={Pencil}
      accent="emerald"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            Lưu thay đổi
          </button>
        </div>
      }
    >
      <p className="text-[11px] text-slate-500 mb-4 text-center">
        Admin có thể sửa email, SĐT, họ tên — và gỡ mã 2FA.
      </p>
      <div className="space-y-3">
        {fields.map(({ key, label, value, set, icon: Icon, type }) => (
          <div key={key}>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              {label}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon size={14} className="text-slate-400" />
              </div>
              <input
                type={type}
                value={value}
                onChange={(e) => {
                  set(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="text-[11px] font-semibold text-rose-600 mt-3" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 p-4 rounded-2xl border border-slate-100 bg-slate-50">
        <p className="text-xs font-bold text-slate-700 mb-2">Xác thực 2 lớp (2FA)</p>
        <p className="text-[11px] text-slate-500 mb-3">
          {has2FA ? 'Tài khoản đang bật 2FA.' : 'Tài khoản chưa bật 2FA.'}
        </p>
        {has2FA ? (
          <button
            type="button"
            onClick={() => {
              adminRemoveUser2FA(email.trim() || user.email);
              onSaved();
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-700 text-[13px] font-semibold hover:bg-orange-100 transition-colors"
          >
            <ShieldOff size={16} />
            Gỡ mã 2FA (quyền admin)
          </button>
        ) : null}
      </div>
    </ModalShell>
  );
}

export function UserBanConfirmModal({
  user,
  onClose,
  onBanned,
}: {
  user: AdminUser;
  onClose: () => void;
  onBanned: () => void;
}) {
  const alreadyBanned = user.status === 'Bị cấm';

  return (
    <ModalShell title="Cấm tài khoản" icon={Ban} accent="orange" onClose={onClose}>
      <p className="text-sm text-slate-600 text-center mb-6">
        {alreadyBanned ? (
          <>
            Tài khoản <b className="text-slate-900">{user.username}</b> đã ở trạng thái{' '}
            <b className="text-orange-600">Bị cấm</b>.
          </>
        ) : (
          <>
            Xác nhận cấm <b className="text-slate-900">{user.username}</b> ({user.email})? Người
            dùng sẽ không thể sử dụng tài khoản khi trạng thái là Bị cấm.
          </>
        )}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
        >
          Đóng
        </button>
        {!alreadyBanned && (
          <button
            type="button"
            onClick={() => {
              setAdminUserBanned(user.email, true);
              onBanned();
              onClose();
            }}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
          >
            Cấm tài khoản
          </button>
        )}
      </div>
    </ModalShell>
  );
}

export function UserResellerDetailModal({
  user,
  orders,
  onClose,
}: {
  user: AdminUser;
  orders: Order[];
  onClose: () => void;
}) {
  const wallet = getUserResellerWalletVnd(user.email);
  const details = getUserResellerOrderDetails(user, orders);
  const totalCommission = details.reduce((s, r) => s + r.commissionVnd, 0);

  return (
    <ModalShell title="Chi tiết Reseller" icon={TrendingUp} accent="blue" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
          <p className="text-[10px] font-bold text-violet-500 uppercase">Ví Reseller</p>
          <p className="text-lg font-black text-violet-700">{formatVnd(wallet)}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng hoa hồng (đơn)</p>
          <p className="text-lg font-black text-slate-800">{formatVnd(totalCommission)}</p>
        </div>
      </div>
      {details.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">Chưa có đơn Reseller.</p>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase">
              <th className="pb-2">Mã đơn</th>
              <th className="pb-2">Sản phẩm</th>
              <th className="pb-2 text-right">Hoa hồng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {details.map((r) => (
              <tr key={r.orderId}>
                <td className="py-2 font-mono text-slate-600">{r.orderId}</td>
                <td className="py-2 text-slate-700">{r.productName}</td>
                <td className="py-2 text-right font-bold text-emerald-600">
                  {formatVnd(r.commissionVnd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModalShell>
  );
}

export function UserSellerSalesDetailModal({
  user,
  orders,
  onClose,
}: {
  user: AdminUser;
  orders: Order[];
  onClose: () => void;
}) {
  const totalSold = getUserSellerPayoutTotalVnd(user, orders);
  const rows = getUserSellerPayoutRows(user, orders);

  return (
    <ModalShell title="Chi tiết đã bán" icon={ShoppingBag} accent="emerald" onClose={onClose} wide>
      <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
        <p className="text-[10px] font-bold text-emerald-600 uppercase">Tổng doanh thu bán (ước tính)</p>
        <p className="text-xl font-black text-emerald-700">{formatVnd(totalSold)}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">Chưa có đơn bán.</p>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] font-bold text-slate-400 uppercase">
              <th className="pb-2">Đơn</th>
              <th className="pb-2">Trạng thái</th>
              <th className="pb-2 text-right">Tiền nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="py-2">
                  <p className="font-mono text-slate-600">{r.orderId}</p>
                  <p className="text-slate-500 truncate max-w-[200px]">{r.productName}</p>
                </td>
                <td className="py-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.escrowStatus === 'completed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : r.escrowStatus === 'holding'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-orange-50 text-orange-600'
                    }`}
                  >
                    {r.escrowStatus === 'completed'
                      ? 'Đã giải phóng'
                      : r.escrowStatus === 'holding'
                        ? 'Tạm giữ'
                        : 'Hoàn 1 phần'}
                  </span>
                </td>
                <td className="py-2 text-right font-bold text-slate-800">
                  {formatVnd(r.amountVnd)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModalShell>
  );
}
