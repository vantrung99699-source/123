import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  Facebook,
  Phone,
  Store,
  User,
  X,
} from 'lucide-react';
import { StorefrontTelegramConnectPanel } from '../components/StorefrontTelegramConnectPanel';
import {
  getSellerRegistrationByEmail,
  hasPendingSellerRegistration,
  isSellerRegistrationApproved,
  submitSellerRegistration,
} from './storefrontSellerRegistration';

export interface StorefrontSellerRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userEmail: string;
  displayName: string;
  telegramLinked: boolean;
  onMarkTelegramLinked: () => void;
  onRequireLogin?: () => void;
  onSuccess?: (autoApproved?: boolean) => void;
}

export function StorefrontSellerRegistrationModal({
  open,
  onClose,
  isLoggedIn,
  userEmail,
  displayName,
  telegramLinked,
  onMarkTelegramLinked,
  onRequireLogin,
  onSuccess,
}: StorefrontSellerRegistrationModalProps) {
  const [fullName, setFullName] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [autoApprovedSuccess, setAutoApprovedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(telegramLinked);

  const pendingRegistration = isLoggedIn && hasPendingSellerRegistration(userEmail);
  const approvedRegistration = isLoggedIn && isSellerRegistrationApproved(userEmail);

  useEffect(() => {
    if (!open) return;
    setTelegramConnected(telegramLinked);
    setError(null);
    setSuccess(false);
    setAutoApprovedSuccess(false);
    setSubmitting(false);
    setFullName(displayName.trim());
    setFacebookUrl('');
    setPhone('');
    if (isLoggedIn && hasPendingSellerRegistration(userEmail)) {
      const existing = getSellerRegistrationByEmail(userEmail);
      if (existing) {
        setFullName(existing.fullName);
        setFacebookUrl(existing.facebookUrl);
        setPhone(existing.phone);
      }
    }
  }, [open, telegramLinked, displayName, isLoggedIn, userEmail]);

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleMarkTelegram = () => {
    onMarkTelegramLinked();
    setTelegramConnected(true);
  };

  const canSubmit =
    isLoggedIn &&
    telegramConnected &&
    !pendingRegistration &&
    !approvedRegistration &&
    !success;

  const handleSubmit = () => {
    if (!isLoggedIn) {
      setError('Vui lòng đăng nhập để đăng ký bán hàng.');
      onRequireLogin?.();
      return;
    }
    if (!telegramConnected) {
      setError('Bạn cần kết nối Telegram trước khi đăng ký bán hàng.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = submitSellerRegistration(userEmail, { fullName, facebookUrl, phone });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setAutoApprovedSuccess(result.autoApproved === true);
    setSuccess(true);
    onSuccess?.(result.autoApproved === true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
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
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Store size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Đăng ký bán hàng</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Mở gian hàng trên TapHoaMMO</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {!isLoggedIn && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">Bạn cần đăng nhập trước</p>
                  <p className="mt-1 text-amber-800/90">
                    Vui lòng đăng nhập tài khoản TapHoaMMO, kết nối Telegram rồi điền form đăng ký bán hàng.
                  </p>
                  {onRequireLogin && (
                    <button
                      type="button"
                      onClick={onRequireLogin}
                      className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                    >
                      Đăng nhập ngay
                    </button>
                  )}
                </div>
              )}

              {isLoggedIn ? (
                <StorefrontTelegramConnectPanel
                  connected={telegramConnected}
                  onMarkConnectedDemo={handleMarkTelegram}
                />
              ) : (
                <div className="rounded-2xl bg-slate-100/90 px-4 py-4 text-sm text-slate-600 leading-relaxed">
                  Đăng nhập trước, sau đó kết nối Telegram (@TaphoaMMO_bot) để hoàn tất đăng ký bán hàng.
                </div>
              )}

              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
                  <p className="text-base font-bold text-emerald-900">
                    {autoApprovedSuccess ? 'Đăng ký bán hàng đã được duyệt' : 'Đã gửi đăng ký bán hàng'}
                  </p>
                  <p className="text-sm text-emerald-800/90 mt-2 leading-relaxed">
                    {autoApprovedSuccess
                      ? 'Chúc mừng! Bạn đã nhận thông báo và tin nhắn từ TapHoaMMO Hỗ trợ. Mở mục Nhắn tin để xem hướng dẫn tiếp theo.'
                      : 'Đội ngũ TapHoaMMO sẽ liên hệ qua Telegram hoặc số điện thoại bạn cung cấp trong thời gian sớm nhất.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-4 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <>
                  {approvedRegistration && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                      Tài khoản của bạn đã được duyệt đăng ký bán hàng. Liên hệ hỗ trợ nếu cần mở gian hàng.
                    </div>
                  )}

                  {pendingRegistration && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                      Bạn đã gửi đăng ký và đang chờ duyệt. Vui lòng chờ đội ngũ liên hệ.
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="seller-reg-name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <User size={15} className="text-emerald-600" /> Họ và tên
                      </label>
                      <input
                        id="seller-reg-name"
                        type="text"
                        value={fullName}
                        onChange={e => {
                          setFullName(e.target.value);
                          if (error) setError(null);
                        }}
                        disabled={!isLoggedIn || pendingRegistration || approvedRegistration}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="seller-reg-fb" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Facebook size={15} className="text-emerald-600" /> Link Facebook liên hệ
                      </label>
                      <input
                        id="seller-reg-fb"
                        type="url"
                        value={facebookUrl}
                        onChange={e => {
                          setFacebookUrl(e.target.value);
                          if (error) setError(null);
                        }}
                        disabled={!isLoggedIn || pendingRegistration || approvedRegistration}
                        placeholder="https://facebook.com/ten-ban"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="seller-reg-phone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Phone size={15} className="text-emerald-600" /> Số điện thoại (SDT)
                      </label>
                      <input
                        id="seller-reg-phone"
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value);
                          if (error) setError(null);
                        }}
                        disabled={!isLoggedIn || pendingRegistration || approvedRegistration}
                        placeholder="0912345678"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-emerald-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!canSubmit || submitting}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:brightness-[1.03] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
