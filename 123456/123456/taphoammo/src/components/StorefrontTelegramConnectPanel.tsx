import { CheckCircle2, Info } from 'lucide-react';

export const TAPHOAMMO_TELEGRAM_BOT_URL = 'https://t.me/TaphoaMMO_bot';

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.82.42z" />
    </svg>
  );
}

const CONNECT_STEPS = [
  'Nhấn nút "Kết nối Telegram" bên dưới',
  'Bạn sẽ được chuyển đến bot Telegram',
  'Nhấn "Start" hoặc "Bắt đầu" trong Telegram',
  'Hoàn tất! Bạn sẽ nhận được thông báo xác nhận',
];

export interface StorefrontTelegramConnectPanelProps {
  connected?: boolean;
  onMarkConnectedDemo?: () => void;
  showDemoMark?: boolean;
}

export function StorefrontTelegramConnectPanel({
  connected = false,
  onMarkConnectedDemo,
  showDemoMark = true,
}: StorefrontTelegramConnectPanelProps) {
  if (connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white">
            <CheckCircle2 size={24} strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Đã kết nối Telegram</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Tài khoản đã liên kết @TaphoaMMO_bot — bạn sẽ nhận thông báo realtime từ sàn.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-100/90 px-4 py-4">
        <div className="w-12 h-12 rounded-full bg-slate-200/90 flex items-center justify-center shrink-0">
          <TelegramIcon className="w-6 h-6 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Chưa kết nối Telegram</p>
          <p className="text-xs text-slate-500 mt-0.5">Kết nối để nhận thông báo realtime</p>
        </div>
      </div>

      <div className="rounded-2xl bg-sky-50 border border-sky-100/90 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-sky-600 shrink-0" />
          <p className="text-sm font-bold text-sky-700">Hướng dẫn kết nối</p>
        </div>
        <ol className="space-y-2.5">
          {CONNECT_STEPS.map((step, index) => (
            <li key={step} className="flex gap-2.5 text-sm text-sky-800 leading-snug">
              <span className="font-bold text-sky-700 shrink-0 tabular-nums">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <a
        href={TAPHOAMMO_TELEGRAM_BOT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-full bg-[#2AABEE] hover:bg-[#229ED9] text-white text-sm font-bold transition-colors shadow-md shadow-sky-500/20"
      >
        <TelegramIcon className="w-5 h-5" />
        Kết nối Telegram
      </a>

      {showDemoMark && onMarkConnectedDemo && (
        <button
          type="button"
          onClick={onMarkConnectedDemo}
          className="w-full py-2.5 rounded-xl text-xs font-bold text-[#229ED9] hover:bg-sky-50 transition-colors"
        >
          Đánh dấu đã kết nối (demo)
        </button>
      )}
    </div>
  );
}
