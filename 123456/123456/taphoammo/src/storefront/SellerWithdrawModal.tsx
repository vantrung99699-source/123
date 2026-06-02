import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Wallet, X } from 'lucide-react';
import { formatVnd } from '../orderAmountDisplay';
import {
  appendSellerWithdrawal,
  validateSellerWithdrawAmount,
  type SellerWithdrawRecord,
} from './sellerWithdraw';

const VIETNAM_BANKS = [
  'Vietcombank (VCB)',
  'BIDV',
  'Techcombank (TCB)',
  'MB Bank (MB)',
  'Sacombank (STB)',
];

export interface SellerWithdrawModalProps {
  open: boolean;
  onClose: () => void;
  sellerEmail: string;
  /** Số dư khả dụng rút (doanh thu đã giải phóng − đã rút). */
  withdrawableVnd: number;
  onSuccess: (record: SellerWithdrawRecord) => void;
}

export function SellerWithdrawModal({
  open,
  onClose,
  sellerEmail,
  withdrawableVnd,
  onSuccess,
}: SellerWithdrawModalProps) {
  const [amountInput, setAmountInput] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setAmountInput('');
    setBankName('');
    setAccountHolder('');
    setAccountNumber('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    const digits = amountInput.replace(/[^\d]/g, '');
    const amountVnd = parseInt(digits, 10) || 0;
    const validation = validateSellerWithdrawAmount(amountVnd, withdrawableVnd);
    if (validation) {
      setError(validation);
      return;
    }
    if (!bankName.trim()) {
      setError('Chọn ngân hàng');
      return;
    }
    if (!accountHolder.trim()) {
      setError('Nhập tên người thụ hưởng');
      return;
    }
    if (!accountNumber.trim()) {
      setError('Nhập số tài khoản');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const record = appendSellerWithdrawal(sellerEmail, {
        amountVnd,
        bankName,
        accountHolder,
        accountNumber,
      });
      onSuccess(record);
      handleClose();
    } catch {
      setError('Không thể gửi yêu cầu rút. Thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillMax = () => {
    if (withdrawableVnd > 0) {
      setAmountInput(String(withdrawableVnd));
      setError(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Wallet size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Yêu cầu rút tiền</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Khả dụng rút:{' '}
                    <span className="font-bold text-emerald-600 tabular-nums">
                      {formatVnd(withdrawableVnd)}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                <p className="text-sm text-emerald-700 leading-relaxed">
                  Số tiền tối thiểu 500.000đ, bội số 100.000đ. Sau khi rút, số khả dụng rút giảm đúng số tiền đã
                  rút.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Số tiền</label>
                  <button
                    type="button"
                    onClick={fillMax}
                    disabled={withdrawableVnd <= 0}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-40"
                  >
                    Rút tối đa
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountInput}
                  onChange={e => {
                    setAmountInput(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="500000"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tên ngân hàng</label>
                <div className="relative">
                  <select
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm appearance-none pr-10"
                  >
                    <option value="">Chọn...</option>
                    {VIETNAM_BANKS.map(b => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Người thụ hưởng</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Số tài khoản</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {error && (
                <p className="text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={submitting || withdrawableVnd <= 0}
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý…' : 'Rút tiền'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
