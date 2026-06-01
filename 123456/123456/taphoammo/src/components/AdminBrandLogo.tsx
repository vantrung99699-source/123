type Props = {
  onClick?: () => void;
  /** Chỉ hiện icon «T» (sidebar hẹp / mobile) */
  iconOnly?: boolean;
  className?: string;
};

/** Logo admin — đồng bộ sidebar & header (nền trắng, accent emerald). */
export function AdminBrandLogo({ onClick, iconOnly = false, className = '' }: Props) {
  const mark = (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm shadow-emerald-600/20 ring-1 ring-emerald-600/15">
      <span className="font-display text-base font-black leading-none text-white select-none">T</span>
    </div>
  );

  const wordmark = (
    <span className="font-display text-base font-black tracking-tight text-slate-900">
      Tap<span className="text-emerald-600">Hoa</span>MMO
    </span>
  );

  const inner = (
    <>
      {mark}
      {!iconOnly && wordmark}
    </>
  );

  const base =
    'inline-flex items-center gap-2.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label="Về trang TapHoaMMO"
        className={`${base} hover:opacity-90 ${className}`}
      >
        {inner}
      </button>
    );
  }

  return <div className={`${base} ${className}`}>{inner}</div>;
}
