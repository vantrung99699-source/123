import type { Order } from '../ordersTypes';
import { getOrderRefundDisplay, hasPendingRefundOffer } from '../orderRefund';

export function OrderRefundCell({ order }: { order: Order }) {
  const { main, sub } = getOrderRefundDisplay(order);
  const pending = hasPendingRefundOffer(order);

  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[88px]">
      <span
        className={`text-xs font-bold tabular-nums whitespace-nowrap ${
          pending ? 'text-amber-700' : main === '0đ' ? 'text-slate-400' : 'text-emerald-700'
        }`}
        title={sub ? `${main} — ${sub}` : main}
      >
        {main}
      </span>
      {sub && (
        <span className="text-[9px] font-semibold text-slate-500 leading-tight text-center max-w-[160px] line-clamp-2">
          {sub}
        </span>
      )}
    </div>
  );
}
