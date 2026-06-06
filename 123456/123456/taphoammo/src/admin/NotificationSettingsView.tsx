/**
 * Cài đặt thông báo storefront — marquee, popup toàn trang, toast.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Megaphone,
  Monitor,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  defaultStorefrontNotificationSettings,
  readStorefrontNotificationSettings,
  writeStorefrontNotificationSettings,
  type AdminStorefrontNotificationSettings,
} from './adminStorefrontNotificationSettings';

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer group">
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
          {label}
        </p>
        {hint ? <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{hint}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export function NotificationSettingsView() {
  const [settings, setSettings] = useState<AdminStorefrontNotificationSettings>(() =>
    readStorefrontNotificationSettings()
  );
  const [savedHint, setSavedHint] = useState<string | null>(null);

  useEffect(() => {
    if (!savedHint) return;
    const t = window.setTimeout(() => setSavedHint(null), 2800);
    return () => window.clearTimeout(t);
  }, [savedHint]);

  const patch = (partial: Partial<AdminStorefrontNotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  const handleSave = () => {
    writeStorefrontNotificationSettings(settings);
    setSettings(readStorefrontNotificationSettings());
    setSavedHint('Đã lưu — thông báo cập nhật trên trang mua hàng.');
  };

  const handleReset = () => {
    const next = defaultStorefrontNotificationSettings();
    setSettings(next);
    writeStorefrontNotificationSettings(next);
    setSavedHint('Đã khôi phục mặc định.');
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Bell size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cài đặt thông báo</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Cấu hình thông báo hiển thị cho khách trên storefront
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
            >
              <RotateCcw size={16} />
              Mặc định
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
            >
              <Save size={16} />
              Lưu cài đặt
            </button>
          </div>
        </div>

        {savedHint ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold"
          >
            {savedHint}
          </motion.div>
        ) : null}

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
            <Megaphone size={18} className="text-red-500" />
            <h2 className="text-sm font-bold text-slate-800">Thanh chữ chạy (marquee)</h2>
          </div>
          <div className="p-5 space-y-4">
            <ToggleRow
              label="Bật thanh chữ chạy"
              hint="Hiển thị dải thông báo đỏ ngay dưới header trang mua hàng."
              checked={settings.marqueeEnabled}
              onChange={v => patch({ marqueeEnabled: v })}
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-800">Nội dung chạy</span>
              <textarea
                rows={3}
                value={settings.marqueeText}
                onChange={e => patch({ marqueeText: e.target.value })}
                disabled={!settings.marqueeEnabled}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 resize-y min-h-[80px]"
                placeholder="Nhập nội dung thông báo chạy…"
              />
            </label>
            {settings.marqueeEnabled && settings.marqueeText.trim() ? (
              <div className="overflow-hidden py-1.5 bg-slate-50 border border-red-100 rounded-lg">
                <p className="text-[12px] font-medium text-red-600 px-4 whitespace-nowrap animate-pulse">
                  {settings.marqueeText}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
            <Monitor size={18} className="text-violet-600" />
            <h2 className="text-sm font-bold text-slate-800">Popup toàn trang</h2>
          </div>
          <div className="p-5 space-y-4">
            <ToggleRow
              label="Bật popup toàn trang"
              hint="Modal phủ toàn màn hình khi khách mở storefront (đã đăng nhập)."
              checked={settings.popupEnabled}
              onChange={v => patch({ popupEnabled: v })}
            />
            <ToggleRow
              label="Chỉ hiện một lần mỗi phiên"
              hint="Sau khi bấm đóng, không hiện lại cho đến khi mở tab/trình duyệt mới."
              checked={settings.popupOncePerSession}
              onChange={v => patch({ popupOncePerSession: v })}
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-800">Tiêu đề popup</span>
              <input
                type="text"
                value={settings.popupTitle}
                onChange={e => patch({ popupTitle: e.target.value })}
                disabled={!settings.popupEnabled}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-800">Nội dung popup</span>
              <textarea
                rows={5}
                value={settings.popupContent}
                onChange={e => patch({ popupContent: e.target.value })}
                disabled={!settings.popupEnabled}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 resize-y"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-800">Nút xác nhận</span>
              <input
                type="text"
                value={settings.popupButtonLabel}
                onChange={e => patch({ popupButtonLabel: e.target.value })}
                disabled={!settings.popupEnabled}
                className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/80">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">Toast góc màn hình</h2>
          </div>
          <div className="p-5 space-y-4">
            <ToggleRow
              label="Bật toast thông báo"
              hint="Thẻ nhỏ góc phải dưới, tự ẩn sau vài giây."
              checked={settings.toastEnabled}
              onChange={v => patch({ toastEnabled: v })}
            />
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-slate-800">Nội dung toast</span>
              <input
                type="text"
                value={settings.toastText}
                onChange={e => patch({ toastText: e.target.value })}
                disabled={!settings.toastEnabled}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </label>
          </div>
        </section>

        <p className="text-xs text-slate-400 leading-relaxed pb-8">
          Lưu ý: Cài đặt áp dụng ngay trên trang storefront sau khi bấm «Lưu cài đặt». Popup «một lần mỗi phiên»
          dùng session trình duyệt — mở cửa sổ ẩn danh để kiểm tra lại.
        </p>
      </div>
    </div>
  );
}
