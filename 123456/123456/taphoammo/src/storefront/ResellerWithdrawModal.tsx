import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Wallet, X } from 'lucide-react';
import { formatVnd } from '../orderAmountDisplay';
import {
  appendResellerWithdrawal,
  validateResellerWithdrawAmount,
  type ResellerWithdrawRecord,
} from './resellerWithdraw';

const RESELLER_BANKS = [
  'Vietcombank (VCB)',
  'BIDV',
  'Techcombank (TCB)',
  'MB Bank (MB)',
  'Sacombank (STB)',
];

export interface ResellerWithdrawModalProps {
  open: boolean;
  onClose: () => void;
  referrerEmail: string;
  withdrawableVnd: number;
  onSuccess: (record: ResellerWithdrawRecord) => void;
}

export function ResellerWithdrawModal({
  open,
  onClose,
  referrerEmail,
  withdrawableVnd,
  onSuccess,
}: ResellerWithdrawModalProps) {
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
    const validation = validateResellerWithdrawAmount(amountVnd, withdrawableVnd);
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
      const record = appendResellerWithdrawal(referrerEmail, {
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
          onClick={(e) => {
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
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Wallet size={18} className="text-violet-700" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Rút tiền Reseller</h2>
                  <p className="text-[11px] text-slate-500">
                    Tối đa: <span className="font-bold text-amber-700">{formatVnd(withdrawableVnd)}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-violet-50/80 border border-violet-100 rounded-xl p-3 text-xs text-violet-800 leading-relaxed">
                Chỉ rút trong hạn mức <strong>Số tiền rút được</strong> (hoa hồng đơn đã hoàn thành trừ phần đã
                rút).
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Số tiền rút <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountInput}
                    onChange={(e) => {
                      setAmountInput(e.target.value.replace(/[^\d]/g, ''));
                      setError(null);
                    }}
                    placeholder="Nhập số tiền"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tabular-nums focus:bg-white focus:border-violet-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={fillMax}
                    disabled={withdrawableVnd <= 0}
                    className="shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-40"
                  >
                    Rút tối đa
                  </button>
                </div>
                {amountInput && (
                  <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                    ≈ {formatVnd(parseInt(amountInput, 10) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Ngân hàng <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:border-violet-500 outline-none"
                  >
                    <option value="">Chọn ngân hàng</option>
                    {RESELLER_BANKS.map((b) => (
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

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Người thụ hưởng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-violet-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Số tài khoản <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\s/g, ''))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:border-violet-500 outline-none"
                />
              </div>

              {error && (
                <p className="text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting || withdrawableVnd <= 0}
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 shadow-md shadow-violet-500/20"
              >
                {submitting ? 'Đang xử lý…' : 'Xác nhận rút tiền'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
