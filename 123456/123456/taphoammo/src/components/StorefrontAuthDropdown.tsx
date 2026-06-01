/**
 * Đăng nhập / đăng ký (modern-ui). Đăng ký xong → form đăng nhập; chỉ đăng nhập mới gọi onLoginSuccess.
 */
import { useState, useEffect } from 'react';
import { Mail, User, X, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getStorefrontSignupByEmail, saveStorefrontSignup } from '../auth/storefrontDemoAccounts';
import { validateStorefrontRegister } from '../auth/storefrontRegisterValidation';
import { STOREFRONT_VIRTUAL_ACCOUNT } from '../auth/roles';

export type StorefrontLoginPayload = {
  username: string;
  email: string;
  displayName: string;
};

type Props = {
  onLoginSuccess: (p: StorefrontLoginPayload) => void;
  showSellerCta?: boolean;
};

export function StorefrontAuthDropdown({ onLoginSuccess, showSellerCta = true }: Props) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [afterRegisterHint, setAfterRegisterHint] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPassword2, setRegPassword2] = useState('');
  /** Lỗi gửi form đăng ký — hiển thị trong panel. */
  const [registerError, setRegisterError] = useState<string | null>(null);
  /** Lỗi đăng nhập — chỉ tài khoản đã đăng ký + đúng mật khẩu. */
  const [loginError, setLoginError] = useState<string | null>(null);

  const password2HasInput = regPassword2.length > 0;
  const password2Mismatch = password2HasInput && regPassword !== regPassword2;
  const password2Matches = password2HasInput && regPassword === regPassword2 && regPassword.length > 0;

  useEffect(() => {
    if (!loginOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.login-dropdown-container')) setLoginOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [loginOpen]);

  const openLogin = () => {
    setRegisterError(null);
    setLoginError(null);
    setAuthMode('login');
    setLoginOpen(true);
  };

  const openRegister = () => {
    setAfterRegisterHint(null);
    setRegisterError(null);
    setLoginError(null);
    setAuthMode('register');
    setLoginOpen(true);
  };

  const submitVirtualLogin = () => {
    setLoginError(null);
    setAfterRegisterHint(null);
    onLoginSuccess({
      username: STOREFRONT_VIRTUAL_ACCOUNT.username,
      email: STOREFRONT_VIRTUAL_ACCOUNT.email,
      displayName: STOREFRONT_VIRTUAL_ACCOUNT.displayName,
    });
    setLoginOpen(false);
    setLoginEmail('');
    setLoginPassword('');
  };

  const submitLogin = () => {
    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      setLoginError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    const stored = getStorefrontSignupByEmail(email);
    if (!stored) {
      setLoginError('Email chưa được đăng ký. Vui lòng đăng ký trước.');
      return;
    }
    if (stored.password !== loginPassword) {
      setLoginError('Mật khẩu không đúng.');
      return;
    }
    setLoginError(null);
    setAfterRegisterHint(null);
    onLoginSuccess({
      username: stored.username,
      email: stored.email,
      displayName: cap(stored.username),
    });
    setLoginOpen(false);
    setLoginPassword('');
  };

  const submitRegister = () => {
    const check = validateStorefrontRegister({
      username: regUsername,
      email: regEmail,
      password: regPassword,
      password2: regPassword2,
    });
    if (check.ok === false) {
      setRegisterError(check.message);
      return;
    }
    const username = regUsername.trim();
    const email = regEmail.trim();
    const saved = saveStorefrontSignup({ username, email, password: regPassword });
    if (saved !== true) {
      setRegisterError('Email này đã được đăng ký. Vui lòng đăng nhập.');
      return;
    }
    setRegisterError(null);
    setLoginError(null);
    setLoginEmail(email);
    setLoginPassword('');
    setRegUsername('');
    setRegEmail('');
    setRegPassword('');
    setRegPassword2('');
    setAuthMode('login');
    setAfterRegisterHint('Đăng ký thành công. Vui lòng đăng nhập bằng email và mật khẩu vừa tạo.');
  };

  return (
    <div className="relative login-dropdown-container flex flex-wrap items-center justify-end gap-2 sm:gap-3">
      {showSellerCta && (
        <button
          type="button"
          className="hidden md:flex items-center gap-2 text-xs lg:text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-3 lg:px-4 py-2 rounded-full border border-white/20 transition-all"
        >
          Đăng ký bán hàng
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          if (loginOpen && authMode === 'login') setLoginOpen(false);
          else openLogin();
        }}
        className={`text-xs sm:text-sm font-semibold transition-colors px-2.5 sm:px-3 py-2 rounded-full ${loginOpen && authMode === 'login' ? 'bg-white/20 text-white' : 'text-white hover:text-emerald-100'}`}
      >
        Đăng nhập
      </button>

      <button
        type="button"
        onClick={() => {
          if (loginOpen && authMode === 'register') setLoginOpen(false);
          else openRegister();
        }}
        className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 ${loginOpen && authMode === 'register' ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-emerald-600 hover:bg-emerald-50'}`}
      >
        Đăng ký
      </button>

      <AnimatePresence>
        {loginOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-full mt-3 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 w-[min(calc(100vw-24px),400px)] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-[100]"
          >
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all z-20"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>

              <div className="p-6 lg:p-8">
                {authMode === 'login' ? (
                  <div>
                    <div className="mb-6 lg:mb-8 text-center">
                      <h3 className="text-xl lg:text-2xl font-black text-slate-800 font-display">Đăng nhập</h3>
                      <p className="text-slate-500 text-xs lg:text-sm mt-1">Chào mừng bạn quay trở lại</p>
                    </div>
                    {afterRegisterHint && (
                      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[11px] font-semibold text-emerald-800" role="status">
                        {afterRegisterHint}
                      </div>
                    )}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          <input
                            value={loginEmail}
                            onChange={e => {
                              setLoginEmail(e.target.value);
                              if (loginError) setLoginError(null);
                            }}
                            type="text"
                            autoComplete="username"
                            placeholder="Nhập email..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Mật khẩu</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          <input
                            value={loginPassword}
                            onChange={e => {
                              setLoginPassword(e.target.value);
                              if (loginError) setLoginError(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') submitLogin();
                            }}
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                      {loginError && (
                        <div
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-800 leading-snug"
                          role="alert"
                        >
                          {loginError}
                        </div>
                      )}
                      <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                          <span className="text-[10px] text-slate-600 group-hover:text-slate-800 transition-colors">Ghi nhớ</span>
                        </label>
                        <button type="button" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                          Quên mật khẩu?
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={submitVirtualLogin}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98]"
                      >
                        Đăng nhập ngay
                      </button>
                      <div className="relative py-2 lg:py-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-100" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-white px-3 text-slate-400 font-bold tracking-widest">Hoặc</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="w-full bg-white hover:bg-slate-50 text-slate-700 py-3 rounded-2xl font-bold border border-slate-200 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Google
                      </button>
                      <div className="mt-6 text-center">
                        <p className="text-xs text-slate-500">
                          Chưa có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setAfterRegisterHint(null);
                              setRegisterError(null);
                              setLoginError(null);
                              setAuthMode('register');
                            }}
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            Đăng ký ngay
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 lg:mb-8 text-center">
                      <h3 className="text-xl lg:text-2xl font-black text-slate-800 font-display">Đăng ký</h3>
                      <p className="text-slate-500 text-xs lg:text-sm mt-1">Tham gia cộng đồng MMO</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Tài khoản</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          <input
                            value={regUsername}
                            onChange={e => {
                              setRegUsername(e.target.value);
                              if (registerError) setRegisterError(null);
                            }}
                            type="text"
                            autoComplete="username"
                            placeholder="Nhập tên tài khoản"
                            minLength={6}
                            maxLength={24}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          <input
                            value={regEmail}
                            onChange={e => {
                              setRegEmail(e.target.value);
                              if (registerError) setRegisterError(null);
                            }}
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            placeholder="example@gmail.com"
                            maxLength={254}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Mật khẩu</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          <input
                            value={regPassword}
                            onChange={e => {
                              setRegPassword(e.target.value);
                              if (registerError) setRegisterError(null);
                            }}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Tối thiểu 8 ký tự, có ít nhất một chữ cái"
                            maxLength={64}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-700 ml-1 uppercase tracking-wider">Nhập lại mật khẩu</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                          <input
                            value={regPassword2}
                            onChange={e => {
                              setRegPassword2(e.target.value);
                              if (registerError) setRegisterError(null);
                            }}
                            type="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            maxLength={64}
                            aria-invalid={password2Mismatch}
                            className={`w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all ${
                              password2Mismatch
                                ? 'border-rose-300 focus:ring-rose-500/15 focus:border-rose-400'
                                : 'border-slate-200 focus:ring-emerald-500/10 focus:border-emerald-500'
                            }`}
                          />
                        </div>
                        {password2Mismatch && (
                          <p className="text-[11px] font-semibold text-rose-600 ml-1" role="status">
                            Mật khẩu nhập lại không khớp với mật khẩu phía trên.
                          </p>
                        )}
                        {password2Matches && (
                          <p className="text-[11px] font-semibold text-emerald-600 ml-1" role="status">
                            Mật khẩu khớp.
                          </p>
                        )}
                      </div>
                      {registerError && (
                        <div
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-semibold text-rose-800 leading-snug"
                          role="alert"
                        >
                          {registerError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={submitRegister}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3.5 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                      >
                        Tạo tài khoản ngay
                      </button>
                      <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] text-emerald-700 leading-relaxed text-center">
                          Bằng cách đăng ký, bạn đồng ý với <b>Điều khoản dịch vụ</b> của chúng tôi.
                        </p>
                      </div>
                      <div className="mt-4 text-center">
                        <p className="text-xs text-slate-500">
                          Đã có tài khoản?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setAfterRegisterHint(null);
                              setRegisterError(null);
                              setLoginError(null);
                              setAuthMode('login');
                            }}
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            Đăng nhập ngay
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cap(username: string): string {
  if (!username) return 'Người dùng';
  return username.charAt(0).toUpperCase() + username.slice(1);
}
